import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { buildVars } from '@/lib/contract/vars'
import { computeDocHash } from '@/lib/contract/hash'

/**
 * Відкриває сесію підпису договору через Дію.
 *
 * Діплінк Дії живе 3 хвилини (підтверджено Дією 29.07.2026), тому сесія
 * створюється саме в момент натискання кнопки, а не заздалегідь.
 *
 * Поки SIGN_SERVICE_URL не заданий — працює демонстраційний режим:
 * сесія створюється в БД, але без діплінка. Після підключення сервера
 * з бібліотекою ІІТ достатньо додати змінні оточення, код не міняється.
 */

const SIGN_SERVICE_URL = (process.env.SIGN_SERVICE_URL ?? '').trim()
const SIGN_SERVICE_TOKEN = (process.env.SIGN_SERVICE_TOKEN ?? '').trim()

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let contractId = ''
  try {
    const body = (await req.json()) as { contractId?: string }
    contractId = (body.contractId ?? '').trim()
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }
  if (!contractId) return NextResponse.json({ ok: false, error: 'Не вказано договір' }, { status: 400 })

  const own = await dbQuery(
    `select id, number, status, doc_url, doc_hash, created_at, signed_at
       from author_contracts
      where id = $1 and author_id = $2
      limit 1`,
    [contractId, user.id],
  )
  const contract = own.rows[0] as
    | { id: string; number: string; status: string; doc_url: string | null
        doc_hash: string | null; created_at: string | null; signed_at: string | null }
    | undefined

  if (!contract) return NextResponse.json({ ok: false, error: 'Договір не знайдено' }, { status: 404 })
  if (contract.status === 'signed') {
    return NextResponse.json({ ok: false, error: 'Договір уже підписано' }, { status: 409 })
  }

  // Фіксуємо редакцію (п. 2.5-1): текст умов, реквізити і склад переліку.
  // Робиться саме тут, у момент підпису — далі перелік може змінитися,
  // але підписаною лишається та редакція, суму якої записано.
  const p = await dbQuery(
    `select full_name, rnokpp, address, phone, payout_iban, bank_name, payout_recipient, pen_name
       from author_profiles where user_id = $1 limit 1`,
    [user.id],
  )
  const prof = (p.rows[0] ?? {}) as Record<string, string | null>

  const w = await dbQuery(
    `select content_id, title from contract_works where contract_id = $1`,
    [contract.id],
  )
  const works = w.rows as { content_id: string | null; title: string | null }[]

  const vars = buildVars(contract, prof, user.email ?? null, works.length)
  const docHash = computeDocHash(vars, works)

  await dbQuery(
    `update author_contracts
        set doc_hash = $1, doc_hash_at = now()
      where id = $2 and status <> 'signed'`,
    [docHash, contract.id],
  )

  const created = await dbQuery(
    `insert into signing_sessions (contract_id, author_id, doc_hash, expires_at)
     values ($1, $2, $3, now() + interval '3 minutes')
     returning id, expires_at`,
    [contract.id, user.id, docHash],
  )
  const session = created.rows[0] as { id: string; expires_at: string }

  // У демонстраційному режимі статус не чіпаємо: підпису не буде,
  // а договір лишався б висіти як «на підписанні».
  if (!SIGN_SERVICE_URL) {
    return NextResponse.json({
      ok: true,
      stub: true,
      sessionId: session.id,
      expiresAt: session.expires_at,
    })
  }

  await dbQuery(
    `update author_contracts set status = 'awaiting' where id = $1 and status = 'draft'`,
    [contract.id],
  )

  try {
    const res = await fetch(`${SIGN_SERVICE_URL.replace(/\/+$/, '')}/sign/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SIGN_SERVICE_TOKEN ? { Authorization: `Bearer ${SIGN_SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        sessionId: session.id,
        contractNumber: contract.number,
        docUrl: contract.doc_url,
      }),
    })

    if (!res.ok) throw new Error(`sign service ${res.status}`)

    const data = (await res.json()) as { deeplink?: string; qr?: string; hash?: string }

    await dbQuery(
      `update signing_sessions set deeplink = $1, doc_hash = coalesce($2, doc_hash) where id = $3`,
      [data.deeplink ?? null, data.hash ?? null, session.id],
    )

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      deeplink: data.deeplink,
      qr: data.qr,
      expiresAt: session.expires_at,
    })
  } catch {
    await dbQuery(
      `update signing_sessions set status = 'failed', error = 'sign service unavailable' where id = $1`,
      [session.id],
    )
    return NextResponse.json(
      { ok: false, error: 'Сервіс підпису тимчасово недоступний. Спробуйте за хвилину.' },
      { status: 503 },
    )
  }
}
