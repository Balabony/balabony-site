// =============================================================================
// ОЦІНКА КОНКУРСНИХ ТВОРІВ ШТУЧНИМ ІНТЕЛЕКТОМ — паралельна й незалежна від
// редакторів. Рішення Богдана 13.10.2026.
//
// ЩО ЦЕ. Окрема оцінка кожної вимоги з умов конкурсу (/konkursy), плюс
// граматика й стилістика. Кожна вимога отримує свій бал 0–10 і пояснення
// з цитатами. Редактори цієї оцінки НЕ бачать (кабінет /editor її не читає),
// тож вона не впливає на їхню думку і лишається незалежною.
//
// ЩО РАХУЄ КОД, А ЩО ШІ. Усе, що можна порахувати точно, рахує код, а не
// модель: кількість серій, слова в кожній серії, загальний обсяг, обсяг
// кожної казки (модель лише вказує, де починається кожна казка, а слова
// рахує countWords — так само, як форма подачі). Модель оцінює те, що
// числом не виміряти: гачок, тему, тон, мову.
//
// ЧОГО ТУТ НЕМАЄ. Новизну твору (чи не публікувався деінде) модель
// перевірити не може. Використання ШІ в тексті перевіряє окремий розділ
// /admin/shi-perevirka — ці два висновки не змішуємо.
//
// ЦИТАТИ ЗВІРЯЄМО з текстом: вигадану моделлю цитату прибираємо і
// показуємо окремим списком, як у перевірці стилю.
//
// ВИМОГИ НИЖЧЕ переписано з умов на /konkursy станом на 13.10.2026.
// Змінюєте умови на сторінці — оновіть і цей перелік.
// =============================================================================

import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { findContest, countWords, type ContestId } from '@/lib/contests'

export const REVIEW_MODEL = 'claude-sonnet-4-6'
const MAX_TEXT_CHARS = 160_000

export type Requirement = { id: string; text: string }

// Спільне для всіх конкурсів: граматика й стилістика оцінюються окремо, нижче.
const COMMON: Requirement[] = [
  { id: 'lang', text: 'Мова українська; текст написаний українською як мовою оригіналу (немає ознак перекладу чи машинного перекладу: кальок, чужого порядку слів).' },
]

export const REQUIREMENTS: Record<ContestId, Requirement[]> = {
  'ce-dovha-istoriya': [
    { id: 'synopsis', text: 'Є синопсис на одну сторінку (поле «анотація»), і він відповідає поданому тексту.' },
    { id: 'hook', text: 'Кожна подана серія закінчується гачком — подією або відкриттям, яке змінює становище героя. Гачок — це не обірване речення й не штучна пауза.' },
    { id: 'no_spoilers', text: 'Немає передвісників на кшталт «я ще не знав, що…», «згодом зрозумів», «якби ж я тоді послухав»; назви серій не викривають загадку.' },
    { id: 'whole', text: 'Подані серії тримаються разом як одна історія з наскрізним героєм і сюжетом.' },
    { id: 'ending', text: 'Фінал не читається наперед, не пояснює прочитане замість того, щоб його перевернути, і не тримається на випадковості чи героєві, що з’явився в останній серії. Якщо подано не всі десять серій — став «na».' },
  ],
  'pyat-vechoriv': [
    { id: 'whole', text: 'П’ять серій тримаються разом як одна історія, а не п’ять окремих текстів.' },
    { id: 'hook', text: 'Кожна серія (крім п’ятої) закінчується так, щоб хотілося наступної — поворот або питання, а не обрив на півслові.' },
    { id: 'hero', text: 'Є герой, за яким хочеться йти далі.' },
    { id: 'genre', text: 'Жанр вільний (життєва історія, драма, детектив, гумор), але без еротики й політичної агітації.' },
    { id: 'ending', text: 'П’ята серія завершує історію — читача не лишено посеред сюжету.' },
  ],
  'odyn-den': [
    { id: 'theme', text: 'Історія про день, після якого життя героя пішло інакше; дія вміщається переважно в один день.' },
    { id: 'story', text: 'Це саме історія — герой, подія, зміна, — а не мемуари чи роздуми.' },
    { id: 'shown', text: 'Зміна справді сталася і показана в подіях, а не пояснена автором.' },
    { id: 'concrete', text: 'Конкретність: місце, час, деталь, яку видно; живий герой, а не функція.' },
    { id: 'ending', text: 'Фінал не видно з середини тексту.' },
  ],
  'z-viterczem': [
    { id: 'humor', text: 'Гумористична історія з життя: смішна ситуація, яку хочеться переказати вголос.' },
    { id: 'kind', text: 'Гумор добрий: сміємося разом із героєм, а не з нього; немає принижень за ознакою статі, віку, походження чи стану здоров’я.' },
    { id: 'dialogue', text: 'Живі діалоги, які працюють на гумор.' },
    { id: 'tempo', text: 'Темп: короткі речення, швидка розв’язка.' },
    { id: 'ending', text: 'Фінал-несподіванка, а не пояснення жарту.' },
  ],
  'odnoho-razu-pered-rizdvom': [
    { id: 'three', text: 'У файлі рівно три окремі казки, кожна зі своєю назвою.' },
    { id: 'magic', text: 'Кожна казка має чарівний елемент (диво, вигаданий світ, тварини, що говорять). Реалістичне оповідання без чарівного елемента не підходить.' },
    { id: 'aloud', text: 'Казки придатні для читання вголос: коротка фраза, чутний ритм.' },
    { id: 'one_wonder', text: 'У кожній казці одне диво, а не десять — дитина встигає його зрозуміти.' },
    { id: 'child', text: 'Герой — дитина або той, з ким дитина себе впізнає.' },
    { id: 'calm', text: 'Фінал кожної казки спокійний — після нього можна вимкнути світло; зміст придатний для дитячої аудиторії.' },
  ],
}

