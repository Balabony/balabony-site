// lib/canon/tysha.ts
// СЦЕНАРНА МАЙСТЕРНЯ «ТИШІ» — Ф0, механічні канон-перевірки (без AI).
// ПОВНІСТЮ ІЗОЛЬОВАНО від Балабонів: власний реєстр персонажів, власні правила.
// НЕ імпортує lib/characters (то Балабони) і НЕ містить «село-реалізму».
// Чиста функція: текст серії → список знахідок. Споживач — Ф1 /api/admin/tysha-check
// (коли серії поїдуть у content) або ручний прогін перед видачею .docx.

export type Severity = 'error' | 'warn' | 'info'

export interface Finding {
  rule: string
  severity: Severity
  message: string
  excerpt?: string
}

// ── РЕЄСТР ПЕРСОНАЖІВ / ПОЗИВНИХ «ТИШІ» (окремий канон) ──
export const TYSHA_CHARACTERS = [
  'максим', 'тихий',
  'роман', 'сашко', 'оля', 'куля',
  'андрій степанович', 'степанович', 'андрій',
  'каменєв',
  'дід', 'батя', 'степа', 'жарт',
  'майстер', 'тадек', 'тадеуш', 'майк',
  'люба', 'тітка люба', 'мати',
  // епізодичні (за посадою/роллю)
  'начальник', 'вчителька', 'офіцер', 'військовий', 'інструктор',
  'сержант', 'командир', 'поліцейський', 'лікарка', 'голос',
  'боєць', 'хлопчина',
]

// ── ПЕРЕДВІСНИКИ (розд.15, КРИТИЧНЕ) ──
// Явні анонси майбутнього = error. Уривають таємницю тихо й непомітно.
const FORESHADOW_ERROR = [
  'я ще не знав', 'тоді ще не знав', 'тоді не знав', 'ще не знав, що', 'не знав тоді',
  'не міг уявити', 'не міг тоді уявити', 'не здогадувався', 'не підозрював',
  'і гадки не мав', 'якби ж знав', 'якби я знав', 'якби тоді знав',
  'попереду чекало', 'попереду на нього чекало', 'попереду на мене чекало',
  'попереду чекала', 'це згодом', 'згодом аукнеться', 'згодом це',
  'пізніше виявиться', 'пізніше я зрозумію', 'незабаром я зрозумію',
  'доля вже готувала', 'майбутнє готувало', 'майбутнє вже готувало',
  'деяких зустрічей краще б не було', 'краще б тієї зустрічі не було',
  'тоді ще ніхто не знав', 'ніхто тоді не знав',
  'зрозумів пізніше', 'зрозумів це пізніше', 'зрозумів я це пізніше',
  'зрозумію це пізніше', 'усе зрозумів пізніше', 'зрозумів аж пізніше',
]
// М'якші маркери — можуть бути легітимні («востаннє перевірив магазин»),
// але часто = прихований анонс. warn, на око автора.
const FORESHADOW_WARN = [
  'це був останній раз', 'востаннє', 'востаннє бачив', 'востаннє чув',
  'більше він її не', 'більше я її не', 'більше вони не',
  'тоді я не міг знати', 'як виявиться', 'як виявилося потім',
  'звідки повертаються не всі', 'звідки не повертаються', 'звідки повертаються не всі',
  'якщо доживеш', 'якщо доживу', 'доживеш до того', 'доживу до того',
  'набагато пізніше', 'значно пізніше', 'багато пізніше',
]

// ── МАГІЯ / ФІЗИЧНО НЕМОЖЛИВЕ (без надсили) ──
// Дар = слух/tachypsychia/інтуїція. Усе фізично неможливе руйнує рамку. warn.
const MAGIC_WARN = [
  'бачив крізь', 'крізь стіни', 'крізь землю бачив', 'наскрізь бачив',
  'відчув за кілометр', 'за кілометри відчув', 'почув за кілометр',
  'знав наперед', 'знав, що буде', 'бачив майбутнє', 'читав майбутнє',
  'прочитав думки', 'читав думки', 'передбачив', 'провістив',
  'телепат', 'шосте чуття підказало точно', 'наче бачив на відстані',
]

