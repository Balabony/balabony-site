import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Батч-генерація гачка «ДАЛІ БУДЕ» (next_teaser) для серій «Тиші».
 *
 * Аналог /api/admin/next-teaser-batch (Балабони) з трьома відмінностями,
 * кожна з яких тут обовʼязкова.
 *
 * 1. ПРОМПТ. «Тиша» — дорослий воєнний серіал, не сільська комедія. Обмеження
 *    взято з tysha-hook-batch: героя називати лише «Максим» або «він»,
 *    позивний «Тихий» не вживати, не розкривати наскрізних таємниць і не
 *    називати поранень, каліцтв чи смерті персонажів.
 *    Для гачка «далі буде» ця заборона ЖОРСТКІША, ніж для картки: він тягне
 *    саме в наступну серію, тож проговоритися найлегше.
 *
 * 2. БЛОКУВАННЯ. Gemini регулярно блокує серії «Тиші» через воєнний зміст.
 *    Без обходу прогін зупиниться на першій заблокованій серії, а наступний
 *    запуск вибере ту саму — вічний цикл. Тому клієнт накопичує id
 *    пропущених у skipIds, а вибірка їх виключає. Той самий механізм, що в
 *    tysha-hook-batch.
 *
 * 3. КОНТЕКСТ. Модель бачить кінець поточної серії Й початок наступної:
 *    гачок, написаний лише з поточної, обіцяв би не те, що читач знайде.
 *    Остання серія сезону пропускається — вести нема куди.
 *
 * Уже наявні next_teaser НЕ чіпаються.
 */

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

const VISIBLE_STATUSES = ['published', 'scheduled']

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

type Row = {
  id: string
  title: string | null
  text: string | null
  corrected_text: string | null
  humanized_text: string | null
  published_version: string | null
  next_teaser: string | null
  season_number: number | null
  episode_number: number | null
}

/** Та сама логіка, що в lib/readingTime.ts: який текст справді опубліковано. */
function body(c: Row): string {
  const v = c.published_version ?? 'original'
  if ((v === 'humanized' || v === 'corrected_humanized') && c.humanized_text) return c.humanized_text
  if (v === 'corrected' && c.corrected_text) return c.corrected_text
  return c.text ?? ''
}

function buildPrompt(tail: string, head: string, thisTitle: string, nextTitle: string): string {
  return `Ти — досвідчений редактор дорослого українського серіалу «Тиша». Напиши блок «ДАЛІ БУДЕ» — два-три речення в кінці серії, які ведуть читача в НАСТУПНУ серію.

ГОЛОВНЕ: це місток, а не анонс. Читач щойно дочитав — і має захотіти дізнатися, що далі.

ФОРМАТ:
- 2-3 короткі речення, разом до ~45 слів.
- Проста, чиста, жива мова. Без пафосу.
- Відштовхнись від стану, яким скінчилася ця серія, і переведи в наступну.
- Лиши недомовленість: напруга є, розв'язки немає.

ІМʼЯ ГОЛОВНОГО ГЕРОЯ:
- Тільки «Максим» або «він». Позивний «Тихий» не вживай.

ЗАБОРОНЕНО (найважливіше — гачок «далі буде» проговорюється найлегше):
- Спойлер того, чим скінчиться наступна серія. Обіцянка, не відповідь.
- РОЗКРИТТЯ НАСКРІЗНИХ ТАЄМНИЦЬ серіалу: хто живий, хто загинув, чим скінчилась лінія персонажа.
- Називати поранення, каліцтва чи смерть конкретних персонажів.
- Переказ послідовності дій, пояснення мотивів.
- Заклики «читай далі», «не пропусти», «дізнайся» — гачок працює сам.
- Передвісники «але раптом», «ще не знав», канцелярит.
- Імена й події, яких немає в наданих текстах.

ПОГАНО (переказ і спойлер): «Наступного дня Максим піде на завдання, потрапить у засідку і втратить товариша.»
ДОБРЕ (стан + недомовка): «Він заснув лише над ранок. А до світанку в штабі вже знали те, чого йому ще ніхто не сказав.»

Поверни ТІЛЬКИ текст гачка українською, без лапок навколо нього, без пояснень і без заголовків.

Чим закінчилася серія «${thisTitle}»:
"""
${tail}
"""

Про що наступна серія «${nextTitle}»:
"""
${head}
"""`
}

