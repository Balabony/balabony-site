import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface SeriesInput {
  filename: string
  textSnippet: string
  report: {
    overall: number
    scores: Array<{ key: string; label: string; score: number; comment: string }>
    problems: string[]
    recommendations: string[]
  }
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

  const { series } = await request.json() as { series?: SeriesInput[] }
  if (!series?.length) return NextResponse.json({ error: 'Серії відсутні' }, { status: 400 })

  const seriesSummary = series.map((s, i) =>
    `Серія ${i + 1}: "${s.filename}"
  Загальна оцінка: ${s.report.overall}/10
  Оцінки: ${s.report.scores.map(sc => `${sc.label}: ${sc.score}`).join(', ')}
  Проблеми (${s.report.problems.length}): ${s.report.problems.join('; ') || 'немає'}
  Уривок тексту: ${s.textSnippet}`
  ).join('\n\n')

  const prompt = `Ти — головний редактор серіалу «Балабони». Проаналізуй результати перевірки ${series.length} серій та склади фінальний зведений звіт. Поверни відповідь ТІЛЬКИ у форматі JSON без markdown та додаткового тексту.

РЕЗУЛЬТАТИ АНАЛІЗУ СЕРІЙ:
${seriesSummary}

Поверни виключно JSON такої структури:
{
  "overallQuality": {
    "score": <середня загальна оцінка 1-10 всього серіалу>,
    "comment": "<1-2 речення загального висновку про якість>"
  },
  "styleCompliance": {
    "compliant": <кількість серій що відповідають стилю Балабонів (стиль >= 7)>,
    "nonCompliant": <кількість що не відповідають>,
    "comment": "<коментар>"
  },
  "charactersBible": {
    "score": <середній бал відповідності характерам 1-10>,
    "comment": "<чи правильно використані персонажі в серіях загалом>"
  },
  "chronologyLogic": {
    "valid": <true якщо серії логічно пов'язані та послідовні, false якщо є проблеми>,
    "issues": ["<проблема хронології 1 якщо є>"],
    "comment": "<коментар про логіку послідовності>"
  },
  "plotUniqueness": {
    "uniqueCount": <кількість серій з унікальним сюжетом (uniqueness >= 7)>,
    "duplicates": <кількість серій з підозрою на повтор або кліше>,
    "comment": "<коментар>"
  },
  "ttsReadiness": {
    "clean": <кількість серій без ремарок у дужках>,
    "needsCleaning": <кількість серій що потребують очищення від ремарок типу (сміється) (зітхає)>,
    "series": ["<назва серії що потребує очищення>"],
    "comment": "<коментар>"
  },
  "needsRework": [
    { "filename": "<назва серії>", "reasons": ["<причина 1>", "<причина 2>"] }
  ],
  "verdict": "<'ready' якщо всі серії >=7 або 'needs_rework' якщо є серії <7>",
  "verdictText": "<'Серіал готовий до публікації' або 'Потребує доопрацювання X серій'>"
}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' })
    const result = await model.generateContent(prompt)
    const raw    = result.response.text().trim()
    const parsed = parseGeminiJson(raw)
    if (!parsed) return NextResponse.json({ error: 'Не вдалося розпарсити відповідь AI' }, { status: 500 })

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
