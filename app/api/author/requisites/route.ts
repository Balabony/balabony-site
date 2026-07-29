import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Реквізити автора для договору.
 * Статус (ФОП / фізична особа) автор обирає сам — від нього залежить ставка:
 * ФОП 50%, фізична особа 40% «на руки» (податки платформа сплачує понад).
 * Уже підписані договори зберігають свою ставку й не переписуються.
 */

type Body = {
  fullName?: string
  rnokpp?: string
  address?: string
  phone?: string
  iban?: string
  bankName?: string
  payoutRecipient?: string | null
  penName?: string | null
  postalCode?: string | null
  npBranch?: string | null
  isFop?: boolean
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const fullName = (b.fullName ?? '').trim()
  const rnokpp = (b.rnokpp ?? '').replace(/\D/g, '')
  const address = (b.address ?? '').trim()
  const phone = (b.phone ?? '').trim()
  const iban = (b.iban ?? '').replace(/\s/g, '').toUpperCase()
  const bankName = (b.bankName ?? '').trim()
  const isFop = b.isFop === true

  if (fullName.split(/\s+/).length < 3) {
    return NextResponse.json({ ok: false, error: 'Впишіть ПІБ повністю' }, { status: 400 })
  }
  if (rnokpp.length !== 10) {
    return NextResponse.json({ ok: false, error: 'РНОКПП має містити 10 цифр' }, { status: 400 })
  }
  if (!/^UA\d{27}$/.test(iban)) {
    return NextResponse.json({ ok: false, error: 'Невірний формат IBAN' }, { status: 400 })
  }
  if (!address || !bankName || phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ ok: false, error: 'Заповніть усі обовʼязкові поля' }, { status: 400 })
  }

  const share = isFop ? 50 : 40

  await dbQuery(
    `update author_profiles
        set full_name = $1,
            rnokpp = $2,
            address = $3,
            phone = $4,
            payout_iban = $5,
            bank_name = $6,
            payout_recipient = $7,
            pen_name = $8,
            postal_code = $9,
            np_branch = $10,
            is_fop = $11,
            revenue_share = $12,
            requisites_updated_at = now()
      where user_id = $13`,
    [
      fullName, rnokpp, address, phone, iban, bankName,
      (b.payoutRecipient ?? '')?.trim() || null,
      (b.penName ?? '')?.trim() || null,
      (b.postalCode ?? '')?.trim() || null,
      (b.npBranch ?? '')?.trim() || null,
      isFop, share, user.id,
    ],
  )

  // Ставку оновлюємо лише в договорах, які ще не підписані.
  await dbQuery(
    `update author_contracts
        set rate = $1, is_fop = $2
      where author_id = $3 and status <> 'signed'`,
    [share, isFop, user.id],
  )

  return NextResponse.json({ ok: true })
}
