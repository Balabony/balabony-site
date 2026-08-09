import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { normalizeEmail } from '@/lib/normalize-email'

/**
 * Надсилання листа для входу.
 *
 * Раніше сторінка входу зверталась до Supabase напряму і завжди зводила
 * адресу до канонічного вигляду. Для нових це правильно, але тим, чий акаунт
 * заведено ще з крапкою в gmail, нормалізація створювала другий, порожній
 * кабінет: людина вводила свою справжню адресу, а лист ішов на неіснуючу.
 *
 * Тому вибір адреси переїхав на сервер і став таким:
 *   1. є акаунт рівно з тим, що ввели — беремо його;
 *   2. немає, але є з нормалізованою адресою — беремо нормалізовану;
 *   3. немає жодного — заводимо в канонічній формі.
 *
 * Клієнту не повідомляємо, який саме варіант спрацював і чи існує акаунт
 * узагалі: відповідь однакова в усіх випадках, інакше сторінку входу можна
 * було б використати для перевірки, хто зареєстрований на сайті.
 */

type Body = { email?: string }

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const raw = (body.email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return NextResponse.json({ ok: false, error: 'Перевірте адресу' }, { status: 400 })
  }

  const canonical = normalizeEmail(raw)
  let target = canonical

  // Якщо звірка з базою не вдалась, лишаємось на канонічній формі:
  // вхід має працювати навіть коли запит не пройшов.
  try {
    const res = await dbQuery(
      `select email
         from auth.users
        where lower(email) in ($1, $2)
        order by (lower(email) = $1) desc
        limit 1`,
      [raw, canonical],
    )
    const found = (res.rows[0]?.email ?? '').trim().toLowerCase()
    if (found !== '') target = found
  } catch {
    // лишаємо canonical
  }

  const origin = new URL(req.url).origin
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: target,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
