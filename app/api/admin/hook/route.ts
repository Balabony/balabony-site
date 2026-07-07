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
  return `Ти — редактор дорослого українського серіалу «Тиша». Прочитай серію й напиши дуже короткий ГАЧОК для картки — приманку, що інтригує.

ФОРМАТ (суворо):
- МАКСИМУМ 2 короткі речення. Краще 1 сильне.
- Проста, чиста мова. Жодних заплутаних зворотів.

ЩО РОБИТИ:
- Візьми ОДИН конкретний образ або зав'язку серії (герой, місце, предмет) і подай як інтригу.
- Читач має відчути, ПРО ЩО серія, і захотіти дізнатися, ЧИМ вона скінчиться.

СУВОРО ЗАБОРОНЕНО:
- Розкривати кінцівку чи ключовий поворот. Останні події серії — НЕ згадувати.
- Цитувати текст серії (жодних реплік у лапках із твору).
- Переказувати сюжет по кроках («а коли… тоді… і тоді…»).
- Абстракції-пустушки: «передчуття небезпеки», «справжня проблема», «слухати світ».
- Передвісники: «але раптом», «те, до чого не був готовий», «ще не знав».
- Пояснювати мотиви героя — лише натяк.

ПРИКЛАД ХОРОШОГО (серія: хлопець без батька, книжка про козака, вночі дзвонить сусідка з бідою):
«Хлопець без батька ховається у книжці про козака, що чув степ краще за всіх. А цієї ночі мовчазний телефон озветься чужим голосом.»
Чому добре: один образ (книжка+козак), інтрига (нічний дзвінок), але ЧИМ скінчиться — не сказано, цитат нема, коротко.

Поверни ТІЛЬКИ текст гачка українською, без лапок навколо нього, без заголовків і пояснень.

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
  const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3-flash-preview']
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
