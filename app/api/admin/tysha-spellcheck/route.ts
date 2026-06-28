import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { dbQuery } from '@/lib/db'

// Перевірка правопису довгої серії — даємо до 60 c.
export const maxDuration = 60

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]


type Suggestion = { before: string; after: string; reason: string }

// Гнучкий пошук фрагмента в тексті (апострофи/тире/пробіли — будь-які варіанти),
// щоб «було» від моделі збігалося з реальним текстом.
function flexRe(fragment: string): RegExp | null {
  const esc = fragment
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/['’ʼ`´]/g, "['’ʼ`´]")
    .replace(/[—–−-]/g, '[—–−-]')
    .replace(/\s+/g, '\\s+')
  try { return new RegExp(esc) } catch { return null }
}
function existsInText(text: string, fragment: string): boolean {
  const re = flexRe(fragment)
  return !!re && re.test(text)
}

function parseSuggestions(raw: string): Suggestion[] {
  let s = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const start = s.indexOf('[')
  const end = s.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return []
  s = s.slice(start, end + 1)
  let arr: unknown
  try { arr = JSON.parse(s) } catch { return [] }
  if (!Array.isArray(arr)) return []
  const out: Suggestion[] = []
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const before = typeof o.було === 'string' ? o.було : typeof o.before === 'string' ? o.before : ''
    const after = typeof o.стало === 'string' ? o.стало : typeof o.after === 'string' ? o.after : ''
    const reason = typeof o.причина === 'string' ? o.причина : typeof o.reason === 'string' ? o.reason : ''
    if (before.trim() && after.trim() && before.trim() !== after.trim()) {
      out.push({ before: before.trim(), after: after.trim(), reason: reason.trim() })
    }
  }
  return out
}

// Фрагмент має бути коротким — слово/частина речення, не абзац.
function isGranular(before: string): boolean {
  const f = before.trim()
  if (f.length > 200) return false
  const enders = (f.match(/[.!?…]\s+\p{Lu}/gu) ?? []).length
  return enders <= 1
}

// Підтягуємо ВЕРИФІКОВАНІ правила правопису з бази (та сама таблиця, що /pravopys).
// Якщо база недоступна — перевірка все одно працює (на загальних знаннях моделі).
async function loadVerifiedRules(): Promise<string> {
  try {
    const r = await dbQuery(
      `SELECT topic, rule_short, examples FROM spelling_rules
       WHERE status = 'verified'
       ORDER BY category NULLS LAST, sort_order ASC, topic ASC
       LIMIT 200`
    )
    const rows = r.rows as { topic: string; rule_short: string; examples: string | null }[]
    if (!rows.length) return ''
    return rows
      .map((x) => `• ${x.topic}: ${x.rule_short}${x.examples ? ` (напр.: ${x.examples})` : ''}`)
      .join('\n')
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })

  const { text } = await request.json() as { text?: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Текст відсутній' }, { status: 400 })

  const rules = await loadVerifiedRules()
  const rulesBlock = rules
    ? `ЧИННИЙ ПРАВОПИС (рішення НКСДМ №47, 2026) — звіряйся з цими правилами в першу чергу:\n${rules}\n`
    : `Спирайся на чинний «Український правопис» (рішення НКСДМ №47 від 01.03.2026, чинний з 28.03.2026), НЕ на правопис 2019 року.\n`

  const prompt = `Ти — коректор української мови. Перед тобою фрагмент авторського серіалу «Тиша». Знайди ОРФОГРАФІЧНІ, ПУНКТУАЦІЙНІ та ГРАМАТИЧНІ помилки. Це коректура, НЕ редагування стилю.

${rulesBlock}
ЩО ШУКАТИ:
— орфографічні помилки (неправильне написання слів, апострофи, дефіси, велика/мала літера);
— пунктуація (пропущені/зайві коми, тире, лапки, крапки);
— граматика (узгодження відмінків, роду, числа; форми дієслів; прийменники);
— типові кальки з російської в написанні (не стиль, а саме помилка норми).

ЧОГО НЕ РОБИТИ:
— НЕ переписуй стиль, НЕ покращуй формулювання, НЕ скорочуй — лише виправляй ПОМИЛКИ;
— НЕ чіпай авторські діалектизми, розмовні форми в репліках персонажів, якщо це свідомий художній прийом, а не помилка;
— НЕ міняй формат реплік «Імʼя: текст»;
— якщо помилок нема — поверни порожній масив [].

ФОРМАТ — ЛИШЕ валідний JSON-масив, без пояснень, без markdown:
[
  { "було": "<точна фраза з помилкою, СКОПІЙОВАНА з тексту дослівно>", "стало": "<виправлений варіант>", "причина": "<коротко, яка це помилка>" }
]

КРИТИЧНО:
— "було" — ТОЧНА підрядкова копія з тексту (символ у символ), інакше пропозицію відкинуть;
— один "було" = одне коротке місце (слово/словосполучення/частина речення), НЕ абзац;
— кілька помилок = кілька окремих дрібних пропозицій.

Текст:
"""
${text}
"""`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.2,
          thinkingConfig: { thinkingBudget: 0 },
        },
        safetySettings: SAFETY,
      } as Parameters<typeof genAI.getGenerativeModel>[0],
      { apiVersion: 'v1beta' }
    )
    const result = await model.generateContent(prompt)
    const rawOut = result.response.text()
    const parsed = parseSuggestions(rawOut)
    const validated = parsed.filter((s) => isGranular(s.before) && existsInText(text, s.before))
    const dropped = parsed.length - validated.length
    return NextResponse.json({ suggestions: validated, dropped, usedRules: !!rules })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
