import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { dbQuery } from '@/lib/db'

/**
 * Заведення автора: обліковий запис + профіль + запис згоди, одним рухом.
 *
 * Модель — «адмін запрошує». Автор не реєструється сам: інакше під чужим
 * іменем можна забрати чужі тексти й гонорари (та сама причина, чому
 * прив'язка в /admin/link-authors ручна).
 *
 * Пароль автору не задається і нікуди не пересилається. Замість цього
 * повертається одноразове посилання на встановлення пароля — його адмін
 * передає автору будь-яким каналом. Так не залежимо від того, чи налаштована
 * розсилка в Supabase, і не знаємо чужого пароля.
 *
 * Згода фіксується разом зі створенням: після історії з відкликаною згодою
 * кабінет без запису в author_consents заводити не можна.
 */

function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

type Body = {
  fullName?: string
  email?: string
  penName?: string
  isFop?: boolean
  consentChannel?: string
  consentNote?: string
}

const CHANNELS = ['email', 'phone', 'viber', 'telegram', 'paper', 'form', 'other']

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://balabony.com').replace(/\/+$/, '')

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 403 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const fullName = (body.fullName ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const penName = (body.penName ?? '').trim()
  const isFop = body.isFop === true
  const channel = (body.consentChannel ?? 'other').trim()
  const note = (body.consentNote ?? '').trim()

  if (fullName.length < 5 || !fullName.includes(' ')) {
    return NextResponse.json({ ok: false, error: 'Вкажіть прізвище та імʼя повністю' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Невірна електронна адреса' }, { status: 400 })
  }
  if (!CHANNELS.includes(channel)) {
    return NextResponse.json({ ok: false, error: 'Невідомий канал згоди' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // 1. Обліковий запис. Пароль не задаємо — автор поставить свій за посиланням.
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'author' },
  })

  let userId = created.data.user?.id ?? ''

  if (created.error) {
    // Обліковий запис міг існувати раніше (читач, який став автором).
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = list?.users?.find((u) => (u.email ?? '').toLowerCase() === email)
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: `Не вдалося створити акаунт: ${created.error.message}` },
        { status: 400 },
      )
    }
    userId = existing.id
  }

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Акаунт не створено' }, { status: 500 })
  }

  // 2. Профіль. Повторний запуск нічого не псує: наявний профіль лишається.
  await dbQuery(
    `insert into author_profiles
       (user_id, display_name, email, full_name, pen_name, is_fop, revenue_share, is_active)
     values ($1, $2, $3, $4, nullif($5, ''), $6, $7, true)
     on conflict (user_id) do update
        set display_name = excluded.display_name,
            email        = excluded.email,
            is_active    = true`,
    [userId, fullName, email, fullName, penName, isFop, isFop ? 0.5 : 0.4],
  )

  // 3. Згода на публікацію в Балабонах.
  await dbQuery(
    `insert into author_consents
       (author_name, user_id, scope, status, channel, happened_at, note)
     values ($1, $2, 'balabony', 'given', $3, now(), nullif($4, ''))`,
    [fullName, userId, channel, note],
  )

  // 4. Посилання для першого входу. Паролів на сайті немає — вхід через
  //    одноразове посилання, тому генеруємо magiclink і ведемо одразу в кабінет.
  //    Запасний шлях у автора завжди є: /login і власна пошта.
  let loginLink = ''
  const link = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${SITE_URL}/auth/callback?next=/author/dashboard` },
  })
  if (!link.error) {
    loginLink = link.data?.properties?.action_link ?? ''
  }

  return NextResponse.json({
    ok: true,
    userId,
    reused: Boolean(created.error),
    loginLink,
  })
}
