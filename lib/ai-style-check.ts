// =============================================================================
// ВИЗНАЧАЛЬНИК СТИЛЮ — ознаки можливого використання генеративного ШІ
//
// Принцип: точні цифри рахує КОД (computeStats), модель лише інтерпретує їх
// і шукає цитати. Так модель не вигадує статистику, а редакція бачить цифри
// окремо від думки моделі.
//
// Модель НЕ виносить вердикт «написав ШІ». Результат — концентрація ознак,
// цитати, ознаки людської руки, запитання до автора й редакційна порада.
// Кожну цитату звіряємо з текстом (verifyQuotes): вигадану цитату позначаємо.
// =============================================================================

import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { AUTHOR_QUESTIONS, AI_POLICY_SHORT, type Answers } from '@/lib/author-questions'

export const STYLE_MODEL = 'claude-sonnet-4-6'
const MAX_TEXT_CHARS = 90_000

export type StyleStats = {
  words: number
  sentences: number
  meanSentence: number
  medianSentence: number
  shortShare: number
  longShare: number
  oneSentenceParagraphShare: number
  dialogueLines: number
  dashesPer1000: number
  ellipsesPer1000: number
  similesPer1000: number
  antithesisCount: number
  neVidAVidCount: number
  topRepeats: { phrase: string; count: number }[]
  mixedScriptWords: string[]
}

const round1 = (x: number) => Math.round(x * 10) / 10
const round2 = (x: number) => Math.round(x * 100) / 100

