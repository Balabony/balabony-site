import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Батч-генерація гачка (hook) для карток серій «Тиші»: фронтенд викликає цей
// endpoint у циклі, доки done=true. Аналог /api/admin/hook-batch (Балабони),
// але з двома суттєвими відмінностями.
//
// 1. ПРОМПТ. Тон «Тиші» протилежний «Балабонам»: дорослий воєнний серіал, не
//    сільська комедія. Промпт узято дослівно з /api/admin/hook (поодинока
//    генерація), щоб пакетний і поодинокий режими давали однаковий результат.
//
// 2. БЛОКУВАННЯ. Gemini регулярно блокує серії «Тиші» через воєнний зміст
//    (полон, поранення). У «Балабонах» такого немає. Якщо просто повертати
//    помилку, як робить hook-batch, весь прогін зупиниться на першій же
//    заблокованій серії. Гірше: наступний запуск вибере ТУ САМУ серію і
//    впреться в неї знову — вічний цикл.
//    Тому: клієнт накопичує id пропущених серій і надсилає їх у skipIds,
//    а вибірка їх виключає. Прогін іде далі, пропущені показуються окремо —
//    для них гачок пишеться вручну в редакторі серії.
//
// Уже наявні hook НЕ чіпаються — запуск можна повторювати, продовжить з місця.

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

function buildPrompt(text: string, titleLine: string): string {
  return `Ти — досвідчений редактор дорослого українського серіалу «Тиша». Прочитай серію й напиши ГАЧОК для картки — коротку приманку, що інтригує.

ГОЛОВНЕ: гачок — це НЕ переказ подій. Це образ або натяк, що змушує захотіти прочитати.

ФОРМАТ:
- 1 речення. Максимум 2 дуже короткі.
- Проста, чиста, жива мова.

ЩО РОБИТИ:
- Візьми головний ОБРАЗ або внутрішній стан серії (не послідовність дій) і подай як загадку.
- Лиши недомовленість: читач має відчути напругу, але не знати розв'язки.

ЗАБОРОНЕНО (вбиває гачок):
- Переказ сюжету: «Максима кидають на завдання і йому доводиться…», «герой іде туди і робить те».
- Пояснення мотивів: «щоб навчитися…», «бо тіло має…».
- Спойлер кінцівки, передвісники («але раптом», «ще не знав»), канцелярит.

ПОГАНО (переказ, так НЕ писати):
«Максима з товаришами кидають на завдання, і йому доводиться вступити в рукопашний бій. Майстер учив, що тіло має діяти наосліп.»

ДОБРЕ (образ + недомовка, так писати):
«Після кожного бою він виходив цілий — і щоразу трохи менше собою.»

Погане переказує; добре — інтригує одним образом.

Поверни ТІЛЬКИ текст гачка українською, без лапок навколо нього, без пояснень.

${titleLine}Текст серії:
"""
${text}
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

// Статуси, для яких гачок має сенс: те, що читач бачить або скоро побачить.
// Чернетки (draft) навмисно пропускаємо — їхній текст ще може змінитись,
// а гачок доведеться перегенеровувати. Щоб охопити і їх, прибрати .in(...).
const VISIBLE_STATUSES = ['published', 'scheduled']

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  // Список серій, які вже пробували й не змогли (заблоковані Gemini).
  // Порожній масив на першому виклику.
  let skipIds: string[] = []
  try {
    const body = await req.json() as { skipIds?: unknown }
    if (Array.isArray(body?.skipIds)) {
      skipIds = body.skipIds.filter((v): v is string => typeof v === 'string')
    }
  } catch {
    // Тіла немає — це нормально для першого виклику.
  }

  const supabase = getSupabaseAdmin()

  // Скільки всього серій «Тиші» у видимих статусах — для прогресу на фронті.
  const { count: total } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'tysha')
    .in('status', VISIBLE_STATUSES)

  // Скільки лишилось без hook (без урахування пропущених).
  const { count: remainingBefore } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'tysha')
    .in('status', VISIBLE_STATUSES)
    .or('hook.is.null,hook.eq.')

  // Найперша серія без hook за порядком. Пропущені виключаємо, інакше цикл
  // упреться в заблоковану серію назавжди.
  let q = supabase
    .from('content')
    .select('id, title, text, corrected_text, season_number, episode_number')
    .eq('type', 'tysha')
    .in('status', VISIBLE_STATUSES)
    .or('hook.is.null,hook.eq.')
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })
    .limit(1)

  if (skipIds.length > 0) {
    q = q.not('id', 'in', `(${skipIds.join(',')})`)
  }

  const { data: candidates, error: selErr } = await q

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }

  const target = (candidates ?? [])[0]

  if (!target) {
    return NextResponse.json({
      done: true,
      total: total ?? 0,
      remaining: Math.max(0, (remainingBefore ?? 0) - skipIds.length),
      processed: null,
    })
  }

  // Джерело: дотягнутий текст (corrected_text) має пріоритет над оригіналом.
  const sourceText = ((target.corrected_text ?? '').trim() || (target.text ?? '').trim())

  if (!sourceText) {
    // Порожня серія — не помилка, просто нема з чого робити гачок.
    return NextResponse.json({
      done: false,
      total: total ?? 0,
      remaining: Math.max(0, (remainingBefore ?? 1) - 1),
      skipped: {
        id: target.id,
        title: target.title,
        season: target.season_number,
        episode: target.episode_number,
        reason: 'Порожній текст серії',
      },
      processed: null,
    })
  }

  const titleLine = target.title?.trim() ? `Назва епізоду: «${target.title.trim()}»\n\n` : ''
  const prompt = buildPrompt(sourceText, titleLine)

  // Ті самі моделі й той самий порядок, що в поодинокій генерації.
  const models = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-2.5-flash']
  let lastErr: unknown = null
  let hook = ''

  for (const model of models) {
    try {
      hook = await tryGenerate(apiKey, model, prompt)
      if (hook) break
      lastErr = new Error('Порожня відповідь')
    } catch (err) {
      lastErr = err
      if (isBlocked(err)) continue // блокування — пробуємо наступну модель
      break // мережа/ключ — далі пробувати нема сенсу
    }
  }

  // Жодна модель не впоралась.
  if (!hook) {
    if (isBlocked(lastErr)) {
      // Пропускаємо серію й ідемо далі — прогін не зупиняється.
      return NextResponse.json({
        done: false,
        total: total ?? 0,
        remaining: Math.max(0, (remainingBefore ?? 1) - 1),
        skipped: {
          id: target.id,
          title: target.title,
          season: target.season_number,
          episode: target.episode_number,
          reason: 'Gemini заблокував через воєнний зміст — гачок треба написати вручну',
        },
        processed: null,
      })
    }
    // Інша помилка (ключ, мережа, квота) — тут зупинятись правильно.
    const msg = lastErr instanceof Error ? lastErr.message : 'Помилка API'
    return NextResponse.json({ error: msg, targetId: target.id }, { status: 500 })
  }

  const { error: updErr } = await supabase
    .from('content')
    .update({ hook })
    .eq('id', target.id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message, targetId: target.id }, { status: 500 })
  }

  return NextResponse.json({
    done: false,
    total: total ?? 0,
    remaining: Math.max(0, (remainingBefore ?? 1) - 1),
    processed: {
      id: target.id,
      title: target.title,
      season: target.season_number,
      episode: target.episode_number,
      hook,
    },
  })
}