// ── ШТАМП-ЗАЧИНИ (загальні + воєнні) ──
const CLICHE_OPENERS = [
  'усе почалося з того', 'все почалося з того', 'усе почалося', 'все почалося',
  'одного разу', 'якось', 'був звичайний день', 'нічого не віщувало',
  'ніщо не віщувало', 'як завжди', 'того фатального',
]

// Латиниця, дозволена в тексті (фронтова/технічна + дозволимо імена іноземців).
const LATIN_ALLOW = new Set([
  'gps','wi','fi','wifi','sms','4k','5g','3g','lte','usb','tv','id','ok','qr',
  'rpg','fpv','nlaw','himars','javelin', // фронтова техніка/абревіатури
  'http','https','www','com','ua','net','org',
])
// Латинські імена іноземних побратимів — НЕ підсвічувати (розд.16).
const FOREIGN_NAMES = new Set(['mike','michael','tadek','tadeusz'])

// Мат-корені (груба перевірка для реплік Максима — має бути чистий).
const PROFANITY_ROOTS = ['бляд', 'хуй', 'хуї', 'пизд', 'єба', 'йоба', 'йди на', 'курв', 'сук']

const TARGET_WORDS = 1800
const SILENCE_THRESHOLD = 5 // «тиша/тихо» понад це на серію — попередження

