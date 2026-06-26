import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

  const prompt = `Ти — редактор україномовного серіалу. Напиши дуже коротке резюме цього епізоду у форматі «що було раніше» — щоб слухач, який повертається після перерви, швидко згадав події.

Вимоги:
- РІВНО 2-3 речення, не більше.
- Тільки ключові події цього епізоду, без зайвих деталей.
- Українською мовою, у минулому часі, нейтральним оповідним тоном.
- Без спойлерів того, що буде далі; тільки те, що сталося в цьому епізоді.
- Поверни ТІЛЬКИ текст резюме, без заголовків, лапок, пояснень чи вступних слів.

${titleLine}Текст епізоду:
"""
${text}
"""`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' })
    const result = await model.generateContent(prompt)
    const recap = result.response.text().trim()
    return NextResponse.json({ recap })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
