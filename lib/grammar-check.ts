import Anthropic from '@anthropic-ai/sdk'
import { STYLE_MODEL } from '@/lib/ai-style-check'

/**
 * Перевірка граматики й стилістики (15.10.2026).
 * Мета — не відкидати нових авторів через помилки: редактор бачить, ЩО саме
 * не так, а автор отримує конкретні поради. Текст НЕ переписуємо і в базу
 * не зберігаємо — лише звіт для редактора.
 */

export type GrammarIssue = { type: string; quote: string; fix: string; why: string }
export type GrammarResult = {
  level: 'добра' | 'середня' | 'слабка'
  potential: string            // чи варто працювати з автором
  summary: string              // 2–3 речення для редактора
  counts: Record<string, number>
  issues: GrammarIssue[]
  strengths: string[]
  advice: string               // лист-порада автору, від «ми»
  checked_chars: number
  truncated: boolean
}

const LIMIT = 24000

function prompt(title: string, text: string) {
  return `Ти — досвідчений редактор-коректор української мови в дитячому й сімейному літературному виданні.
Перевір уривок твору нового автора «${title}». Автор пише щиро, але може робити багато помилок. Наше завдання — НЕ відкинути автора, а допомогти: показати типові помилки й дати чіткі поради.

Що шукати:
- орфографія (зокрема апостроф, м'який знак, великі літери);
- пунктуація (коми, тире в діалогах — у прямій мові має бути тире «—» і пробіл після нього; пробіли після ком і крапок);
- граматика (відмінки, узгодження, кличний відмінок у звертаннях: «Ілле», «мамо»);
- русизми й кальки («колбаса» → «ковбаса», «прийняти участь» → «взяти участь» тощо);
- стилістика (повтори, канцелярит, затягнуті речення, плутанина часів).

Правила відповіді:
- "quote" — ТОЧНА цитата з тексту, 1–12 слів, символ у символ, без змін;
- "fix" — як правильно; "why" — коротке пояснення простими словами;
- групуй однотипні помилки: не більше 3 прикладів одного типу, загалом до 30 пунктів, найважливіші першими;
- не вигадуй помилок; авторський стиль, діалектизми в мові персонажів і навмисну розмовність НЕ виправляй;
- "advice" — теплий лист автору від редакції (5–9 речень, на «Ви»): що вдалося, 3–4 головні типи помилок із прикладами, конкретні кроки (наприклад, перевірити текст на правопис, прочитати вголос), без оцінок на кшталт «погано».

Поверни ЛИШЕ JSON без пояснень:
{"level":"добра|середня|слабка","potential":"одне речення: чи є сенс працювати з автором і чому","summary":"2–3 речення для редактора","counts":{"орфографія":0,"пунктуація":0,"граматика":0,"русизми":0,"стилістика":0},"issues":[{"type":"пунктуація","quote":"...","fix":"...","why":"..."}],"strengths":["..."],"advice":"..."}

ТЕКСТ:
${text}`
}

export async function runGrammarCheck(title: string, full: string): Promise<GrammarResult> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Немає ANTHROPIC_API_KEY')
  const text = full.slice(0, LIMIT)
  const client = new Anthropic({ apiKey: key })
  let parsed: GrammarResult | null = null
  let lastErr: Error | null = null
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    const msg = await client.messages.create({
      model: STYLE_MODEL,
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt(title, text) }],
    })
    const raw = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('').trim()
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
    try {
      if (s < 0 || e < 0) throw new Error('Модель не повернула JSON')
      parsed = JSON.parse(clean.slice(s, e + 1)) as GrammarResult
    } catch (err) { lastErr = err as Error }
  }
  if (!parsed) throw lastErr ?? new Error('Модель не повернула JSON')
  // Лишаємо тільки ті приклади, цитата яких справді є в тексті (захист від вигаданих помилок).
  const norm = (x: string) => x.replace(/[’ʼ`]/g, "'").replace(/\s+/g, ' ').trim()
  const hay = norm(text)
  parsed.issues = (Array.isArray(parsed.issues) ? parsed.issues : [])
    .filter((i) => i && i.quote && hay.includes(norm(String(i.quote))))
    .slice(0, 30)
  parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : []
  parsed.counts = parsed.counts ?? {}
  parsed.checked_chars = text.length
  parsed.truncated = full.length > LIMIT
  return parsed
}
