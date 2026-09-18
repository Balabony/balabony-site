import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { resolveLoginEmail, safeNext } from '@/lib/login-email'

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

type Body = { email?: string; next?: string | null }

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

  // Вибір адреси — у lib/login-email.ts (спільний із входом кодом).
  const target = await resolveLoginEmail(raw)

  const origin = new URL(req.url).origin
  const next = safeNext(body.next)
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: target,
    // ?next той самий, що вже розуміє /auth/callback. УВАГА: Supabase пускає
    // таку адресу лише тому, що 18.09.2026 в Authentication → URL Configuration
    // додано https://balabony.com/auth/callback** . Без цього рядка Supabase
    // мовчки підставляє Site URL без next, і людина опиняється в /profile.
    options: {
      emailRedirectTo: next
        ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
        : `${origin}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
