import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })

  const { text } = await request.json() as { text?: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Текст відсутній' }, { status: 400 })

  const prompt = `Проаналізуй наступний текст українською мовою та поверни відповідь ТІЛЬКИ у форматі JSON без будь-якого додаткового тексту, коментарів або markdown.

Текст:
"""
${text}
"""

Поверни виключно JSON такої структури:
{
  "rating": <ціле число від 1 до 10>,
  "emotion": "<одне з: весела|сумна|тривожна|надихаюча>",
  "complexity": "<одне з: легка|середня|складна>",
  "recommendedAge": "<наприклад: 6–10 років або 12+ років>",
  "tags": ["<тег1>", "<тег2>", "<тег3>"],
  "teaser": "<2–3 речення-анонс що зацікавить читача>",
  "improvements": ["<порада 1>", "<порада 2>", "<порада 3>"]
}

Критерії:
- rating: загальна якість (сюжет, мова, цікавість)
- emotion: переважна емоція тексту
- complexity: складність читання
- recommendedAge: цільова аудиторія
- tags: 3–5 ключових слів-тегів
- teaser: захоплюючий короткий анонс
- improvements: конкретні поради щодо покращення`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' })
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()

    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'Не вдалося розпарсити відповідь AI' }, { status: 500 })

    const analysis = JSON.parse(match[0])
    return NextResponse.json(analysis)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