export type ReviewItem = {
  id: string
  label: string
  /** 0–10; null — «не оцінюється» (na). */
  score: number | null
  source: 'code' | 'ai'
  comment: string
  quotes: string[]
}

export type LangIssue = { quote: string; fix: string; note: string }

export type ReviewResult = {
  contest: string
  items: ReviewItem[]
  grammar: { score: number; comment: string; issues: LangIssue[] }
  style: { score: number; comment: string; issues: LangIssue[] }
  /** Середнє всіх оцінених пунктів, переведене в 0–100. */
  total: number
  summary: string
  /** Цитати, яких модель не знайшла в тексті, — прибрані з оцінки. */
  unverified_quotes: string[]
  tales?: { title: string; words: number }[]
}

export type EntryInput = {
  contest: string
  title: string
  annotation: string
  genre: string
  episodes: { ord: number; body: string }[]
}

export function reviewHash(e: EntryInput): string {
  const h = createHash('sha256')
  h.update(e.contest + '\n' + e.title + '\n' + e.annotation + '\n')
  for (const ep of e.episodes) h.update(`#${ep.ord}\n${ep.body}\n`)
  return h.digest('hex')
}

const squash = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

/** Позиція цитати в оригінальному тексті (ігноруючи регістр, пробіли й розділові знаки). */
function findPos(text: string, quote: string): number {
  const q = squash(quote)
  if (q.length < 4) return -1
  let s = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (/[\p{L}\p{N}]/u.test(ch)) { s += ch.toLowerCase(); map.push(i) }
  }
  const k = s.indexOf(q)
  return k < 0 ? -1 : map[k]
}

// ---------------------------------------------------------------------------
// Перевірки, які рахує код
// ---------------------------------------------------------------------------
function codeChecks(e: EntryInput): ReviewItem[] {
  const c = findContest(e.contest)
  if (!c) return []
  const out: ReviewItem[] = []
  const n = e.episodes.length
  const words = e.episodes.map((x) => countWords(x.body))

  if (c.episodes > 1) {
    if (c.atOnce) {
      out.push({ id: 'episodes_count', label: `Кількість серій: потрібно ${c.episodes}`, source: 'code', quotes: [],
        score: n === c.episodes ? 10 : 0, comment: `Подано ${n} із ${c.episodes}.` })
    } else {
      out.push({ id: 'episodes_count', label: `Кількість серій: потрібно ${c.episodes} (досилаються по черзі)`, source: 'code', quotes: [],
        score: null, comment: `Подано ${n} із ${c.episodes}. Решту автор досилає щотижня — це не порушення.` })
    }
    const bad = words.map((w, i) => ({ w, ord: e.episodes[i].ord })).filter((x) => x.w < c.minWords || x.w > c.maxWords)
    out.push({ id: 'episode_words', label: `Обсяг кожної серії: ${c.minWords}–${c.maxWords} слів`, source: 'code', quotes: [],
      score: n ? Math.round(10 * (n - bad.length) / n) : 0,
      comment: e.episodes.map((x, i) => `серія ${x.ord}: ${words[i]}`).join('; ') + (bad.length ? `. Поза межами: ${bad.map((b) => `серія ${b.ord}`).join(', ')}.` : '. Усі в межах.') })
  } else {
    const total = words.reduce((a, b) => a + b, 0)
    out.push({ id: 'total_words', label: `Обсяг: ${c.minWords}–${c.maxWords} слів`, source: 'code', quotes: [],
      score: total >= c.minWords && total <= c.maxWords ? 10 : 0, comment: `${total} слів.` })
  }
  return out
}