async function tryGenerate(apiKey: string, model: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const m = genAI.getGenerativeModel({ model, safetySettings: SAFETY }, { apiVersion: 'v1beta' })
  const result = await m.generateContent(prompt)
  return result.response.text().trim().replace(/^["«»]+|["«»]+$/g, '').trim()
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

  let skipIds: string[] = []
  try {
    const b = (await req.json()) as { skipIds?: unknown }
    if (Array.isArray(b?.skipIds)) skipIds = b.skipIds.map(String).slice(0, 500)
  } catch {
    // Тіла немає — перший виклик прогону. Це нормально.
  }

  const supabase = getSupabaseAdmin()

  const { data: all, error: selErr } = await supabase
    .from('content')
    .select('id, title, text, corrected_text, humanized_text, published_version, next_teaser, season_number, episode_number')
    .eq('type', 'tysha')
    .in('status', VISIBLE_STATUSES)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }

  const rows = (all ?? []) as Row[]
  const skip = new Set(skipIds)

  const needs = (c: Row, i: number) => {
    const next = rows[i + 1]
    return !(c.next_teaser ?? '').trim()
      && next
      && next.season_number === c.season_number
      && body(c).trim().length > 0
      && body(next).trim().length > 0
  }

  const total = rows.length
  const remainingBefore = rows.filter((c, i) => needs(c, i) && !skip.has(c.id)).length
  const idx = rows.findIndex((c, i) => needs(c, i) && !skip.has(c.id))

  if (idx === -1) {
    return NextResponse.json({ done: true, total, remaining: 0, processed: null })
  }

  const target = rows[idx]
  const next = rows[idx + 1]
  const tail = body(target).trim().slice(-1200)
  const head = body(next).trim().slice(0, 2000)

  const prompt = buildPrompt(tail, head, target.title ?? '', next.title ?? '')

  const models = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-2.5-flash']
  let lastErr: unknown = null
  let teaser = ''

  for (const model of models) {
    try {
      teaser = await tryGenerate(apiKey, model, prompt)
      if (teaser) break
      lastErr = new Error('Порожня відповідь')
    } catch (err) {
      lastErr = err
      if (isBlocked(err)) continue // блокування — пробуємо наступну модель
      break // мережа або ключ — далі пробувати нема сенсу
    }
  }

  if (!teaser) {
    if (isBlocked(lastErr)) {
      // Пропускаємо серію й ідемо далі — прогін не зупиняється. Для таких
      // гачок пишеться вручну в редакторі серії.
      return NextResponse.json({
        done: false,
        total,
        remaining: Math.max(0, remainingBefore - 1),
        skipped: {
          id: target.id,
          title: target.title,
          season: target.season_number,
          episode: target.episode_number,
        },
        processed: null,
      })
    }
    const msg = lastErr instanceof Error ? lastErr.message : 'Помилка API'
    return NextResponse.json({ error: msg, targetId: target.id }, { status: 500 })
  }

  const { error: updErr } = await supabase
    .from('content')
    .update({ next_teaser: teaser })
    .eq('id', target.id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message, targetId: target.id }, { status: 500 })
  }

  return NextResponse.json({
    done: false,
    total,
    remaining: Math.max(0, remainingBefore - 1),
    processed: {
      id: target.id,
      title: target.title,
      season: target.season_number,
      episode: target.episode_number,
      teaser,
    },
  })
}