export function computeStats(text: string): StyleStats {
  const words = text.split(/\s+/).filter(Boolean)
  const w = Math.max(words.length, 1)
  const flat = text.replace(/\n+/g, ' ')
  const sents = flat.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean)
  const lens = sents.map((s) => s.split(/\s+/).filter(Boolean).length).sort((a, b) => a - b)
  const mean = lens.reduce((a, b) => a + b, 0) / Math.max(lens.length, 1)
  const median = lens.length ? lens[Math.floor(lens.length / 2)] : 0
  const paras = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  const oneSent = paras.filter((p) => p.split(/(?<=[.!?…])\s+/).filter(Boolean).length === 1).length
  const count = (re: RegExp) => (text.match(re) ?? []).length

  // Повтори словосполучень з 3 слів — ознака шаблонних формул.
  const norm = words.map((x) => x.toLowerCase().replace(/[^\p{L}ʼ’'-]/gu, '')).filter(Boolean)
  const tri = new Map<string, number>()
  for (let i = 0; i + 2 < norm.length; i++) {
    const k = `${norm[i]} ${norm[i + 1]} ${norm[i + 2]}`
    tri.set(k, (tri.get(k) ?? 0) + 1)
  }
  const topRepeats = [...tri.entries()].filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1]).slice(0, 12).map(([phrase, count]) => ({ phrase, count }))

  const mixed = [...new Set((text.match(/[\p{L}ʼ’']+/gu) ?? [])
    .filter((x) => /[А-Яа-яІіЇїЄєҐґ]/.test(x) && /[A-Za-z]/.test(x)))].slice(0, 20)

  return {
    words: words.length,
    sentences: sents.length,
    meanSentence: round1(mean),
    medianSentence: median,
    shortShare: round2(lens.filter((x) => x <= 5).length / Math.max(lens.length, 1)),
    longShare: round2(lens.filter((x) => x >= 25).length / Math.max(lens.length, 1)),
    oneSentenceParagraphShare: round2(oneSent / Math.max(paras.length, 1)),
    dialogueLines: paras.filter((p) => /^[—–-]\s/.test(p)).length,
    dashesPer1000: round1(count(/—/g) / w * 1000),
    ellipsesPer1000: round1(count(/…|\.\.\./g) / w * 1000),
    similesPer1000: round1(count(/(^|[^\p{L}])(мов|мовби|ніби|немов|наче|неначе)(?=[^\p{L}]|$)/gimu) / w * 1000),
    antithesisCount: count(/(^|[^\p{L}])не\s+[^,.;—\n]{1,40},\s*а\s/giu),
    neVidAVidCount: count(/не від [^,\n]{1,30}, а /giu),
    topRepeats,
    mixedScriptWords: mixed,
  }
}

export type Marker = { n: number; name: string; score: number; evidence: string[]; human_explanation: string }
export type StyleResult = {
  level: 'низьку' | 'помірну' | 'значну' | 'дуже значну'
  summary: string
  scenario: string
  markers: Marker[]
  human_signs: { quote: string; why: string }[]
  answers_analysis: string | null
  questions_for_author: string[]
  recommendation: string
  recommendation_reason: string
  /** Цитати, яких немає в тексті дослівно — додає код. */
  unverified_quotes: string[]
}

export const MARKER_NAMES = [
  'Шаблонні фрази', 'Названі емоції', 'Кліше-метафори й символізм', 'Симетрія й антитези',
  'Передбачуваний сюжет', 'Діалоги-експозиція', 'Одноманітний ритм', 'Кінематографічність',
  'Відсутність авторської «шорсткості»', 'Концентрація маркерів',
]

export function textHash(text: string, answers: Answers | null): string {
  return createHash('sha256').update(text).update('\u0000').update(JSON.stringify(answers ?? {})).digest('hex')
}

function buildPrompt(p: { title: string; genre: string; text: string; stats: StyleStats; answers: Answers | null }): string {
  const answersBlock = p.answers && Object.keys(p.answers).length
    ? AUTHOR_QUESTIONS.filter((q) => p.answers?.[q.id]?.trim())
        .map((q) => `${q.id}. ${q.label}\nВідповідь: ${p.answers?.[q.id]}`).join('\n\n')
    : 'Відповідей автора немає.'

  return `Ти — експерт із forensic-аналізу авторського стилю, стилометрії та редакторської експертизи української художньої прози. Твоє завдання — оцінити ОЗНАКИ МОЖЛИВОГО використання генеративного ШІ, а не встановити авторство.

ЖОРСТКІ ПРАВИЛА
1. За одним текстом неможливо довести авторство ШІ. Не пиши «текст написав ШІ» чи «текст написала людина».
2. Не вигадуй статистики, ймовірностей чи відсотків. Числа нижче порахувала програма — спирайся лише на них.
3. Кожне твердження про ознаку підкріплюй ДОСЛІВНОЮ цитатою з тексту (до 200 знаків, без змін, без трикрапок усередині). Цитати перевірятимуться програмно.
4. Розрізняй: ознаку ШІ; ознаку людського редагування; художній прийом; жанрове кліше.
5. Калібруй під жанр: у вебпрозі, містиці, легендах і романтичній прозі часті тире, короткі абзаци, метафори світла й темряви. Сама жанровість — не доказ.
6. Не карай за граматичну правильність, обсяг чи «гарний стиль». Не оцінюй тему, мораль чи якість сюжету як такі.
7. Враховуй змішані сценарії: людина написала → ШІ відредагував; людина придумала сюжет → ШІ написав сцени; ШІ дав чернетку → людина переписала.
8. Оцінюй СИСТЕМАТИЧНІСТЬ: повторення ознак у всьому тексті, а не окремі речення.
9. Якщо доказів недостатньо — так і напиши: «недостатньо даних».

ПОЛІТИКА ПЛАТФОРМИ
${AI_POLICY_SHORT}

10 МАРКЕРІВ (бал 1–12: 1–2 практично відсутня; 3–4 слабко; 5–6 помірно; 7–8 виражена; 9–10 сильно; 11–12 дуже сильно й повторювано; 12 не означає «доведено»)
1. Шаблонні формули: «Вона ще не знала…», «Але ніч мовчала», «серце калатало», повторювані кінцівки сцен.
2. Названі емоції замість показаних дією.
3. Кліше-метафори й символізм: світло/темрява, серце/душа, «мов тінь», надлишок порівнянь.
4. Симетрія й антитези: «не X, а Y», «не від…, а від…», афористичні пари.
5. Передбачувана сюжетна логіка без несподіваних людських деталей.
6. Діалоги як носії експозиції: герої пояснюють відоме, озвучують мораль чи власну психологію.
7. Одноманітний синтаксичний ритм (див. цифри нижче); однаковий голос у різних епохах і героїв.
8. Кінематографічність: «Раптом…», кроки за спиною, обриви на однорядкових абзацах.
9. Відсутність авторської «шорсткості»: однакова якість і пафос, мало дивних, побутових, неідеальних деталей. Помилки, огріхи, живі побутові подробиці — ознаки людської руки.
10. Концентрація: чи маркери 1–9 справді збігаються в тих самих фрагментах.

ВІДПОВІДІ АВТОРА НА ЗАПИТАННЯ
Оціни конкретність, узгодженість із текстом (наприклад, чи цитата з п. 3 справді є в тексті), відповідність стилю відповідей стилю твору, чесність розкриття використання ШІ (п. 9) з огляду на політику платформи. Розбіжність стилів — привід придивитися, не доказ.

ФОРМАТ ВІДПОВІДІ — ЛИШЕ JSON, без markdown і пояснень поза ним:
{
  "level": "низьку" | "помірну" | "значну" | "дуже значну",
  "summary": "2–4 речення: «Текст демонструє … концентрацію ознак, сумісних із AI-assisted writing» і головне обґрунтування",
  "scenario": "найімовірніший сценарій створення тексту або «недостатньо даних»",
  "markers": [ {"n":1,"name":"…","score":1-12,"evidence":["дослівна цитата", "…"],"human_explanation":"альтернативне людське пояснення"} ... рівно 10 ],
  "human_signs": [ {"quote":"дослівна цитата","why":"чому це ознака людської руки"} ],
  "answers_analysis": "аналіз відповідей автора або null, якщо відповідей немає",
  "questions_for_author": ["2–3 конкретні запитання, які допоможуть з’ясувати процес написання"],
  "recommendation": "брати до розгляду" | "брати до розгляду після уточнень" | "запросити чернетки або інші тексти" | "є серйозні підстави для відмови",
  "recommendation_reason": "1–2 речення"
}

ДАНІ ПРОГРАМНОГО АНАЛІЗУ
${JSON.stringify(p.stats, null, 1)}

НАЗВА: ${p.title || '—'}
ЖАНР (зі слів автора): ${p.genre || '—'}

${answersBlock}

ТЕКСТ ТВОРУ
${p.text.slice(0, MAX_TEXT_CHARS)}`
}

const squash = (s: string) => s.replace(/[«»"“”„]/g, '').replace(/[’ʼ']/g, '’').replace(/\s+/g, ' ').trim().toLowerCase()

/** Прибирає з результату цитати, яких немає в тексті, і складає їх окремим списком. */
function verifyQuotes(r: StyleResult, text: string): StyleResult {
  const hay = squash(text)
  const bad: string[] = []
  const ok = (q: string) => {
    const s = squash(q).replace(/[.…]+$/, '')
    if (s.length < 4) return true
    if (hay.includes(s)) return true
    bad.push(q); return false
  }
  r.markers = (r.markers ?? []).map((m) => ({ ...m, evidence: (m.evidence ?? []).filter(ok) }))
  r.human_signs = (r.human_signs ?? []).filter((h) => ok(h.quote))
  r.unverified_quotes = bad
  return r
}

export async function runStyleCheck(p: { title: string; genre: string; text: string; answers: Answers | null }):
  Promise<{ stats: StyleStats; result: StyleResult }> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Немає ANTHROPIC_API_KEY')
  const stats = computeStats(p.text)
  const client = new Anthropic({ apiKey: key })
  const msg = await client.messages.create({
    model: STYLE_MODEL,
    max_tokens: 6000,
    messages: [{ role: 'user', content: buildPrompt({ ...p, stats }) }],
  })
  const raw = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('').trim()
  const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}')
  if (start < 0 || end < 0) throw new Error('Модель не повернула JSON')
  const parsed = JSON.parse(clean.slice(start, end + 1)) as StyleResult
  return { stats, result: verifyQuotes(parsed, p.text) }
}
