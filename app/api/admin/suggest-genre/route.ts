// app/api/admin/suggest-genre/route.ts
//
// Визначення жанру твору через Gemini — для екрана «Жанри».
//
// Модель обирає СУВОРО з канонічного переліку (lib/genres.ts) і повертає
// впевненість. Нічого не зберігає: рішення лишається за редактором, бо жанр
// видно читачам і за ним працюють фільтри.
//
// Приймає або перелік id творів, або текст напряму.

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { GENRES, isGenre, normalizeGenre } from '@/lib/genres'
import { toPlainText } from '@/lib/plain-text'

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

const MODELS = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-2.5-flash']

/** Скільки тексту показувати моделі: жанр видно з початку, решта — марні витрати. */
const SAMPLE_CHARS = 4000

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

function buildPrompt(title: string, text: string): string {
  return `Ти — редактор української літературної платформи. Визнач жанр твору.

ОБИРАЙ СУВОРО ОДИН З ЦЬОГО ПЕРЕЛІКУ, слово в слово:
${GENRES.map(g => `- ${g}`).join('\n')}

ЯК РОЗРІЗНЯТИ:
- «Життєві історії» — побутова проза про звичайних людей, без вираженої іншої жанрової ознаки. Це найчастіший випадок; бери його, коли не підходить нічого точнішого. Сюди ж історії про тварин як справжніх істот і різдвяні історії без інших ознак.
- «Сімейна історія» — у центрі стосунки рідних: батьки й діти, свекрухи, брати й сестри, спадок, рід.
- «Про кохання» — у центрі любовна лінія та її розв'язка.
- «Військова проза» — війна: фронт, окупація, втрата близьких на війні, повернення військового, тил під обстрілами. Це сильніша ознака за «Драму»: якщо війна є суттю твору, бери цей жанр.
- «Драма» — тяжка втрата, хвороба, важкий моральний вибір; тон серйозний. Сюди ж психологічна та історична проза, якщо немає точнішої ознаки. Якщо йдеться саме про війну — бери «Військова проза».
- «Гумор» — комічні ситуації, іронія, сміх є метою.
- «Містика» — надприродне, віщі сни, потойбічне, страшне без пояснення. Сюди ж фантастика та жахи.
- «Детектив» — є злочин або таємниця, яку розслідують. Сюди ж трилер і пригодницька дія з небезпекою.
- «Казка» — вигаданий світ, чари, повчальна історія для дітей. Сюди ж дитячі оповідання.

ВІДПОВІДЬ — ЛИШЕ JSON, без пояснень, без розмітки:
{"genre":"<точна назва з переліку>","confidence":<число від 0 до 100>,"why":"<до 8 слів українською>"}

confidence — наскільки ти впевнений. Якщо твір рівною мірою підходить під два жанри, став менше 70.

Назва твору: «${title}»

Початок тексту:
"""
${text}
"""`
}

async function askModel(apiKey: string, model: string, prompt: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const m = genAI.getGenerativeModel({ model, safetySettings: SAFETY }, { apiVersion: 'v1beta' })
  const result = await m.generateContent(prompt)
  const raw = result.response.text().trim().replace(/```json|```/g, '').trim()
  return JSON.parse(raw) as { genre?: string; confidence?: number; why?: string }
}

function isBlocked(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /PROHIBITED_CONTENT|blocked|SAFETY|Text not available/i.test(msg)
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  const body = await req.json() as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids.slice(0, 20) : []
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Не вказано творів' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { data: rows, error } = await db
    .from('content')
    .select('id, title, text, corrected_text, humanized_text, published_version')
    .in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: Array<{ id: string; genre: string | null; confidence: number; why: string; error?: string }> = []

  for (const row of rows ?? []) {
    const v = row.published_version ?? 'original'
    const source =
      (v === 'humanized' || v === 'corrected_humanized') && row.humanized_text
        ? row.humanized_text
        : v === 'corrected' && row.corrected_text
          ? row.corrected_text
          : row.text

    const sample = toPlainText(source ?? '').slice(0, SAMPLE_CHARS)
    if (!sample.trim()) {
      results.push({ id: row.id, genre: null, confidence: 0, why: '', error: 'Порожній текст' })
      continue
    }

    const prompt = buildPrompt(row.title ?? '', sample)
    let done = false
    // Що саме відповіла модель, коли відповідь не лягла в перелік. Без цього
    // редактор бачив глухе «не дала відповіді» й не міг зрозуміти причину.
    let lastRaw = ''
    let lastErr = ''

    for (const model of MODELS) {
      try {
        const answer = await askModel(apiKey, model, prompt)
        const said = typeof answer.genre === 'string' ? answer.genre.trim() : ''

        // Спершу точний збіг, далі — приведення синонімів. Модель часто
        // відповідає формою («Оповідання») або старою назвою («Психологічна
        // проза»); normalizeGenre знає ці відповідності, і відкидати такі
        // відповіді як помилкові було б втратою готового результату.
        const genre = isGenre(said) ? said : normalizeGenre(said)

        if (!genre) {
          if (said) lastRaw = said
          continue
        }

        results.push({
          id: row.id,
          genre,
          confidence: Math.max(0, Math.min(100, Number(answer.confidence) || 0)),
          // Якщо жанр довелося приводити до канону, показуємо це редакторові.
          why: (isGenre(said) ? '' : `(${said}) `) +
               (typeof answer.why === 'string' ? answer.why.slice(0, 60) : ''),
        })
        done = true
        break
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Помилка'
        if (isBlocked(err)) { lastErr = 'заблоковано перевіркою вмісту'; continue }
        if (/not found|404|unsupported/i.test(msg)) { lastErr = `модель ${model} недоступна`; continue }
        if (err instanceof SyntaxError) { lastErr = 'відповідь не JSON'; continue }
        results.push({ id: row.id, genre: null, confidence: 0, why: '', error: msg })
        done = true
        break
      }
    }

    if (!done) {
      const why = lastRaw
        ? `Модель каже «${lastRaw}» — такого жанру немає в переліку`
        : lastErr
          ? `Не вдалося: ${lastErr}`
          : 'Модель не дала відповіді'
      results.push({ id: row.id, genre: null, confidence: 0, why: '', error: why })
    }
  }

  return NextResponse.json({ results })
}
