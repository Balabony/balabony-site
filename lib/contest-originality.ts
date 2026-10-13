// =============================================================================
// ПЕРЕВІРКА: ЧИ НЕ ПУБЛІКУВАВСЯ ТВІР В ІНШИХ ОНЛАЙН-МЕДІА (рішення 14.10.2026).
//
// Умови конкурсів: «Твір новий: на момент подачі він не опублікований на
// інших літературних платформах, в електронних бібліотеках, інтернет-виданнях
// і медіа». Програма бере 8 характерних речень з різних частин тексту і
// шукає їх дослівно в інтернеті (вебпошук Anthropic). Знайдені сторінки
// показуються з посиланнями.
//
// ОБМЕЖЕННЯ — ЧЕСНО: пошук бачить лише відкриті сторінки, які проіндексовано.
// Платні розділи, закриті групи, Telegram — ні. «Не знайдено» ≠ «гарантовано
// новий». Збіг теж не вирок: публікація на ВЛАСНИХ ресурсах автора
// (сторінка, блог, канал з безоплатним доступом) і в паперовій газеті
// умовами дозволена — рішення ухвалює людина.
// =============================================================================

import Anthropic from '@anthropic-ai/sdk'

export const ORIGINALITY_MODEL = 'claude-sonnet-4-6'

export type OriginalityMatch = { phrase: string; url: string; title: string; note: string }
export type OriginalityResult = {
  phrases: string[]
  matches: OriginalityMatch[]
  /** 'clean' — збігів не знайдено; 'found' — є збіги; 'unclear' — є схожі, але не дослівні. */
  verdict: 'clean' | 'found' | 'unclear'
  summary: string
  searches: number
}

/** 8 характерних речень з різних частин тексту (8–22 слова, без діалогового тире на початку). */
export function pickPhrases(text: string, n = 8): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim().replace(/^[—–-]\s*/, ''))
    .filter((s) => {
      const w = s.split(' ').length
      return w >= 8 && w <= 22 && /[\p{L}]{4,}/u.test(s)
    })
  if (sentences.length <= n) return sentences
  const out: string[] = []
  const step = sentences.length / n
  for (let i = 0; i < n; i++) {
    const chunk = sentences.slice(Math.floor(i * step), Math.floor((i + 1) * step))
    // у кожній частині — найдовше речення: воно найунікальніше
    out.push(chunk.sort((a, b) => b.length - a.length)[0])
  }
  return out
}

export async function runOriginalityCheck(p: { title: string; text: string }): Promise<OriginalityResult> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Немає ANTHROPIC_API_KEY')
  const phrases = pickPhrases(p.text)
  if (!phrases.length) throw new Error('Не вдалося вибрати фрази для пошуку')

  const prompt = `Перевір, чи цей літературний твір уже публікувався в інтернеті (літературні платформи, електронні бібліотеки, інтернет-видання, медіа, блоги, соцмережі).

Назва твору: «${p.title}»

Знайди в інтернеті кожну з фраз нижче ДОСЛІВНО (шукай у лапках). Також один раз пошукай назву твору в лапках разом зі словом «оповідання» або «читати».
${phrases.map((f, i) => `${i + 1}. "${f}"`).join('\n')}

Враховуй ЛИШЕ сторінки, де фраза з тексту справді стоїть дослівно або майже дослівно. Сторінки balabony.com НЕ рахуй (це наша платформа). Не вигадуй посилань — лише ті, що повернув пошук.

Відповідай ЛИШЕ JSON без markdown:
{ "matches": [ { "phrase": "<яку фразу знайдено>", "url": "<адреса сторінки>", "title": "<назва сторінки>", "note": "<що це за ресурс: платформа, блог автора, газета тощо>" } ],
  "verdict": "clean" | "found" | "unclear",
  "summary": "<1–3 речення українською: що знайдено або що не знайдено>" }`

  const client = new Anthropic({ apiKey: key })
  let parsed: { matches?: OriginalityMatch[]; verdict?: string; summary?: string } | null = null
  let searches = 0
  let lastErr: Error | null = null
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    const msg = await client.messages.create({
      model: ORIGINALITY_MODEL,
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 10 }],
      messages: [{ role: 'user', content: prompt }],
    })
    searches = msg.usage?.server_tool_use?.web_search_requests ?? 0
    const texts = msg.content.filter((c) => c.type === 'text').map((c) => (c as { text: string }).text)
    const raw = (texts[texts.length - 1] ?? '').replace(/```json/g, '').replace(/```/g, '').trim()
    const start = raw.indexOf('{'), end = raw.lastIndexOf('}')
    try {
      if (start < 0 || end < 0) throw new Error('Модель не повернула JSON')
      parsed = JSON.parse(raw.slice(start, end + 1))
    } catch (e) { lastErr = e as Error }
  }
  if (!parsed) throw lastErr ?? new Error('Модель не повернула JSON')

  const matches = (parsed.matches ?? [])
    .filter((m) => m && /^https?:\/\//.test(String(m.url ?? '')) && !/balabony\.com/i.test(String(m.url)))
    .map((m) => ({ phrase: String(m.phrase ?? ''), url: String(m.url), title: String(m.title ?? ''), note: String(m.note ?? '') }))
  const v = String(parsed.verdict ?? '')
  const verdict: OriginalityResult['verdict'] = matches.length ? (v === 'unclear' ? 'unclear' : 'found') : (v === 'unclear' ? 'unclear' : 'clean')
  return { phrases, matches, verdict, summary: String(parsed.summary ?? ''), searches }
}
