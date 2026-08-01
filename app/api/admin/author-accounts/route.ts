import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Зведення по всіх кабінетах авторів.
 *
 * Одна сторінка замість чотирьох перевірок: чи автор заходив, чи заповнив
 * реквізити, чи прив'язані його твори, чи є договір і чи він підписаний.
 *
 * Запити навмисно розбиті на окремі, кожен у своєму try. Схема бази ще
 * добудовується (author_contracts, contract_works, author_consents з'явились
 * пізніше за профілі), і відсутність однієї таблиці не має гасити всю сторінку —
 * колонка просто лишиться порожньою.
 */

function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

/** Шість полів, без яких договір не сформується (див. /api/contracts/create). */
const REQUISITE_FIELDS = ['full_name', 'rnokpp', 'address', 'phone', 'payout_iban', 'bank_name'] as const

export type AccountRow = {
  user_id: string
  display_name: string
  pen_name: string | null
  email: string | null
  is_fop: boolean
  rate: number | null
  is_active: boolean
  created_at: string | null
  last_sign_in_at: string | null
  requisites_filled: number
  requisites_missing: string[]
  works_total: number
  works_published: number
  contract_number: string | null
  contract_status: string | null
  contract_works: number
  consent: string | null
  last_email_template: string | null
  last_email_at: string | null
  last_email_status: string | null
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  const warnings: string[] = []

  // --- 1. Профілі + факт входу -------------------------------------------
  let base: Record<string, unknown>[] = []
  try {
    const r = await dbQuery(`
      select p.user_id,
             coalesce(p.display_name, '') as display_name,
             p.pen_name,
             coalesce(p.email, u.email)   as email,
             coalesce(p.is_fop, false)    as is_fop,
             p.revenue_share,
             coalesce(p.is_active, true)  as is_active,
             p.full_name, p.rnokpp, p.address, p.phone, p.payout_iban, p.bank_name,
             u.created_at      as created_at,
             u.last_sign_in_at as last_sign_in_at
        from author_profiles p
        left join auth.users u on u.id = p.user_id
       order by coalesce(p.display_name, '')
    `)
    base = r.rows as Record<string, unknown>[]
  } catch (e) {
    const err = e as { message?: string }
    return NextResponse.json(
      { ok: false, error: `Не вдалося прочитати профілі авторів: ${err?.message ?? 'невідома помилка'}` },
      { status: 500 },
    )
  }

  const ids = base.map(b => String(b.user_id))

  // --- 2. Скільки творів прив'язано --------------------------------------
  const works = new Map<string, { total: number; published: number }>()
  if (ids.length > 0) {
    try {
      const r = await dbQuery(
        `select author_id::text as id,
                count(*)::int as total,
                count(*) filter (where status = 'published')::int as published
           from content
          where author_id = any($1::uuid[])
          group by author_id`,
        [ids],
      )
      for (const row of r.rows as { id: string; total: number; published: number }[]) {
        works.set(row.id, { total: row.total, published: row.published })
      }
    } catch {
      warnings.push('Не вдалося порахувати твори (таблиця content)')
    }
  }

  // --- 3. Договори --------------------------------------------------------
  const contracts = new Map<string, { number: string; status: string; works: number }>()
  if (ids.length > 0) {
    try {
      const r = await dbQuery(
        `select c.author_id::text as id, c.number, c.status::text as status,
                (select count(*) from contract_works w where w.contract_id = c.id)::int as works
           from author_contracts c
          where c.author_id = any($1::uuid[])
            and c.status <> 'terminated'`,
        [ids],
      )
      for (const row of r.rows as { id: string; number: string; status: string; works: number }[]) {
        contracts.set(row.id, { number: row.number, status: row.status, works: row.works })
      }
    } catch {
      warnings.push('Не вдалося прочитати договори (author_contracts / contract_works)')
    }
  }

  // --- 4. Згоди на публікацію --------------------------------------------
  // Згода записана на ім'я автора, не на його user_id, тому зіставляємо за
  // основним іменем і псевдонімом.
  const consents = new Map<string, string>()
  try {
    const r = await dbQuery(`
      select distinct on (author_name) author_name, status::text as status
        from author_consents
       where scope = 'balabony'
       order by author_name, happened_at desc nulls last, created_at desc
    `)
    for (const row of r.rows as { author_name: string; status: string }[]) {
      consents.set(row.author_name.trim().toLowerCase(), row.status)
    }
  } catch {
    warnings.push('Не вдалося прочитати згоди (author_consents)')
  }

  // --- 4b. Останній надісланий лист --------------------------------------
  const lastMail = new Map<string, { template: string; sent_at: string; status: string }>()
  if (ids.length > 0) {
    try {
      const r = await dbQuery(
        `select distinct on (author_id)
                author_id::text as id, template, status, sent_at
           from author_emails
          where author_id = any($1::uuid[])
          order by author_id, sent_at desc`,
        [ids],
      )
      for (const row of r.rows as { id: string; template: string; status: string; sent_at: string }[]) {
        lastMail.set(row.id, {
          template: row.template,
          status: row.status,
          sent_at: new Date(row.sent_at).toISOString(),
        })
      }
    } catch {
      warnings.push('Журнал листів ще не створено (author_emails)')
    }
  }

  // --- 5. Зшивання --------------------------------------------------------
  const rows: AccountRow[] = base.map(b => {
    const id = String(b.user_id)
    const missing = REQUISITE_FIELDS.filter(f => !String(b[f] ?? '').trim())
    const w = works.get(id)
    const c = contracts.get(id)

    const name = String(b.display_name ?? '').trim().toLowerCase()
    const pen = String(b.pen_name ?? '').trim().toLowerCase()
    const consent = consents.get(name) ?? (pen ? consents.get(pen) ?? null : null)

    const shareFrac = b.revenue_share == null ? null : Number(b.revenue_share)

    return {
      user_id: id,
      display_name: String(b.display_name ?? ''),
      pen_name: (b.pen_name as string | null) ?? null,
      email: (b.email as string | null) ?? null,
      is_fop: b.is_fop === true,
      rate: shareFrac == null ? null : Math.round(shareFrac * 100),
      is_active: b.is_active !== false,
      created_at: b.created_at ? new Date(b.created_at as string).toISOString() : null,
      last_sign_in_at: b.last_sign_in_at ? new Date(b.last_sign_in_at as string).toISOString() : null,
      requisites_filled: REQUISITE_FIELDS.length - missing.length,
      requisites_missing: missing.slice(),
      works_total: w?.total ?? 0,
      works_published: w?.published ?? 0,
      contract_number: c?.number ?? null,
      contract_status: c?.status ?? null,
      contract_works: c?.works ?? 0,
      consent,
      last_email_template: lastMail.get(id)?.template ?? null,
      last_email_at: lastMail.get(id)?.sent_at ?? null,
      last_email_status: lastMail.get(id)?.status ?? null,
    }
  })

  return NextResponse.json({ ok: true, rows, warnings })
}
