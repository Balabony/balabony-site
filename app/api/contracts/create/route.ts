import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Створення авторського договору з кабінету.
 * Договір формується лише коли заповнені реквізити — інакше в тексті
 * будуть пропуски замість ПІБ та рахунку.
 *
 * Номер: 2026/001, 2026/002 … — наскрізна нумерація в межах року.
 * doc_url веде на сторінку договору, де текст підставлено даними автора.
 */

const REQUIRED = ['full_name', 'rnokpp', 'address', 'phone', 'payout_iban', 'bank_name'] as const

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  const p = await dbQuery(
    `select full_name, rnokpp, address, phone, payout_iban, bank_name, is_fop, revenue_share
       from author_profiles where user_id = $1 limit 1`,
    [user.id],
  )
  const prof = p.rows[0] as Record<string, string | number | boolean | null> | undefined
  if (!prof) return NextResponse.json({ ok: false, error: 'Профіль не знайдено' }, { status: 404 })

  const missing = REQUIRED.filter(f => !String(prof[f] ?? '').trim())
  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: 'Спершу заповніть реквізити — без них у договорі будуть пропуски' },
      { status: 400 },
    )
  }

  const existing = await dbQuery(
    `select id from author_contracts where author_id = $1 and status <> 'terminated' limit 1`,
    [user.id],
  )
  if (existing.rowCount && existing.rowCount > 0) {
    return NextResponse.json(
      { ok: false, error: 'Договір уже створено', id: existing.rows[0].id },
      { status: 409 },
    )
  }

  const year = new Date().getFullYear()
  const seq = await dbQuery(
    `select count(*)::int as n from author_contracts where number like $1`,
    [`${year}/%`],
  )
  const n = ((seq.rows[0]?.n as number | undefined) ?? 0) + 1
  const number = `${year}/${String(n).padStart(3, '0')}`

  const isFop = prof.is_fop === true
  // У профілі ставка лежить часткою (0.5 / 0.4), у договорі друкується відсотком.
  const shareFrac = prof.revenue_share == null ? (isFop ? 0.5 : 0.4) : Number(prof.revenue_share)
  const rate = Math.round(shareFrac * 100)

  const created = await dbQuery(
    `insert into author_contracts (author_id, number, status, rate, is_fop, created_at)
     values ($1, $2, 'draft', $3, $4, now())
     returning id`,
    [user.id, number, rate, isFop],
  )
  const id = created.rows[0].id as string

  await dbQuery(`update author_contracts set doc_url = $1 where id = $2`, [`/author/contract/${id}`, id])

  return NextResponse.json({ ok: true, id, number })
}
