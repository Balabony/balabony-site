// =============================================================================
// ОЛЮДНЕННЯ — редактура ВЛАСНИХ текстів редакції (статті, листи, анонси)
//
// Бере ті самі 10 ознак, що й визначальник стилю (lib/ai-style-check.ts), і
// переписує текст так, щоб їх не було: емоції показані дією, без кліше,
// афоризмів-моралі, формульних кінцівок і однакового ритму.
//
// МЕЖА (п. 8.11 договору, правила конкурсів): інструмент для текстів редакції.
// Твори авторів і конкурсні роботи сюди НЕ вставляємо — для них діє заборона
// «ШІ переписує стиль». Тому API приймає лише вставлений текст, без номера
// заявки чи твору.
//
// Типографіку й змішані літери виправляє КОД (normalizeTypography), а не модель:
// так результат передбачуваний і нічого не губиться.
//
// УРОК ТЕСТУ 22.09.2026: стаття з індексом 18 після «олюднення» отримала 24.
// Модель, прибираючи одні ознаки, додала інші: три риторичні запитання поспіль
// (маркер 1), короткі ударні фрази (маркер 8), утричі більше тире. Тому:
//   • РЕЖИМИ: індекс < 31 → «легкий» (лише точкові правки й типографіка);
//     є результат перевірки → «точковий» (правимо лише цитати сильних маркерів);
//     інакше — «повний».
//   • ЗАБОРОНИ в промпті на прийоми, які визначальник сам ловить.
//   • ЗАПОБІЖНИК після правки: код порівнює цифри «до/після» і попереджає,
//     якщо тире, запитань чи однорядкових абзаців стало помітно більше.
// =============================================================================

import Anthropic from '@anthropic-ai/sdk'
import { STYLE_MODEL, computeStats } from '@/lib/ai-style-check'

export const MAX_HUMANIZE_CHARS = 30_000

// Латинські літери, що виглядають як кириличні. Замінюємо лише всередині слів,
// де є кирилиця: «Людвігo» → «Людвіго», а «Balabony» лишається як є.
const LAT2CYR: Record<string, string> = {
  a: 'а', c: 'с', e: 'е', i: 'і', o: 'о', p: 'р', x: 'х', y: 'у',
  A: 'А', B: 'В', C: 'С', E: 'Е', H: 'Н', I: 'І', K: 'К', M: 'М', O: 'О', P: 'Р', T: 'Т', X: 'Х',
}