function norm(s: string): string {
  return s.toLowerCase().replace(/[\u02bc\u2019']/g, "'").replace(/ё/g, 'е').trim()
}

const KNOWN = new Set(TYSHA_CHARACTERS.map(norm))

export function checkTysha(text: string): Finding[] {
  const out: Finding[] = []
  if (!text || !text.trim()) {
    return [{ rule: 'порожньо', severity: 'error', message: 'Текст серії порожній.' }]
  }

  const lower = norm(text)
  const lines = text.split(/\r?\n/)
  const nonEmpty = lines.map(l => l.trim()).filter(Boolean)
  const wordCount = (text.match(/[А-Яа-яІіЇїЄєҐґA-Za-z'’\u02bc-]+/g) ?? []).length

  // ── 1. ПЕРЕДВІСНИКИ — error ──
  // Дедуплікація: довші маркери першими; якщо збіг накладається на вже
  // покритий діапазон — пропускаємо (щоб «я ще не знав» і «ще не знав, що»
  // не давали двох знахідок на тій самій фразі). Ловимо ВСІ входження
  // кожного маркера (один маркер може повторюватись у серії кілька разів).
  const covered: Array<[number, number]> = []
  const overlaps = (i: number, j: number) => covered.some(([a, b]) => i < b && j > a)
  const allOccurrences = (hay: string, needle: string): number[] => {
    const res: number[] = []
    let from = 0
    while (true) {
      const i = hay.indexOf(needle, from)
      if (i === -1) break
      res.push(i)
      from = i + needle.length
    }
    return res
  }
  for (const m of [...FORESHADOW_ERROR].sort((a, b) => b.length - a.length)) {
    for (const idx of allOccurrences(lower, norm(m))) {
      if (overlaps(idx, idx + m.length)) continue
      covered.push([idx, idx + m.length])
      out.push({
        rule: 'передвісник',
        severity: 'error',
        message: `Анонс майбутнього: «${m}…». Розд.15 — жодних передвісників, усе сюрприз.`,
        excerpt: text.slice(Math.max(0, idx - 10), idx + m.length + 30).replace(/\s+/g, ' ').trim(),
      })
    }
  }
  for (const m of FORESHADOW_WARN) {
    for (const idx of allOccurrences(lower, norm(m))) {
      if (overlaps(idx, idx + m.length)) continue
      covered.push([idx, idx + m.length])
      out.push({
        rule: 'передвісник?',
        severity: 'warn',
        message: `Можливий прихований анонс: «${m}». Перевір — чи не натякає на майбутнє.`,
        excerpt: text.slice(Math.max(0, idx - 10), idx + m.length + 30).replace(/\s+/g, ' ').trim(),
      })
    }
  }

  // ── 2. НАДМІРНЕ «ТИША / ТИХИЙ» — warn з лічильником ──
  // Рахуємо ПОСЛОВНО, щоб не чіпляти займенник «тих» і слова з «тих» усередині
  // («отих», «узятих», «уривчастих»). Враховуємо лише:
  //   тиш-  (тиша/тишу/тиші/тишею/тишком/притишити)
  //   тихий/тихо/тиха/тихе/тихим/тихих/тихого/тихою/тихенький…
  //   притих-/затих-/утих-
  const silenceWords: string[] = []
  let calloutCount = 0
  for (const m of text.matchAll(/[А-Яа-яІіЇїЄєҐґ'’\u02bc]+/g)) {
    const w = m[0]
    const lw = w.toLowerCase()
    const isSilence =
      lw.startsWith('тиш') ||
      /^тих(о|а|е|ий|им|их|ого|ому|ою|еньк)/.test(lw) ||
      lw.startsWith('притих') || lw.startsWith('затих') || lw.startsWith('утих')
    if (!isSilence) continue
    silenceWords.push(lw)
    // позивний «Тихий» (з великої, у звертанні/лапках) — не рахуємо як «зайву тишу»
    const before = text[m.index! - 1] ?? ''
    if (/^тих(ий|ого|ому|им)$/.test(lw) && (before === '«' || before === '—' || /[А-ЯІЇЄҐ]/.test(w[0]))) calloutCount++
  }
  const silenceCount = silenceWords.length
  if (silenceCount - calloutCount > SILENCE_THRESHOLD) {
    const sample = [...new Set(silenceWords)].slice(0, 8).join(', ')
    out.push({
      rule: 'надмірне «тиша»',
      severity: 'warn',
      message: `Слова про тишу — ${silenceCount} (з них ~${calloutCount} схожі на позивний «Тихий»; поріг ${SILENCE_THRESHOLD}). Не плети назву в кожен абзац. Приклади: ${sample}`,
    })
  }

  // ── 3. МАГІЯ / ФІЗИЧНО НЕМОЖЛИВЕ — warn ──
  for (const m of MAGIC_WARN) {
    const idx = lower.indexOf(norm(m))
    if (idx !== -1) {
      out.push({
        rule: 'магія?',
        severity: 'warn',
        message: `Схоже на надсилу: «${m}». Дар без магії — слух/реакція/інтуїція. Перевір, чи фізично можливо.`,
        excerpt: text.slice(Math.max(0, idx - 10), idx + m.length + 25).replace(/\s+/g, ' ').trim(),
      })
    }
  }

  // ── 4. ЛАТИНИЦЯ — info (ширший дозвіл, ніж у Балабонів) ──
  const latinSeen = new Set<string>()
  for (const m of text.matchAll(/[A-Za-z][A-Za-z\-]*/g)) {
    const tok = m[0]
    const before = text[m.index! - 1] ?? ''
    if (before === '@' || before === '/' || before === '.') continue
    const low = tok.toLowerCase()
    if (LATIN_ALLOW.has(low) || FOREIGN_NAMES.has(low)) continue
    if (/^\d/.test(tok)) continue
    if (latinSeen.has(low)) continue
    latinSeen.add(low)
    out.push({
      rule: 'латиниця',
      severity: 'info',
      message: `Латиниця: «${tok}». Якщо це не позивний/техніка/іноземне ім'я — кирилицею.`,
      excerpt: tok,
    })
  }

  // ── 5. ФОРМАТ РЕПЛІК «Імʼя:» + нові персонажі ──
  const seenNew = new Set<string>()
  for (const ln of nonEmpty) {
    if (/^[—–-]\s+\S/.test(ln)) {
      out.push({ rule: 'формат репліки', severity: 'warn', message: 'Репліка через тире — канон: «Імʼя: репліка».', excerpt: ln.slice(0, 60) })
      continue
    }
    const m = ln.match(/^([^:]{2,60}):\s/)
    if (!m) continue
    const namePart = m[1].split(',')[0].trim()
    const low = norm(namePart)
    if (KNOWN.has(low)) continue
    if (seenNew.has(low)) continue   // кожне ім'я показуємо лише раз
    seenNew.add(low)
    const first = namePart.split(/\s+/)[0]
    if (namePart.includes(' ') && KNOWN.has(norm(first))) {
      out.push({ rule: 'нарація-двокрапка', severity: 'warn', message: `«${namePart}:» схоже на нарацію з двокрапкою. Має бути «${first}: репліка», дію — в нарацію.`, excerpt: m[1].slice(0, 50) })
    } else if (!namePart.includes(' ') && /^[А-ЯІЇЄҐ]/.test(namePart)) {
      out.push({ rule: 'новий персонаж?', severity: 'warn', message: `Спікер «${namePart}» не в реєстрі «Тиші». Новий герой — додати в TYSHA_CHARACTERS?`, excerpt: namePart })
    }
  }

  // ── 6. ШТАМП-ЗАЧИН ──
  const firstPara = norm(nonEmpty[0] ?? '')
  for (const op of CLICHE_OPENERS) {
    if (firstPara.startsWith(norm(op))) {
      out.push({ rule: 'штамп-зачин', severity: 'warn', message: `Зачин-штамп: «${op}…». Почати інакше.`, excerpt: nonEmpty[0]?.slice(0, 60) })
      break
    }
  }

  // ── 7. ФІНАЛ — нарація, не репліка ──
  const last = nonEmpty[nonEmpty.length - 1] ?? ''
  const lastM = last.match(/^([^:]{2,40}):/)
  if (lastM && KNOWN.has(norm(lastM[1].split(',')[0].trim()))) {
    out.push({ rule: 'фінал-нарація', severity: 'warn', message: 'Серія завершується реплікою. Канон: фінал — авторська нарація (кліфгенґер), не катчфраза.', excerpt: last.slice(0, 60) })
  }

  // ── 8. МАТ У РЕПЛІКАХ МАКСИМА (має бути чистий) ──
  for (const ln of nonEmpty) {
    const m = ln.match(/^(максим|тихий):\s*(.+)/i)
    if (!m) continue
    const speech = norm(m[2])
    for (const root of PROFANITY_ROOTS) {
      if (speech.includes(root)) {
        out.push({ rule: 'мова Максима', severity: 'warn', message: 'Лайка в репліці Максима. Канон: його мова чиста, мат — лише в побратимів.', excerpt: ln.slice(0, 60) })
        break
      }
    }
  }

  // ── 9. ДУБЛІ-РЕПЛІКИ ОДНОГО ГЕРОЯ ПІДРЯД ──
  let prevSpeaker = ''
  for (const ln of nonEmpty) {
    const m = ln.match(/^([^:]{2,40}):\s/)
    const sp = m ? norm(m[1].split(',')[0].trim()) : ''
    if (sp && KNOWN.has(sp) && sp === prevSpeaker) {
      out.push({ rule: 'дублі-репліки', severity: 'warn', message: `Дві репліки «${m![1].trim()}» підряд — злити в одну.`, excerpt: ln.slice(0, 50) })
    }
    if (sp) prevSpeaker = sp
  }

  // ── 10. ДОВЖИНА — info ──
  if (wordCount < 1500) {
    out.push({ rule: 'довжина', severity: 'info', message: `Закоротко: ${wordCount} слів (ціль ~${TARGET_WORDS}).` })
  } else if (wordCount > 2300) {
    out.push({ rule: 'довжина', severity: 'info', message: `Задовго: ${wordCount} слів (ціль ~${TARGET_WORDS}).` })
  }

  // ── 11. ВКЛАДЕНІ КОНСТРУКЦІЇ — warn (проста людська мова) ──
  // Патерн «Не «…». А «…».» та подібні нагромадження лапок із запереченнями.
  for (const m of text.matchAll(/Не\s+«[^»]{1,80}»\.?\s+А\s+«[^»]{1,120}»/g)) {
    out.push({
      rule: 'складна конструкція',
      severity: 'warn',
      message: 'Вкладена конструкція «Не «…». А «…».» — спростити, написати людською мовою.',
      excerpt: m[0].slice(0, 70).replace(/\s+/g, ' '),
    })
  }
  // Речення з 3+ парами лапок підряд — забагато вкладень.
  for (const sent of text.split(/(?<=[.!?…])\s+/)) {
    const quotePairs = (sent.match(/«/g) ?? []).length
    if (quotePairs >= 3 && sent.length < 300) {
      out.push({
        rule: 'складна конструкція',
        severity: 'warn',
        message: `Забагато вкладених лапок (${quotePairs}) в одному реченні — спростити.`,
        excerpt: sent.slice(0, 70).replace(/\s+/g, ' ').trim(),
      })
    }
  }

  // ── 12. ДУЖЕ ДОВГІ РЕЧЕННЯ — info (проста мова) ──
  for (const sent of text.split(/(?<=[.!?…])\s+/)) {
    const w = (sent.match(/[А-Яа-яІіЇїЄєҐґ'’\u02bc-]+/g) ?? []).length
    if (w > 45) {
      out.push({
        rule: 'довге речення',
        severity: 'info',
        message: `Речення на ${w} слів — для простоти варто розбити.`,
        excerpt: sent.slice(0, 60).replace(/\s+/g, ' ').trim() + '…',
      })
    }
  }

  // ── 13. РОЗЖОВУВАННЯ РІШЕНЬ — warn ──
  // Фрази, що проговорюють очевидне рішення/наслідок (читач здогадається сам).
  const SPELLOUT = [
    'я все владнав', 'я все вирішив', 'я про все домовився', 'я про все подбав',
    'тепер ти розумієш', 'як ви вже зрозуміли', 'як ти вже здогадався',
    'іншими словами', 'тобто, простіше кажучи', 'що це означало',
    'і це означало одне', 'усе стало ясно', 'тут усе зрозуміло',
  ]
  for (const m of SPELLOUT) {
    const idx = lower.indexOf(norm(m))
    if (idx !== -1) {
      out.push({
        rule: 'розжовування',
        severity: 'warn',
        message: `Зайве проговорювання: «${m}». Читач здогадається сам — прибрати.`,
        excerpt: text.slice(Math.max(0, idx - 5), idx + m.length + 20).replace(/\s+/g, ' ').trim(),
      })
    }
  }

  // ── 14. ПРОПУЩЕНА КРАПКА / МЕЖА РЕЧЕННЯ — warn (детерміновано, не AI) ──
  // Gemini ненадійно ловить відсутню крапку. Тут — механіка.
  // Сигнал: «мала-літера ПРОБІЛ Велика-літера» БЕЗ розділового знака між ними
  //   («…і пішов Уже в дверях», «…спертися Я не називав», «…оцінки Пішов»).
  // Після «.», «!», «?», «…», «:», «—», «»» лукбехайнд НЕ спрацьовує (там стоїть
  // не мала літера) → наявні крапки/двокрапки реплік не чіпаємо.
  // Фільтр шуму: великим лишають імена власні. Тож показуємо лише ті випадки,
  // де те саме слово вже трапляється в тексті З МАЛОЇ (отже зазвичай НЕ власна
  // назва — «Уже/Пішов/Книжки/Я»). Імена персонажів «Тиші» пропускаємо завжди.
  const nameTokens = new Set<string>()
  for (const c of TYSHA_CHARACTERS) for (const part of c.split(/\s+/)) nameTokens.add(norm(part))
  // Множина слів, що трапляються в тексті з малої літери (нормалізовано).
  const lowerWordSet = new Set<string>()
  for (const m of text.matchAll(/[а-яіїєґ’ʼ'][а-яіїєґ’ʼ'\-]*/gu)) lowerWordSet.add(norm(m[0]))
  const reBoundary = /(?<=[а-яіїєґ’ʼ'])\s+([А-ЯІЇЄҐ][а-яіїєґ’ʼ'\-]*)/gu
  const sureHits: Finding[] = []           // warn: майже певно крапка пропущена
  const maybeHits: Finding[] = []          // info: кандидат (може й власна назва)
  const maybeSeen = new Set<string>()      // дедуп info за словом
  for (const m of text.matchAll(reBoundary)) {
    const capWord = m[1]
    const cw = norm(capWord)
    if (nameTokens.has(cw)) continue       // ім'я персонажа — легітимно велике
    const capStart = m.index! + (m[0].length - capWord.length)
    const excerpt = text.slice(Math.max(0, capStart - 25), capStart + capWord.length + 6).replace(/\s+/g, ' ').trim()
    if (lowerWordSet.has(cw) || cw === 'я') {
      // те саме слово вживається в тексті з малої → майже певно НЕ власна назва
      sureHits.push({
        rule: 'пропущена крапка?',
        severity: 'warn',
        message: `Велика «${capWord}» всередині речення без крапки перед нею — ймовірно пропущено крапку.`,
        excerpt,
      })
    } else if (!maybeSeen.has(cw)) {
      maybeSeen.add(cw)
      maybeHits.push({
        rule: 'велика літера в реченні?',
        severity: 'info',
        message: `Велика «${capWord}» всередині речення без крапки. Або тут бракує крапки, або це власна назва — перевір оком.`,
        excerpt,
      })
    }
  }
  const SURE_CAP = 25, MAYBE_CAP = 12
  for (const f of sureHits.slice(0, SURE_CAP)) out.push(f)
  if (sureHits.length > SURE_CAP) out.push({ rule: 'пропущена крапка?', severity: 'warn', message: `…і ще ${sureHits.length - SURE_CAP} таких місць.` })
  for (const f of maybeHits.slice(0, MAYBE_CAP)) out.push(f)
  if (maybeHits.length > MAYBE_CAP) out.push({ rule: 'велика літера в реченні?', severity: 'info', message: `…і ще ${maybeHits.length - MAYBE_CAP} великих літер у середині речень — перечитай оком.` })

  // Абзац, що не завершується розділовим знаком (можливо обірване речення).
  const PARA_END_OK = /[.!?…»)\];:—]$/
  let paraHits = 0
  for (const ln of nonEmpty) {
    if (ln.length < 25) continue
    if (PARA_END_OK.test(ln)) continue
    if (/[”"']$/.test(ln)) continue
    if (paraHits >= 10) break
    paraHits++
    out.push({
      rule: 'абзац без крапки?',
      severity: 'info',
      message: 'Абзац не завершується розділовим знаком — можливо, бракує крапки.',
      excerpt: ln.slice(Math.max(0, ln.length - 40)),
    })
  }

  // ── 15. ЛАПКИ + ПРОБІЛИ — детермінована типографіка (не AI) ──
  // НЕ чіпає коми/тире як «правильність» (то синтаксис, не патерн).

  // 15a. Парність «ялинок»: скануємо стеком. » без « або незакрите « = помилка.
  let depth = 0
  let strayClose = -1
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '«') depth++
    else if (ch === '»') { if (depth === 0 && strayClose < 0) strayClose = i; else depth-- }
  }
  if (strayClose >= 0) {
    out.push({
      rule: 'лапки непарні',
      severity: 'warn',
      message: 'Закрите «»» без відкритого «««». Перевір пари лапок.',
      excerpt: text.slice(Math.max(0, strayClose - 20), strayClose + 8).replace(/\s+/g, ' ').trim(),
    })
  }
  if (depth > 0) {
    const lastOpen = text.lastIndexOf('«')
    out.push({
      rule: 'лапки непарні',
      severity: 'warn',
      message: `Незакритих «««»: ${depth}. Кожне «««» має пару «»».`,
      excerpt: text.slice(Math.max(0, lastOpen - 5), lastOpen + 25).replace(/\s+/g, ' ').trim(),
    })
  }

  // 15b. Чужі лапки замість «»» (прямі " та англ. " " „). Апострофи НЕ чіпаємо.
  const WRONG_QUOTES = ['"', '\u201C', '\u201D', '\u201E', '\u201F', '\u2033']
  for (const q of WRONG_QUOTES) {
    if (text.includes(q)) {
      const idx = text.indexOf(q)
      out.push({
        rule: 'не ті лапки',
        severity: 'warn',
        message: `Вжито «${q}» замість українських «««…»»». Заміни на «»-ялинки.`,
        excerpt: text.slice(Math.max(0, idx - 12), idx + 12).replace(/\s+/g, ' ').trim(),
      })
    }
  }

  // 15c. Подвійні пробіли (не на початку рядка) — info.
  let dbl = 0, dblFirst = ''
  for (const m of text.matchAll(/(?<=\S) {2,}/g)) {
    dbl++
    if (!dblFirst) dblFirst = text.slice(Math.max(0, m.index! - 12), m.index! + 12).replace(/ {2,}/g, '␣␣')
  }
  if (dbl > 0) out.push({ rule: 'подвійний пробіл', severity: 'info', message: `Подвійних пробілів: ${dbl}. Стиснути до одного. Напр.: …${dblFirst}…` })

  // 15d. Пробіл ПЕРЕД розділовим (тире «—» не чіпаємо — воно з пробілами).
  let spBefore = 0, spBeforeEx = ''
  for (const m of text.matchAll(/ +([,.!?;:)»])/g)) {
    spBefore++
    if (!spBeforeEx) spBeforeEx = text.slice(Math.max(0, m.index! - 12), m.index! + 3).replace(/\s+/g, ' ').trim()
  }
  if (spBefore > 0) out.push({ rule: 'пробіл перед знаком', severity: 'warn', message: `Пробіл перед розділовим знаком: ${spBefore}. Напр.: «${spBeforeEx}».` })

  // 15e. Немає пробілу ПІСЛЯ коми / ; (між літерами, не між цифрами — «1,5» легітимне).
  let glued = 0, gluedEx = ''
  for (const m of text.matchAll(/(?<=\p{L})[,;](?=\p{L})/gu)) {
    glued++
    if (!gluedEx) gluedEx = text.slice(Math.max(0, m.index! - 10), m.index! + 12).replace(/\s+/g, ' ').trim()
  }
  if (glued > 0) out.push({ rule: 'злиплий знак', severity: 'warn', message: `Кома/«;» без пробілу після: ${glued}. Напр.: «${gluedEx}».` })

  // 15f. Двокрапка без пробілу між літерами («Імʼя:репліка») — час «19:00» не чіпаємо.
  let colon = 0, colonEx = ''
  for (const m of text.matchAll(/(?<=\p{L}):(?=\p{L})/gu)) {
    colon++
    if (!colonEx) colonEx = text.slice(Math.max(0, m.index! - 10), m.index! + 14).replace(/\s+/g, ' ').trim()
  }
  if (colon > 0) out.push({ rule: 'злиплий знак', severity: 'warn', message: `Двокрапка без пробілу після: ${colon}. Напр.: «${colonEx}».` })

  // 15g. Крапка без пробілу на межі речення («вірив.Він») — мала.Велика, не абревіатури.
  let dotGlue = 0, dotGlueEx = ''
  for (const m of text.matchAll(/(?<=\p{Ll})\.(?=\p{Lu})/gu)) {
    dotGlue++
    if (!dotGlueEx) dotGlueEx = text.slice(Math.max(0, m.index! - 10), m.index! + 12).replace(/\s+/g, ' ').trim()
  }
  if (dotGlue > 0) out.push({ rule: 'злиплий знак', severity: 'warn', message: `Крапка без пробілу перед новим реченням: ${dotGlue}. Напр.: «${dotGlueEx}».` })

  return out
}

// Зведення для UI/звіту.
export function summarize(findings: Finding[]) {
  return {
    error: findings.filter(f => f.severity === 'error').length,
    warn: findings.filter(f => f.severity === 'warn').length,
    info: findings.filter(f => f.severity === 'info').length,
  }
}
