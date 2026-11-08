// 08.11.2026: перевірити одноразовий код і підписати договір (lib/contract/otp.ts, п. 16.1 договору v8.6).
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { readSignToken } from '@/lib/contract/sign-link'
import { verifySignCode } from '@/lib/contract/otp'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { contractId?: string; token?: string; code?: string; agree?: boolean; worksClean?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 }) }
  if (body.agree !== true) return NextResponse.json({ ok: false, error: 'Поставте позначку «Я прочитав(ла) договір і погоджуюсь»' }, { status: 400 })
  let authorId = body.token ? readSignToken(body.token) : null
  if (body.token && !authorId) return NextResponse.json({ ok: false, error: 'Посилання застаріло. Попросіть у редакції нове.' }, { status: 401 })
  let via: 'cabinet' | 'link' = 'link'
  if (!authorId) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
    authorId = user.id; via = 'cabinet'
  }
  const contractId = String(body.contractId || '').trim()
  if (!contractId) return NextResponse.json({ ok: false, error: 'Не вказано договір' }, { status: 400 })
  try {
    const r = await verifySignCode(authorId, contractId, String(body.code || ''), {
      ip: (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null,
      ua: req.headers.get('user-agent'),
      worksClean: body.worksClean === true,
      via,
    })
    if (!r.ok) return NextResponse.json(r, { status: r.status })
    return NextResponse.json(r)
  } catch (e) {
    console.error('[otp/verify]', e)
    return NextResponse.json({ ok: false, error: 'Помилка на сервері. Спробуйте ще раз — код діє 15 хвилин.' }, { status: 500 })
  }
}
