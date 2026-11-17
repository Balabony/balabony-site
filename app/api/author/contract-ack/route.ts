import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { CONTRACT_REVISION } from '@/lib/contract/template'

/**
 * 17.11.2026: автор підтверджує, що ознайомився з поточною редакцією договору (v8.8).
 * Лише облік (таблиця author_contract_acks), нічого не блокує.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let revision = ''
  try {
    revision = String(((await req.json()) as { revision?: string }).revision ?? '')
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }
  // Приймаємо лише поточну редакцію — не те, що надіслав клієнт.
  if (revision !== CONTRACT_REVISION) {
    return NextResponse.json({ ok: false, error: 'Редакція договору оновилась. Перезавантажте сторінку.' }, { status: 409 })
  }

  try {
    await dbQuery(
      `insert into author_contract_acks (user_id, revision) values ($1, $2)
       on conflict (user_id, revision) do nothing`,
      [user.id, revision],
    )
  } catch {
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
