import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai'

type GenConfigWithThinking = GenerationConfig & {
  thinkingConfig?: { thinkingBudget?: number }
}

// Стійкий парсер JSON від LLM: витягує обʼєкт і лагодить типові дефекти
// (зайві коми, ```json-огортки), щоб аналіз не падав на дрібницях.
function safeParseJsonObject(raw: string): unknown | null {
  const stripped = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) return null
  const candidate = match[0]
  const tryParse = (s: string): unknown | null => {
    try { return JSON.parse(s) } catch { return null }
  }
  // 1) як є
  let parsed = tryParse(candidate)
  if (parsed !== null) return parsed
  // 2) прибрати trailing-коми перед } та ]
  const noTrailing = candidate.replace(/,(\s*[}\]])/g, '$1')
  parsed = tryParse(noTrailing)
  if (parsed !== null) return parsed
  // 3) якщо JSON обірвався — спробувати закрити масиви/обʼєкти, що лишились відкритими
  let repaired = noTrailing.replace(/,\s*$/, '')
  const opens = (repaired.match(/[{[]/g) ?? []).length
  const closes = (repaired.match(/[}\]]/g) ?? []).length
  if (opens > closes) {
    // грубо: відкидаємо незавершений хвіст після останньої повної коми/закриття
    const lastSafe = Math.max(repaired.lastIndexOf('}'), repaired.lastIndexOf(']'))
    if (lastSafe > 0) repaired = repaired.slice(0, lastSafe + 1)
  }
  return tryParse(repaired.replace(/,(\s*[}\]])/g, '$1'))
}

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
- recommendedAge: цільова аудиторія — визначай зі змісту та контексту історії, а не зі складності мови. Проста мова не означає дитяча аудиторія.
- tags: 3–5 ключових слів-тегів
- teaser: захоплюючий короткий анонс
- improvements: конкретні поради щодо покращення`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generationConfig: GenConfigWithThinking = {
      maxOutputTokens: 4096,
      temperature: 0.4,
      // Без thinking JSON не обривається на півслові (раніше падало «position 863»).
      thinkingConfig: { thinkingBudget: 0 },
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig }, { apiVersion: 'v1beta' })
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()

    const analysis = safeParseJsonObject(raw)
    if (analysis === null) return NextResponse.json({ error: 'Не вдалося розпарсити відповідь AI' }, { status: 500 })
    return NextResponse.json(analysis)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
