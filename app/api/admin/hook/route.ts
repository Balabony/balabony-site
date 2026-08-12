import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

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

ІМʼЯ ГОЛОВНОГО ГЕРОЯ:
- Називай його ТІЛЬКИ «Максим» або займенником «він». Позивний «Тихий» у гачку НЕ вживай — читач картки ще не знає, хто це.

ЗАБОРОНЕНО (вбиває гачок):
- Переказ сюжету: «Максима кидають на завдання і йому доводиться…», «герой іде туди і робить те».
- Пояснення мотивів: «щоб навчитися…», «бо тіло має…».
- Спойлер кінцівки, передвісники («але раптом», «ще не знав»), канцелярит.
- РОЗКРИТТЯ НАСКРІЗНИХ ТАЄМНИЦЬ серіалу: що батько живий, хто загинув, чим скінчилась лінія персонажа. Такі речі читач має дізнатися з тексту, а не з картки.
- Називати поранення, каліцтва чи смерть конкретних персонажів («повернувся без руки», «командир без ніг»).

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

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }
  const { text, title } = await req.json() as { text?: string; title?: string }
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Текст відсутній' }, { status: 400 })
  }

  const titleLine = title?.trim() ? `Назва епізоду: «${title.trim()}»\n\n` : ''
  const prompt = buildPrompt(text, titleLine)

  // Основна модель. Якщо Google блокує зміст (PROHIBITED_CONTENT) — пробуємо запасну.
  const models = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-2.5-flash']
  let lastErr: unknown = null

  for (const model of models) {
    try {
      const hook = await tryGenerate(apiKey, model, prompt)
      if (hook) return NextResponse.json({ hook })
      lastErr = new Error('Порожня відповідь')
    } catch (err) {
      lastErr = err
      if (isBlocked(err)) continue // блокування — пробуємо наступну модель
      break // інша помилка (мережа/ключ) — далі пробувати нема сенсу
    }
  }

  if (isBlocked(lastErr)) {
    return NextResponse.json({
      error: 'Gemini заблокував цю серію через воєнний зміст (полон, поранення тощо). Автогенерація тут неможлива — напиши гачок вручну в полі вище.',
    }, { status: 422 })
  }
  const msg = lastErr instanceof Error ? lastErr.message : 'Помилка API'
  return NextResponse.json({ error: msg }, { status: 500 })
}
