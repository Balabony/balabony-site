/**
 * ПОРЯДОК ТВОРІВ З УРАХУВАННЯМ ЦИКЛІВ.
 *
 * ПРИЧИНА, побачена 17.09.2026 на /stories/zhanr/fantastyka. Розділ
 * сортувався за датою заливки, і 37 частин «Менталеса» й «Зворотної
 * сепарації» стояли в порядку 15, 14, 16, 9. Читач, який відкриває розділ,
 * не має жодного способу зрозуміти, з чого починати цикл.
 *
 * Дата тут узагалі не та величина, що потрібна: частини заливалися партіями
 * в довільному порядку, і «свіжіше» не означає «раніше в сюжеті».
 *
 * ЩО РОБИМО. Розпізнаємо номер частини в назві, збираємо цикл в один блок,
 * усередині блоку сортуємо ЗА НОМЕРОМ висхідно, а самі блоки й одиночні
 * твори лишаємо в порядку свіжості — як було. Тобто зміна стосується лише
 * того, що всередині циклу.
 *
 * Розведення авторів (spreadByAuthor) працює поверх БЛОКІВ, а не окремих
 * творів: інакше воно розірвало б щойно зібраний цикл.
 *
 * ЧОГО СВІДОМО НЕ РОБИМО. Не чіпаємо базу: номер частини не виноситься в
 * окрему колонку. Назви пишуть автори, форматів кілька («Частина 2»,
 * «(частина 2)», «ч.2», «Менталес. 13. …»), і додавати поле означало б
 * заповнювати його руками для 1132 творів. Розбір назви дешевший і
 * самооновлюваний; якщо автор напише формат, якого немає в переліку, твір
 * просто лишиться одиночним — як і зараз.
 */

export type Cycle = { key: string; part: number }

/** Прибирає хвостову пунктуацію й зводить регістр — щоб «А МАТИ ВСЕ ПРОЩАЄ…» і «А мати все прощає» стали одним ключем. */
function normKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s\u00a0]+/g, ' ')
    .replace(/[.…,:;!?"«»'’\-–—]+$/g, '')
    .trim()
}

/**
 * Витягує з назви цикл і номер частини. null — твір не схожий на частину.
 *
 * Порядок правил має значення: спершу явні «частина N», потім числовий
 * префікс «Назва. N. Підзаголовок», аж тоді пролог і епілог, які номера не
 * мають (0 і 100000, щоб ставали на початок і в кінець).
 *
 * Останнє правило — двоцифровий номер без крапки («Збірка "…" 02 Машина на
 * контролі»). Воно найслабше й може зачепити звичайну назву з числом, але
 * шкоди з цього немає: цикл з однієї частини далі трактується як одиночний
 * твір.
 */
export function parseCycle(title: string | null | undefined): Cycle | null {
  const t = String(title ?? '').trim()
  if (!t) return null
  let m: RegExpMatchArray | null

  if ((m = t.match(/^(.*?)[\s.,]*\(\s*частина\s*(\d+)\s*\)\s*$/i))) return { key: normKey(m[1]), part: Number(m[2]) }
  if ((m = t.match(/^(.*?)[\s.,…]*частина\s*(\d+)\s*$/i)))          return { key: normKey(m[1]), part: Number(m[2]) }
  if ((m = t.match(/^(.*?)[\s.,…]*ч\.?\s*(\d+)\s*$/i)))             return { key: normKey(m[1]), part: Number(m[2]) }
  if ((m = t.match(/^(.*?)\.\s*(\d+)\.\s+\S/)))                     return { key: normKey(m[1]), part: Number(m[2]) }
  if ((m = t.match(/^(.*?)\.\s*пролог/i)))                          return { key: normKey(m[1]), part: 0 }
  if ((m = t.match(/^(.*?)\.\s*епілог/i)))                          return { key: normKey(m[1]), part: 100000 }
  if ((m = t.match(/^(.{8,}?)\s+(\d{2})\s+\S/)))                    return { key: normKey(m[1]), part: Number(m[2]) }

  return null
}

/**
 * Упорядковує список: цикли — блоками за номером частини, решта — за датою.
 *
 * `dateOf` і `authorOf` передає сторінка, бо в різних таблицях дати лежать
 * у різних полях. `spread` вимикає розведення авторів там, де воно не
 * потрібне (сторінка самого автора, наприклад).
 */
export function orderWithCycles<T>(
  rows: T[],
  opts: {
    titleOf: (row: T) => string | null | undefined
    dateOf: (row: T) => number
    authorOf?: (row: T) => string
    spread?: boolean
  },
): T[] {
  const { titleOf, dateOf, authorOf, spread = true } = opts

  type Unit = { author: string; newest: number; items: { row: T; part: number }[] }
  const byKey = new Map<string, Unit>()
  const units: Unit[] = []

  for (const row of rows) {
    const cyc = parseCycle(titleOf(row))
    const author = authorOf ? authorOf(row) : ''
    const date = dateOf(row)

    // Ключ циклу враховує автора: два автори можуть мати «Частину 1» з
    // однаковою назвою, і зливати їх в один цикл не можна.
    const key = cyc ? `${author}\u0000${cyc.key}` : ''

    if (key && byKey.has(key)) {
      const u = byKey.get(key)!
      u.items.push({ row, part: cyc!.part })
      if (date > u.newest) u.newest = date
      continue
    }

    const unit: Unit = { author, newest: date, items: [{ row, part: cyc ? cyc.part : 0 }] }
    units.push(unit)
    if (key) byKey.set(key, unit)
  }

  // Блоки — за свіжістю найновішої частини; всередині блоку — за номером.
  units.sort((a, b) => b.newest - a.newest)
  for (const u of units) {
    if (u.items.length > 1) u.items.sort((a, b) => a.part - b.part)
  }

  const ordered = spread ? spreadByAuthor(units) : units
  return ordered.flatMap((u) => u.items.map((i) => i.row))
}

/**
 * Розсуває однакових авторів — та сама логіка, що була на сторінці жанру,
 * але поверх блоків: цикл лишається цілим.
 */
function spreadByAuthor<U extends { author: string }>(units: U[]): U[] {
  const out: U[] = []
  const pool = [...units]
  let prev: string | null = null

  while (pool.length > 0) {
    let i = pool.findIndex((u) => u.author !== prev)
    if (i === -1) i = 0
    const [taken] = pool.splice(i, 1)
    out.push(taken)
    prev = taken.author
  }
  return out
}
