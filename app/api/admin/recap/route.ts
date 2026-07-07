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
  const { text, title, mode } = await req.json() as { text?: string; title?: string; mode?: string }
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Текст відсутній' }, { status: 400 })
  }

  const titleLine = title?.trim() ? `Назва епізоду: «${title.trim()}»\n\n` : ''

  // mode 'improve' — покращити НАЯВНИЙ рекап (на вхід іде сам рекап, не епізод):
  // виправити помилки, відшліфувати стиль, НЕ міняючи змісту й не додаючи подій.
  // Без mode (або 'generate') — стара логіка: резюме з повного тексту епізоду.
  const prompt = mode === 'improve'
    ? `Ти — редактор україномовного серіалу. Нижче — готове коротке резюме епізоду у форматі «що було раніше». Покращ його й виправ помилки.
Вимоги:
- Виправ орфографічні, пунктуаційні та граматичні помилки.
- Відшліфуй стиль: прибери зайві слова, зроби формулювання чіткими й природними.
- НЕ додавай нових подій і НЕ прибирай наявних; зміст лишається той самий.
- РІВНО 2-3 речення, не більше.
- Українською, у минулому часі, нейтральним оповідним тоном.
- Без спойлерів того, що буде далі.
- Поверни ТІЛЬКИ покращений текст резюме, без заголовків, лапок, пояснень чи вступних слів.
${titleLine}Наявне резюме:
"""
${text}
"""`
    : `Ти — редактор україномовного серіалу. Напиши дуже коротке резюме цього епізоду у форматі «що було раніше» — щоб слухач, який повертається після перерви, швидко згадав події.
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings: SAFETY }, { apiVersion: 'v1beta' })
    const result = await model.generateContent(prompt)
    const recap = result.response.text().trim()
    return NextResponse.json({ recap })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
