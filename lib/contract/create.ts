import { dbQuery } from '@/lib/db'

/**
 * Створення рядка договору з наскрізним номером 2026/001… — спільне для кабінету
 * (/api/contracts/create) і персонального посилання на підпис (/pidpys/…), 08.11.2026.
 */
export async function insertContract(authorId: string, rate: number, isFop: boolean): Promise<{ id: string; number: string }> {
  const year = new Date().getFullYear()

  // Номер рахуємо за НАЙБІЛЬШИМ уже виданим, а не за кількістю договорів.
  // Кількість бреше, щойно хоч один договір видалили: лишився 2026/002,
  // count = 1, наступний номер вийшов би знову 2026/002 — і унікальний
  // індекс валив запит із помилкою 500. Саме через це договір не формувався.
  // Плюс до п'яти спроб: якщо два автори тиснуть кнопку водночас, другий
  // просто візьме наступний вільний номер, а не впаде.
  const insertWithNumber = async (): Promise<{ id: string; number: string }> => {
    let lastErr: unknown = null

    for (let attempt = 0; attempt < 5; attempt++) {
      const seq = await dbQuery(
        `select coalesce(max(nullif(regexp_replace(number, '^[0-9]+/', ''), '')::int), 0) as n
           from author_contracts
          where number ~ ('^' || $1 || '/[0-9]+$')`,
        [String(year)],
      )
      const n = ((seq.rows[0]?.n as number | undefined) ?? 0) + 1 + attempt
      const number = `${year}/${String(n).padStart(3, '0')}`

      try {
        const created = await dbQuery(
          `insert into author_contracts (author_id, number, status, rate, is_fop, created_at)
           values ($1, $2, 'draft', $3, $4, now())
           returning id`,
          [authorId, number, rate, isFop],
        )
        return { id: created.rows[0].id as string, number }
      } catch (e) {
        const err = e as { code?: string }
        // 23505 — порушення унікальності. Номер зайняли, беремо наступний.
        if (err?.code !== '23505') throw e
        lastErr = e
      }
    }

    throw lastErr ?? new Error('Не вдалося підібрати вільний номер договору')
  }

  const res = await insertWithNumber()
  await dbQuery(`update author_contracts set doc_url = $1 where id = $2`, [`/author/contract/${res.id}`, res.id])
  return res
}
