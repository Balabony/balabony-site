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
import { GENRES, isGenre } from '@/lib/genres'
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
- «Життєві історії» — побутова проза про звичайних людей, без вираженої іншої жанрової ознаки. Це найчастіший випадок; бери його, коли не підходить нічого точнішого.
- «Сімейна історія» — у центрі стосунки рідних: батьки й діти, свекрухи, брати й сестри, спадок, рід.
- «Романтика» — у центрі любовна лінія та її розв'язка.
- «Драма» — тяжка втрата, хвороба, важкий моральний вибір; тон серйозний. Якщо йдеться саме про війну — бери «Військова проза».
- «Гумор» — комічні ситуації, іронія, сміх є метою.
- «Казка» — вигаданий світ, чари, повчальна історія для дітей.
- «Про тварин» — у центрі тварина як справжня істота, а не казковий персонаж: кіт, пес, кінь, лелека. Якщо тварина говорить і є чари — то «Казка».
- «Військова проза» — війна: фронт, окупація, втрата близьких на війні, повернення військового, тил під обстрілами. Це сильніша ознака за «Драму»: якщо війна є суттю твору, бери цей жанр.
- «Різдвяна історія» — дія на Різдво, Святвечір, Новий рік або Миколая, і свято є суттю: диво, подарунок, примирення. Просто згадка про зиму цього не робить.
- «Детектив» — є злочин або таємниця, яку розслідують.
- «Містика» — надприродне, віщі сни, потойбічне, страшне без пояснення.
- «Історична проза» — дія у визначену історичну добу, минуле є суттю твору.
- «Фантастика» — майбутнє, техніка, інші світи, наукове припущення.
- «Пригоди» — подорож, небезпека, динамічна дія.

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

    for (const model of MODELS) {
      try {
        const answer = await askModel(apiKey, model, prompt)
        const genre = typeof answer.genre === 'string' ? answer.genre.trim() : ''
        if (!isGenre(genre)) {
          // Модель вигадала жанр поза переліком — пробуємо наступну.
          continue
        }
        results.push({
          id: row.id,
          genre,
          confidence: Math.max(0, Math.min(100, Number(answer.confidence) || 0)),
          why: typeof answer.why === 'string' ? answer.why.slice(0, 60) : '',
        })
        done = true
        break
      } catch (err) {
        if (isBlocked(err)) continue
        results.push({ id: row.id, genre: null, confidence: 0, why: '', error: err instanceof Error ? err.message : 'Помилка' })
        done = true
        break
      }
    }

    if (!done) {
      results.push({ id: row.id, genre: null, confidence: 0, why: '', error: 'Модель не дала відповіді' })
    }
  }

  return NextResponse.json({ results })
}
