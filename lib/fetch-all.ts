/**
 * Забрати з Supabase УСІ рядки, а не першу тисячу.
 *
 * НАВІЩО (18.09.2026). Supabase (PostgREST) віддає не більше 1000 рядків
 * за запит, хоч би що стояло в .limit(). Код адмінки просив .limit(20000),
 * отримував 1000 і мовчки рахував по них. Вимір: page_views — 14 383 рядки,
 * /admin/analytics показувала «Переглядів: 1000», тобто бачила 7% даних.
 * Так само обрізались article_reads, user_acquisition та інші великі таблиці
 * у звітах «Читач», «Канали», «Банери».
 *
 * Як працює: тягне сторінками по 1000 через .range(), доки не прийде
 * неповна сторінка або не вичерпається max.
 *
 * ПОРЯДОК ОБОВ'ЯЗКОВИЙ. Без .order() Postgres не гарантує однакового
 * порядку між сторінками — рядки дублювалися б і губилися. Тому кожен
 * запит, переданий сюди, має сортування по стабільному полю.
 */
export async function fetchAll<T, E>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: E | null }>,
  max = 50000,
): Promise<{ data: T[]; error: E | null }> {
  const PAGE = 1000
  const all: T[] = []
  for (let from = 0; from < max; from += PAGE) {
    const to = Math.min(from + PAGE, max) - 1
    const { data, error } = await build(from, to)
    if (error) return { data: all, error }
    const rows = data ?? []
    all.push(...rows)
    if (rows.length < to - from + 1) break
  }
  return { data: all, error: null }
}