/** Обсяг кожної казки: модель вказує початок кожної, слова рахує код. */
function taleChecks(text: string, tales: { title?: string; start_quote?: string }[]): { item: ReviewItem; tales: { title: string; words: number }[] } {
  const found = tales
    .map((t) => ({ title: String(t.title ?? '').trim() || 'Без назви', pos: findPos(text, String(t.start_quote ?? '')) }))
    .filter((t) => t.pos >= 0)
    .sort((a, b) => a.pos - b.pos)
  const res = found.map((t, i) => ({ title: t.title, words: countWords(text.slice(t.pos, i + 1 < found.length ? found[i + 1].pos : text.length)) }))
  const ok = res.filter((t) => t.words >= 800 && t.words <= 1500).length
  return {
    tales: res,
    item: {
      id: 'tale_words', label: 'Обсяг кожної казки: 800–1500 слів', source: 'code', quotes: [],
      score: res.length ? Math.round(10 * ok / Math.max(3, res.length)) : null,
      comment: res.length
        ? res.map((t) => `«${t.title}»: ${t.words}`).join('; ') + (res.length !== tales.length ? '. Початок частини казок у тексті не знайдено — перевірте вручну.' : '')
        : 'Межі казок визначити не вдалося — перевірте вручну.',
    },
  }
}

// ---------------------------------------------------------------------------
// Запит до моделі
// ---------------------------------------------------------------------------
function buildPrompt(e: EntryInput, reqs: Requirement[], fairy: boolean): string {
  const c = findContest(e.contest)
  const body = e.episodes.map((x) => (e.episodes.length > 1 ? `=== СЕРІЯ ${x.ord} ===\n` : '') + x.body).join('\n\n').slice(0, MAX_TEXT_CHARS)
  return `Ти — незалежний експерт літературного конкурсу платформи Balabony. Оціни твір СУВОРО ЗА УМОВАМИ конкурсу, граматикою і стилістикою української мови. Ти не знаєш і не вгадуєш автора. Будь точним і справедливим: високий бал лише тоді, коли вимогу справді виконано, низький — коли в тексті є конкретне порушення. Кожну оцінку обґрунтуй.

Конкурс: ${c?.name ?? e.contest}
Назва твору: ${e.title}
Жанр (з заявки): ${e.genre || '—'}
Анотація / синопсис: ${e.annotation || '— (порожньо)'}

ВИМОГИ ДО ОЦІНКИ (кожну окремо, бал 0–10 або "na", якщо вимогу не можна застосувати до цього тексту):
${reqs.map((r) => `- [${r.id}] ${r.text}`).join('\n')}

ГРАМАТИКА (бал 0–10): орфографія, пунктуація, узгодження. Наведи до 12 найважливіших помилок.
СТИЛІСТИКА (бал 0–10): русизми й кальки, канцелярит, тавтологія, невдалі звороти, ритм. Наведи до 12 найважливіших проблем.
${fairy ? `
КАЗКИ: для кожної казки в тексті вкажи її назву і ДОСЛІВНО перші 8–12 слів її тексту (start_quote) — за ними код порахує обсяг кожної казки.
` : ''}
ПРАВИЛА ЦИТАТ: кожна цитата — ДОСЛІВНИЙ фрагмент тексту (5–25 слів), без змін. Якщо цитати немає — порожній масив. Не вигадуй цитат.

Відповідай ЛИШЕ JSON без пояснень і без markdown:
{
  "requirements": [ { "id": "<id вимоги>", "score": <0-10 або "na">, "comment": "<1–3 речення українською, чому такий бал>", "quotes": ["<цитата>"] } ],
  "grammar": { "score": <0-10>, "comment": "<1–2 речення>", "issues": [ { "quote": "<дослівний фрагмент з помилкою>", "fix": "<як правильно>", "note": "<коротко чому>" } ] },
  "style": { "score": <0-10>, "comment": "<1–2 речення>", "issues": [ { "quote": "<дослівний фрагмент>", "fix": "<як краще>", "note": "<коротко чому>" } ] },${fairy ? `
  "tales": [ { "title": "<назва казки>", "start_quote": "<перші 8–12 слів>" } ],` : ''}
  "summary": "<3–4 речення: загальний висновок, сильні сторони, головні порушення умов>"
}

ТЕКСТ ТВОРУ:
${body}`
}

const clampScore = (v: unknown): number | null => {
  if (v === 'na' || v === null || v === undefined) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(10, Math.round(n)))
}

