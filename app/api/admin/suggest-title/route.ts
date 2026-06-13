import { NextRequest } from 'next/server'
import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai'

type GenConfigWithThinking = GenerationConfig & {
  thinkingConfig?: { thinkingBudget?: number }
}

export const runtime = 'edge'

const SYSTEM = `Ти — редактор серіалу теплих українських комедійних історій «Балабони» (про діда Панаса, бабу Ганю, Григорія та інших мешканців села). Тобі дають текст серії. Запропонуй 5 коротких влучних назв українською.

ВИМОГИ ДО НАЗВ:
• 2–5 слів, без крапки в кінці.
• Інтригують або викликають усмішку, відображають головну подію/комічний вузол серії.
• У стилі серіалу: тепло, з гумором, без сарказму й без штампів на кшталт «неймовірна пригода».
• БЕЗ лапок, БЕЗ нумерації, БЕЗ Markdown.

ВИВІД: поверни СУВОРО валідний JSON-масив із 5 рядків і нічого більше. Приклад формату: ["Назва один","Назва два","Назва три","Назва чотири","Назва пʼять"]`

interface Body { text?: string }

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return new Response(JSON.stringify({ error: 'GEMINI_API_KEY не налаштовано' }), { status: 500 })

  const body = await request.json() as Body
  const text = (body.text ?? '').trim()
  if (!text) return new Response(JSON.stringify({ error: 'Порожній текст серії' }), { status: 400 })

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generationConfig: GenConfigWithThinking = {
      maxOutputTokens: 512,
      temperature: 1.1,
      thinkingConfig: { thinkingBudget: 0 },
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig }, { apiVersion: 'v1beta' })

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: SYSTEM }] },
        { role: 'user', parts: [{ text: `Текст серії:\n\n${text.slice(0, 8000)}` }] },
      ],
    })

    const raw = result.response.text().trim()
    // Витягуємо JSON-масив навіть якщо модель додала зайве
    const match = raw.match(/\[[\s\S]*\]/)
    let titles: string[] = []
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as unknown
        if (Array.isArray(parsed)) {
          titles = parsed.filter((t): t is string => typeof t === 'string').map(t => t.replace(/^["'\s]+|["'\s]+$/g, '').trim()).filter(Boolean)
        }
      } catch { /* нижче fallback */ }
    }
    if (titles.length === 0) {
      // Fallback: рядки, що схожі на назви
      titles = raw.split('\n').map(l => l.replace(/^[\d.)\-•*"'\s]+|["'\s]+$/g, '').trim()).filter(l => l.length >= 2 && l.length <= 60).slice(0, 5)
    }

    return new Response(JSON.stringify({ titles: titles.slice(0, 5) }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
}
