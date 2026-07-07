import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

// Admin-auth за тим самим патерном, що й решта admin-endpoint'ів.
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

  // Гачок = приманка на картці рубрики. НЕ рекап (той резюмує події).
  // Завдання: інтрига й недомовка, БЕЗ розкриття сюжету.
  const prompt = `Ти — редактор дорослого українського серіалу-драми. Напиши ГАЧОК для картки серії — короткий тізер, що заманює прочитати.
Вимоги:
- 1-2 речення, дуже коротко.
- Обов'язково — НЕДОМОВЛЕНІСТЬ і ЗАГАДКА: натякни на напругу, але НЕ розкривай, що станеться.
- ЖОДНИХ спойлерів: не називай розв'язку, не переказуй події епізоду.
- Українською, живим інтригуючим тоном (це військова драма для дорослих, не дитячий текст).
- Без лапок, заголовків, пояснень чи вступних слів — поверни ТІЛЬКИ текст гачка.
${titleLine}Текст епізоду (для розуміння атмосфери, НЕ переказувати):
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