export async function runContestReview(e: EntryInput): Promise<ReviewResult> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Немає ANTHROPIC_API_KEY')
  const contestId = e.contest as ContestId
  const specific = REQUIREMENTS[contestId]
  if (!specific) throw new Error(`Невідомий конкурс: ${e.contest}`)
  const reqs = [...specific, ...COMMON]
  const fairy = contestId === 'odnoho-razu-pered-rizdvom'
  const fullText = e.episodes.map((x) => x.body).join('\n\n')

  type Parsed = {
    requirements?: { id?: string; score?: unknown; comment?: string; quotes?: string[] }[]
    grammar?: { score?: unknown; comment?: string; issues?: LangIssue[] }
    style?: { score?: unknown; comment?: string; issues?: LangIssue[] }
    tales?: { title?: string; start_quote?: string }[]
    summary?: string
  }
  const client = new Anthropic({ apiKey: key })
  // Одна повторна спроба, якщо модель повернула зламаний JSON.
  let p: Parsed | null = null
  let lastErr: Error | null = null
  for (let attempt = 0; attempt < 2 && !p; attempt++) {
    const msg = await client.messages.create({
      model: REVIEW_MODEL,
      max_tokens: 8000,
      temperature: 0,
      messages: [{ role: 'user', content: buildPrompt(e, reqs, fairy) }],
    })
    const raw = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('').trim()
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    const start = clean.indexOf('{'), end = clean.lastIndexOf('}')
    try {
      if (start < 0 || end < 0) throw new Error('Модель не повернула JSON')
      p = JSON.parse(clean.slice(start, end + 1)) as Parsed
    } catch (err) { lastErr = err as Error }
  }
  if (!p) throw lastErr ?? new Error('Модель не повернула JSON')

  // Звіряємо цитати з текстом.
  const hay = squash(fullText)
  const unverified: string[] = []
  const real = (q: string) => {
    const s = squash(q)
    if (s.length < 4 || hay.includes(s)) return true
    unverified.push(q); return false
  }

  const byId = new Map((p.requirements ?? []).map((r) => [String(r.id ?? ''), r]))
  const aiItems: ReviewItem[] = reqs.map((r) => {
    const got = byId.get(r.id)
    return {
      id: r.id, label: r.text, source: 'ai' as const,
      score: got ? clampScore(got.score) : null,
      comment: got ? String(got.comment ?? '') : 'Модель цей пункт не оцінила — перевірте вручну.',
      quotes: (got?.quotes ?? []).map(String).filter(real),
    }
  })
  const langPart = (x?: { score?: unknown; comment?: string; issues?: LangIssue[] }) => ({
    score: clampScore(x?.score) ?? 0,
    comment: String(x?.comment ?? ''),
    issues: (x?.issues ?? []).filter((i) => i && real(String(i.quote ?? ''))).slice(0, 12)
      .map((i) => ({ quote: String(i.quote), fix: String(i.fix ?? ''), note: String(i.note ?? '') })),
  })
  const grammar = langPart(p.grammar)
  const style = langPart(p.style)

  // 14.10.2026: подвійні пробіли — одним пунктом, а не десятком однакових.
  // Модель часто перелічує їх по одному й забиває ними весь список граматики.
  // Рахуємо самі (точно), а пункти моделі про пробіли прибираємо.
  const isSpaceIssue = (i: LangIssue) => /пробіл/i.test(`${i.note} ${i.fix}`)
  const doubleSpaces = (fullText.match(/(?<=\S)[^\S\n]{2,}(?=\S)/g) ?? []).length
  for (const part of [grammar, style]) part.issues = part.issues.filter((i) => !isSpaceIssue(i))
  if (doubleSpaces > 0) {
    grammar.issues.unshift({
      quote: `подвійні пробіли — ${doubleSpaces} ${doubleSpaces === 1 ? 'місце' : doubleSpaces < 5 ? 'місця' : 'місць'}`,
      fix: 'замінити на один пробіл (у Word: Ctrl+H, знайти два пробіли, замінити одним)',
      note: 'технічна дрібниця, на оцінку майже не впливає',
    })
  }

  const items: ReviewItem[] = [...codeChecks(e)]
  let tales: { title: string; words: number }[] | undefined
  if (fairy) {
    const t = taleChecks(fullText, p.tales ?? [])
    items.push(t.item); tales = t.tales
  }
  items.push(...aiItems)
  items.push({ id: 'grammar', label: 'Граматика: орфографія, пунктуація, узгодження', source: 'ai', score: grammar.score, comment: grammar.comment, quotes: [] })
  items.push({ id: 'style', label: 'Стилістика: русизми, кальки, канцелярит, тавтологія', source: 'ai', score: style.score, comment: style.comment, quotes: [] })

  const scored = items.filter((i) => i.score !== null) as (ReviewItem & { score: number })[]
  const total = scored.length ? Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length * 10) : 0

  return {
    contest: e.contest, items, grammar, style, total,
    summary: String(p.summary ?? ''),
    unverified_quotes: unverified,
    ...(tales ? { tales } : {}),
  }
}
