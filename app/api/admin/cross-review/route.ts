import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface SeriesSnippet {
  filename: string
  textSnippet: string
}

interface CrossIssueEntry {
  filename: string
  issues: string[]
}

function parseGeminiJson(raw: string): Record<string, unknown> | null {
  const stripped = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/m, '').trim()

  try { return JSON.parse(stripped) as Record<string, unknown> } catch {}

  const m = stripped.match(/\{[\s\S]*\}/)
  if (m) {
    try { return JSON.parse(m[0]) as Record<string, unknown> } catch {}
    try {
      return JSON.parse(m[0].replace(/,(\s*[}\]])/g, '$1')) as Record<string, unknown>
    } catch {}
  }

  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown> } catch {}
  }

  return null
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })

  const { series } = await request.json() as { series?: SeriesSnippet[] }

  if (!series || series.length < 2) {
    return NextResponse.json({ episodeCrossIssues: [] satisfies CrossIssueEntry[] })
  }

  const seriesText = series.map((s, i) =>
    `Серія ${i + 1}: "${s.filename}"\nУривок: ${s.textSnippet}`
  ).join('\n\n---\n\n')

  const prompt = `Ти — редактор серіалу «Балабони». Проаналізуй наступні серії на крос-серійні проблеми. Поверни відповідь ТІЛЬКИ у форматі JSON без markdown.

СЕРІЇ:
${seriesText}

Перевір:
1. Повтори сюжету між серіями (схожі події, ситуації або жарти що повторюються).
2. Непослідовність імен персонажів між серіями (різні написання одного персонажа).
3. Суперечливі факти між серіями (протилежна інформація про одне й те саме).

Включай серію у відповідь ТІЛЬКИ якщо є реальні крос-серійні проблеми. Якщо проблем немає — повертай порожній масив.

Поверни виключно JSON такої структури:
{
  "episodeCrossIssues": [
    { "filename": "<назва серії>", "issues": ["<крос-проблема 1>", "<крос-проблема 2>"] }
  ]
}

Якщо крос-проблем немає зовсім — повертай: { "episodeCrossIssues": [] }`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' })
    const result = await model.generateContent(prompt)
    const raw    = result.response.text().trim()
    const parsed = parseGeminiJson(raw)
    if (!parsed) return NextResponse.json({ episodeCrossIssues: [] satisfies CrossIssueEntry[] })

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ episodeCrossIssues: [] satisfies CrossIssueEntry[] })
  }
}
