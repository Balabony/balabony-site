import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Підтвердження творів автором = акцепт за п. 2.4 договору.
 * Порожнє prior_publication означає виключні права (п. 2.7),
 * заповнене — невиключні (п. 2.8).
 */

type Item = { id?: string; priorPublication?: string | null }

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let contractId = ''
  let items: Item[] = []
  try {
    const body = (await req.json()) as { contractId?: string; works?: Item[] }
    contractId = (body.contractId ?? '').trim()
    items = Array.isArray(body.works) ? body.works : []
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  if (!contractId || items.length === 0) {
    return NextResponse.json({ ok: false, error: 'Порожній запит' }, { status: 400 })
  }

  const own = await dbQuery(
    `select id from author_contracts where id = $1 and author_id = $2 limit 1`,
    [contractId, user.id],
  )
  if (!own.rows[0]) {
    return NextResponse.json({ ok: false, error: 'Договір не знайдено' }, { status: 404 })
  }

  for (const it of items) {
    const id = (it.id ?? '').trim()
    if (!id) continue
    const prior = typeof it.priorPublication === 'string' && it.priorPublication.trim()
      ? it.priorPublication.trim().slice(0, 300)
      : null
    await dbQuery(
      `update contract_works
          set confirmed_at = coalesce(confirmed_at, now()),
              prior_publication = $1
        where id = $2 and contract_id = $3`,
      [prior, id, contractId],
    )
  }

  return NextResponse.json({ ok: true, count: items.length })
}
