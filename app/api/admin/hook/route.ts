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

  // Гачок = приманка на картці рубрики. Має спиратися на КОНКРЕТНІ образи й
  // події цієї серії (не абстракція), але ХОВАТИ розв'язку. Читач має відчути,
  // ПРО ЩО йдеться, і захотіти дізнатися, ЧИМ це скінчиться.
  const prompt = `Ти — редактор дорослого українського серіалу-драми «Тиша». Прочитай серію повністю й напиши ГАЧОК для картки — короткий тізер, що інтригує й натякає, про що ця серія, не розкриваючи розв'язки.

ЯК ПИСАТИ:
- Спирайся на КОНКРЕТНІ образи, деталі й події саме цієї серії (герой, місце, предмет, поворот) — читач має відчути, про що йдеться.
- 1-2 короткі речення.
- Створи ЗАГАДКУ через недомовленість: натякни на напругу, але НЕ кажи, чим усе скінчиться.

СУВОРО ЗАБОРОНЕНО:
- Абстрактні порожні формулювання («слухати світ», «розпізнавати біду», «жодна книжка не підготувала») — вони ні про що.
- Передвісники й анонси майбутнього («але раптом…», «те, до чого не був готовий», «ще не знав, що…») — це штамп.
- Спойлери розв'язки: не називай, що саме станеться в кінці.
- Переказ усього сюжету: гачок — це приманка, не переказ.

ПРИКЛАД ХОРОШОГО ГАЧКА (для серії, де школяр без батька ховається в книжці про козака, а вночі йому дзвонить сусідка з бідою):
«Хлопець без батька ховається у книжці про козака, що чув степ краще за всіх. А тоді, за пів на дванадцяту ночі, дзвонить чужий телефон.»
— зверни увагу: конкретні образи (книжка, козак, нічний дзвінок), інтрига є, але ЧИМ це скінчиться — не сказано.

Поверни ТІЛЬКИ текст гачка українською, без лапок, заголовків і пояснень.

${titleLine}Текст серії:
"""
${text}
"""`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings: SAFETY }, { apiVersion: 'v1beta' })
    const result = await model.generateContent(prompt)
    const hook = result.response.text().trim()
    return NextResponse.json({ hook })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
