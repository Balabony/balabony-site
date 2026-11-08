// 08.11.2026: надіслати автору одноразовий код для підписання договору (lib/contract/otp.ts).
// Хто: автор у кабінеті (сесія) або автор за персональним посиланням (token з /pidpys/…).
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { readSignToken } from '@/lib/contract/sign-link'
import { sendSignCode } from '@/lib/contract/otp'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { contractId?: string; token?: string }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 }) }
  let authorId = body.token ? readSignToken(body.token) : null
  if (body.token && !authorId) return NextResponse.json({ ok: false, error: 'Посилання застаріло. Попросіть у редакції нове.' }, { status: 401 })
  if (!authorId) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
    authorId = user.id
  }
  const contractId = String(body.contractId || '').trim()
  if (!contractId) return NextResponse.json({ ok: false, error: 'Не вказано договір' }, { status: 400 })
  try {
    const r = await sendSignCode(authorId, contractId)
    if (!r.ok) return NextResponse.json(r, { status: r.status })
    return NextResponse.json(r)
  } catch (e) {
    console.error('[otp/send]', e)
    return NextResponse.json({ ok: false, error: 'Не вдалося надіслати код. Спробуйте ще раз за хвилину.' }, { status: 500 })
  }
}