export function normalizeTypography(text: string): string {
  let t = text
    .replace(/[\u200b\u200c\u200d\u2060\ufeff\u00ad]/g, '')        // невидимі символи
    .replace(/\*\*|__/g, '')                                        // залишки markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\.\.\./g, '…')                                        // одна трикрапка
    .replace(/(^|\s)[-–](?=\s)/gm, '$1—')                           // тире
    .replace(/(?<=\p{L})['ʼ](?=\p{L})/gu, '’')                      // апостроф
    .replace(/[ \t]{2,}/g, ' ')                                     // подвійні пробіли
  // Прямі й англійські лапки → ялинки (парами, у межах абзацу).
  t = t.split('\n').map((line) => {
    let open = true
    return line.replace(/["“”„]/g, () => { const q = open ? '«' : '»'; open = !open; return q })
  }).join('\n')
  // Змішані літери всередині кириличних слів.
  t = t.replace(/[\p{L}’]+/gu, (w) =>
    /[\u0400-\u04FF]/.test(w) && /[A-Za-z]/.test(w) ? w.replace(/[A-Za-z]/g, (ch) => LAT2CYR[ch] ?? ch) : w)
  return t
}

export type HumanizeChange = { before: string; after: string; why: string }
export type HumanizeMode = 'легкий' | 'точковий' | 'повний'
export type HumanizeMarker = { n: number; name: string; score: number; evidence: string[] }
export type HumanizeResult = { text: string; changes: HumanizeChange[]; placeholders: number; mode: HumanizeMode; warnings: string[] }

/** Режим за результатом перевірки оригіналу. Без перевірки — «повний». */
export function pickMode(index: number | null, markers: HumanizeMarker[]): HumanizeMode {
  if (index != null && index < 31) return 'легкий'
  if (markers.length) return 'точковий'
  return 'повний'
}

// Цифри, за якими визначальник ловить «рубаний» стиль. Рахуємо однаково до і після.
function shape(text: string) {
  const st = computeStats(text)
  const questions = (text.match(/\?/g) ?? []).length
  // Три й більше запитань поспіль у межах одного абзацу.
  const qChains = text.split(/\n+/).filter((p) => (p.match(/\?/g) ?? []).length >= 3).length
  return { dashes: st.dashesPer1000, oneSent: st.oneSentenceParagraphShare, shortShare: st.shortShare, questions, qChains, antithesis: st.antithesisCount }
}

/** Попередження, якщо правка додала прийомів, які визначальник вважає ознаками. */
export function guard(before: string, after: string): string[] {
  const a = shape(before), b = shape(after), w: string[] = []
  if (b.dashes > a.dashes * 1.5 && b.dashes - a.dashes > 8) w.push(`Тире стало помітно більше: ${a.dashes} → ${b.dashes} на 1000 слів. Частину замініть комами.`)
  if (b.questions > a.questions + 1) w.push(`Додано запитань: ${a.questions} → ${b.questions}. Риторичні запитання визначальник рахує шаблоном.`)
  if (b.qChains > a.qChains) w.push('Зʼявилися три й більше запитань поспіль в одному абзаці — це типовий шаблон.')
  if (b.oneSent > a.oneSent + 0.1) w.push(`Більше однорядкових абзаців: ${Math.round(a.oneSent * 100)} % → ${Math.round(b.oneSent * 100)} %.`)
  if (b.shortShare > a.shortShare + 0.1) w.push(`Більше коротких «ударних» речень: ${Math.round(a.shortShare * 100)} % → ${Math.round(b.shortShare * 100)} %.`)
  if (b.antithesis > a.antithesis) w.push(`Більше антитез «не…, а…»: ${a.antithesis} → ${b.antithesis}.`)
  return w
}

function modeBlock(mode: HumanizeMode, markers: HumanizeMarker[]): string {
  const strong = markers.filter((m) => m.score >= 6)
  const list = strong.map((m) => `• Маркер ${m.n} «${m.name}» (бал ${m.score}/12). Фрагменти: ${(m.evidence ?? []).slice(0, 4).map((e) => `«${e}»`).join('; ') || '—'}`).join('\n')
  if (mode === 'легкий') {
    return `РЕЖИМ: ЛЕГКИЙ. Редакційна перевірка вже оцінила цей текст як такий, що має НИЗЬКУ концентрацію ознак. НЕ переписуй його. Зміни не більше 10 % речень: лише явні кліше, канцелярит і повтори${list ? `, насамперед такі фрагменти:\n${list}` : '.'}\nУсе інше лиши дослівно — будь-яке «пожвавлення» тут тільки зашкодить.`
  }
  if (mode === 'точковий') {
    return `РЕЖИМ: ТОЧКОВИЙ. Редакційна перевірка знайшла ці ознаки — перепиши САМЕ ці фрагменти й подібні до них місця, решту тексту лиши якомога ближчою до оригіналу:\n${list || '(сильних маркерів немає — роби лише мінімальні правки)'}`
  }
  return 'РЕЖИМ: ПОВНИЙ. Перевірки оригіналу немає — редагуй увесь текст, але обережно й без зміни змісту.'
}

function buildPrompt(p: { title: string; kind: string; text: string; notes: string; mode: HumanizeMode; markers: HumanizeMarker[] }): string {
  return `Ти — досвідчений український літературний редактор. Відредагуй ТЕКСТ так, щоб він звучав як жива авторська проза чи публіцистика, а не як шаблонний текст.

${modeBlock(p.mode, p.markers)}

ЩО ПРИБРАТИ (це 10 ознак, які шукає редакційна перевірка стилю)
1. Шаблонні формули й повторювані кінцівки абзаців та розділів.
2. Названі емоції («відчув тривогу», «серце сповнилося радістю») — заміни дією, деталлю, реакцією.
3. Кліше-метафори: світло/темрява, серце/душа, «мов тінь», надлишок порівнянь.
4. Симетричні антитези й афоризми «не X, а Y», «це не про…, це про…», висновки-мораль.
5. Передбачувані ходи й загальні слова там, де потрібна конкретика.
6. Пояснення очевидного читачеві; діалоги, що переказують відоме.
7. Однаковий ритм: чергуй довгі й короткі речення, прибери ланцюги однорядкових абзаців.
8. «Раптом», «і тут», драматичні обриви без потреби.
9. Надмірну гладкість і пафос: дозволь розмовні звороти, конкретні побутові й професійні деталі.
10. Повтори тих самих слів і конструкцій.
Також прибери канцелярит («здійснювати», «є важливим»), вставні «варто зазначити», «важливо розуміти», «у сучасному світі».

ЖОРСТКІ ПРАВИЛА
- Зберігай усі факти, цифри, назви, імена, дати, посилання й цитати БЕЗ ЗМІН. Не додавай фактів, яких немає в тексті чи в нотатках автора.
- Не вигадуй особистого досвіду, історій чи свідків. Де живий приклад з досвіду автора зробив би текст сильнішим, постав позначку [ДОДАЙТЕ ВЛАСНИЙ ПРИКЛАД: про що саме] — автор допише сам.
- Нотатки автора нижче — це його власні деталі: впиши їх у текст природно, їхній зміст не змінюй.
- Мова — сучасна українська літературна норма, без русизмів і калькованих зворотів.
- Обсяг приблизно той самий (±15 %). Структуру й підзаголовки зберігай, якщо вони є.
- Не пояснюй свою роботу в тексті й не додавай вступу чи висновку від себе.

ЧОГО НЕ РОБИТИ, «ОЖИВЛЯЮЧИ» ТЕКСТ (ці прийоми редакційна перевірка теж вважає ознаками ШІ):
- НЕ додавай риторичних запитань, яких немає в оригіналі; особливо — кількох запитань поспіль.
- НЕ роби коротких «ударних» речень і однорядкових абзаців для ефекту («Перевірити легко — шукайте…», «Без паніки — і…»).
- НЕ став тире там, де звичайна кома, двокрапка чи сполучник. Тире — лише в діалогах і там, де воно граматично потрібне.
- НЕ додавай антитез «не X, а Y» і висновків-афоризмів.
- Кількість речень і абзаців тримай близькою до оригіналу; не дроби довгі речення на короткі без потреби.
- Жанр поважай: у статті-інструкції наказовий спосіб і нумеровані кроки — норма, їх не переписуй «художньо».
- Жива мова — це конкретика й точні слова, а не риторичні прийоми.

ФОРМАТ ВІДПОВІДІ — рівно два блоки, без нічого іншого:
<text>
відредагований текст
</text>
<changes>
[{"before":"фрагмент оригіналу до 160 знаків","after":"як стало","why":"яку ознаку прибрано, 3–8 слів"}, ... 5–12 найпоказовіших змін]
</changes>

ВИД ТЕКСТУ: ${p.kind || 'стаття'}
НАЗВА: ${p.title || '—'}

НОТАТКИ АВТОРА (власні деталі й факти, можуть бути порожні):
${p.notes || '—'}

ТЕКСТ
${p.text}`
}

export async function runHumanize(p: { title: string; kind: string; text: string; notes: string; index: number | null; markers: HumanizeMarker[] }): Promise<HumanizeResult> {
  const mode = pickMode(p.index, p.markers)
  const source = normalizeTypography(p.text)
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Немає ANTHROPIC_API_KEY')
  const client = new Anthropic({ apiKey: key })
  const msg = await client.messages.create({
    model: STYLE_MODEL,
    max_tokens: 16000,
    messages: [{ role: 'user', content: buildPrompt({ title: p.title, kind: p.kind, notes: p.notes, text: source, mode, markers: p.markers }) }],
  })
  const raw = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
  const tm = raw.match(/<text>\s*([\s\S]*?)\s*<\/text>/)
  if (!tm) throw new Error('Модель не повернула текст')
  let changes: HumanizeChange[] = []
  const cm = raw.match(/<changes>\s*([\s\S]*?)\s*<\/changes>/)
  if (cm) {
    try {
      const s = cm[1].replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1)) as HumanizeChange[]
      changes = parsed.filter((c) => c && c.before && c.after).slice(0, 12)
    } catch { /* список змін — довідковий, без нього текст усе одно корисний */ }
  }
  const text = normalizeTypography(tm[1])
  const placeholders = (text.match(/\[ДОДАЙТЕ ВЛАСНИЙ ПРИКЛАД/g) ?? []).length
  return { text, changes, placeholders, mode, warnings: guard(source, text) }
}
