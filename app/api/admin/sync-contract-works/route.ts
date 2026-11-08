import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { syncContractWorks } from '@/lib/contract/sync-works'

/**
 * Наповнення переліку творів (Додаток № 1) за договором.
 *
 * Досі рядки в contract_works заносилися вручну, тому договір показував
 * три твори зі 147. Прив'язка авторів (/admin/link-authors) оновлює лише
 * content.author_id і переліку не чіпає.
 *
 * Тут — синхронізація: у перелік договору додаються всі твори автора,
 * яких там ще немає. Рядки лягають НЕпідтвердженими (confirmed_at = null);
 * акцепт автор дає сам у кабінеті через /api/contracts/works/confirm.
 *
 * Ідемпотентність тримається на content_id. Старі рядки з порожнім
 * content_id спершу зшиваються з content за назвою — інакше повторний
 * запуск наплодив би дублі.
 *
 * Чернетки (status = 'draft') у перелік НЕ потрапляють: твору фактично ще
 * немає, назва може змінитися, а Додаток № 1 фіксує конкретні назви.
 * Щойно чернетка виходить із draft — синхронізацію можна запустити знову.
 *
 * Нічого не видаляє: твір, знятий із публікації, лишається в переліку,
 * бо права за ним уже передані.
 */

function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

type ContractRow = {
  id: string
  number: string
  status: string
  author_id: string
  author_name: string | null
  pen_name: string | null
  in_list: number
  author_works: number
  missing: number
  orphan_rows: number
}

const LIST_SQL = `
  select c.id::text            as id,
         c.number              as number,
         c.status              as status,
         c.author_id::text     as author_id,
         p.display_name        as author_name,
         p.pen_name            as pen_name,
         (select count(*) from contract_works w
           where w.contract_id = c.id)::int as in_list,
         (select count(*) from content t
           where t.author_id = c.author_id
             and t.status <> 'draft')::int as author_works,
         (select count(*) from content t
           where t.author_id = c.author_id
             and t.status <> 'draft'
             and not exists (
               select 1 from contract_works w
                where w.contract_id = c.id
                  and w.content_id = t.id))::int as missing,
         (select count(*) from contract_works w
           where w.contract_id = c.id
             and w.content_id is null)::int as orphan_rows
    from author_contracts c
    left join author_profiles p on p.user_id = c.author_id
   order by c.created_at desc
`

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  const r = await dbQuery(LIST_SQL, [])
  return NextResponse.json({ ok: true, contracts: (r.rows ?? []) as ContractRow[] })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  let body: { contract_id?: string }
  try {
    body = (await req.json()) as { contract_id?: string }
  } catch {
    return NextResponse.json({ ok: false, error: 'Не читається запит' }, { status: 400 })
  }

  const contractId = (body.contract_id ?? '').trim()
  if (!contractId) {
    return NextResponse.json({ ok: false, error: 'Не вказано договір' }, { status: 400 })
  }

  const c = await dbQuery(
    `select id::text as id, author_id::text as author_id
       from author_contracts where id = $1::uuid limit 1`,
    [contractId],
  )
  const contract = c.rows[0] as { id: string; author_id: string } | undefined
  if (!contract) {
    return NextResponse.json({ ok: false, error: 'Договір не знайдено' }, { status: 404 })
  }

  const { healed, added } = await syncContractWorks(contract.id, contract.author_id)

  const total = await dbQuery(
    `select count(*)::int as n from contract_works where contract_id = $1::uuid`,
    [contract.id],
  )
  const row = total.rows[0] as { n: number } | undefined

  return NextResponse.json({
    ok: true,
    healed,
    added,
    total: row?.n ?? 0,
  })
}
