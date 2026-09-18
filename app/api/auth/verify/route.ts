import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { mergeAnonInto } from '@/lib/reader-id'
import { bindReferralIfAny, ensureUserRow } from '@/lib/referral'
import { resolveLoginEmail, safeNext } from '@/lib/login-email'

/**
 * Вхід КОДОМ із листа. Додано 18.09.2026.
 *
 * Навіщо, коли є кнопка в листі. Посилання з листа ламається у двох
 * поширених випадках:
 *   1. людина просить вхід на комп'ютері, а лист відкриває на телефоні —
 *      посилання працює лише в тому браузері, де вхід почали (PKCE);
 *   2. поштовий сервіс сам «відкриває» посилання для перевірки й цим його
 *      використовує (підозра на ukr.net: тест 18.09 дав otp_expired, хоча
 *      посилання вручну ще ніхто не відкривав).
 * В обох випадках людина бачить помилку. Код із листа вводиться там же,
 * де просили вхід, і від перевірки поштою не «згорає».
 *
 * Після входу — те саме, що в /auth/callback: рядок у users, перенесення
 * анонімної історії, реферал, і куди вести (next → кабінет автора → профіль).
 */

type Body = { email?: string; code?: string; next?: string | null }

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const raw = (body.email ?? '').trim().toLowerCase()
  const code = (body.code ?? '').replace(/\s+/g, '')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return NextResponse.json({ ok: false, error: 'Перевірте адресу' }, { status: 400 })
  }
  if (!/^\d{6,10}$/.test(code)) {
    return NextResponse.json({ ok: false, error: 'Код — це цифри з листа' }, { status: 400 })
  }

  const target = await resolveLoginEmail(raw)
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.verifyOtp({ email: target, token: code, type: 'email' })

  if (error || !data?.user) {
    return NextResponse.json(
      { ok: false, error: 'Код не підходить або вже застарів. Перевірте цифри або попросіть новий лист.' },
      { status: 400 },
    )
  }

  const user = data.user
  let destination = safeNext(body.next) ?? '/profile'

  try {
    await ensureUserRow(user.id, user.email ?? null)
    await mergeAnonInto(user.id)
    await bindReferralIfAny(user.id)
  } catch {
    // не критично — вхід важливіший
  }

  if (!safeNext(body.next)) {
    try {
      const res = await dbQuery(
        `select 1 from author_profiles where user_id = $1::uuid and is_active limit 1`,
        [user.id],
      )
      if (res.rows.length > 0) destination = '/author/dashboard'
    } catch {
      // ведемо в профіль
    }
  }

  return NextResponse.json({ ok: true, destination })
}
