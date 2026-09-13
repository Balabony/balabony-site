/**
 * app/api/plan-group/route.ts
 *
 * Керування груповим доступом з боку ВЛАСНИКА.
 *
 *   GET                      → моя група, місця, учасники
 *   POST { email }           → запросити
 *   DELETE { inviteId }      → видалити учасника або скасувати запрошення
 *
 * Право визначається одним способом: група має owner_user_id, і він мусить
 * збігатися з поточним користувачем. Жодних ідентифікаторів із тіла запиту
 * ми не довіряємо.
 *
 * ВХІД ОБОВ'ЯЗКОВИЙ. Тут не працює анонімний cookie: група прив'язана до
 * оплати, а оплата — до акаунта.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import {
  getOwnedGroup, listMembers, seatsUsed,
  newInviteToken, revokeMemberAccess, KIND_LABEL,
} from '@/lib/plan-groups'
import { sendPlanInviteEmail } from '@/lib/email'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://balabony.com'

async function currentUser() {
  try {
    const sb = await createSupabaseServerClient()
    const { data } = await sb.auth.getUser()
    return data?.user ?? null
  } catch {
    return null
  }
}

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const e = raw.trim().toLowerCase()
  // Свідомо проста перевірка: строгий регулярний вираз для пошти відкидає
  // законні адреси частіше, ніж ловить помилки. Справжня перевірка — це те,
  // чи лист дійшов.
  if (e.length < 5 || e.length > 254) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null
  return e
}

// ─── GET: стан моєї групи ────────────────────────────────────────────────────
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'auth' }, { status: 401 })

  const group = await getOwnedGroup(user.id)
  if (!group) return NextResponse.json({ ok: true, group: null })

  const [members, used] = await Promise.all([
    listMembers(group.id),
    seatsUsed(group.id),
  ])

  return NextResponse.json({
    ok: true,
    group: {
      id: group.id,
      kind: group.kind,
      kindLabel: KIND_LABEL[group.kind],
      seats: group.seats,
      used,
      free: Math.max(0, group.seats - used),
      expiresAt: group.expires_at,
    },
    members,
  })
}

// ─── POST: запросити ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'auth' }, { status: 401 })

  const group = await getOwnedGroup(user.id)
  if (!group) {
    return NextResponse.json(
      { ok: false, message: 'У вас немає групового пакета.' },
      { status: 400 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const email = normalizeEmail(body?.email)
  if (!email) {
    return NextResponse.json(
      { ok: false, message: 'Перевірте адресу пошти.' },
      { status: 400 },
    )
  }

  // Себе запросити не можна — місце власника вже враховане.
  if (email === (user.email ?? '').toLowerCase()) {
    return NextResponse.json(
      { ok: false, message: 'Ваше місце вже враховане — запрошувати себе не треба.' },
      { status: 400 },
    )
  }

  const used = await seatsUsed(group.id)
  if (used >= group.seats) {
    return NextResponse.json(
      { ok: false, message: `Усі ${group.seats} місць зайнято. Звільніть місце, щоб запросити нового учасника.` },
      { status: 400 },
    )
  }

  const db = getSupabaseAdmin()

  // Живе запрошення на цю адресу вже є? Тоді не плодимо друге, а надсилаємо
  // повторно те саме — саме цього чекає власник, натискаючи «запросити» вдруге.
  const { data: existing } = await db
    .from('plan_invites')
    .select('id, status, token, expires_at')
    .eq('group_id', group.id)
    .ilike('email', email)
    .in('status', ['pending', 'accepted'])
    .maybeSingle()

  if (existing?.status === 'accepted') {
    return NextResponse.json(
      { ok: false, message: 'Ця людина вже в групі.' },
      { status: 400 },
    )
  }

  const token = existing?.token ?? newInviteToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()

  if (existing) {
    await db.from('plan_invites')
      .update({ expires_at: expiresAt, invited_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    const { error } = await db.from('plan_invites').insert({
      group_id: group.id,
      email,
      token,
      status: 'pending',
      expires_at: expiresAt,
    })
    if (error) {
      console.error('[plan-group] invite insert failed', error)
      return NextResponse.json(
        { ok: false, message: 'Не вдалося створити запрошення.' },
        { status: 500 },
      )
    }
  }

  // Лист — після запису в базу. Якщо Resend упаде, запрошення все одно існує,
  // і власник може надіслати повторно тією самою кнопкою.
  try {
    await sendPlanInviteEmail({
      to: email,
      ownerName: user.email ?? 'Власник доступу',
      kindLabel: KIND_LABEL[group.kind],
      acceptUrl: `${SITE}/group/join?token=${encodeURIComponent(token)}`,
      expiresLabel: new Date(expiresAt).toLocaleDateString('uk-UA'),
    })
  } catch (e) {
    console.error('[plan-group] invite email failed', email, e)
    return NextResponse.json({
      ok: true,
      warning: 'Запрошення створено, але лист не надіслався. Спробуйте надіслати повторно.',
    })
  }

  return NextResponse.json({ ok: true })
}

// ─── DELETE: видалити учасника або скасувати запрошення ──────────────────────
export async function DELETE(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'auth' }, { status: 401 })

  const group = await getOwnedGroup(user.id)
  if (!group) return NextResponse.json({ ok: false }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const inviteId = typeof body?.inviteId === 'string' ? body.inviteId : null
  if (!inviteId) return NextResponse.json({ ok: false }, { status: 400 })

  const db = getSupabaseAdmin()

  // Рядок мусить належати САМЕ цій групі — інакше власник однієї групи міг би
  // видаляти учасників чужої, знаючи їхній id.
  const { data: invite } = await db
    .from('plan_invites')
    .select('id, subscription_id, group_id')
    .eq('id', inviteId)
    .eq('group_id', group.id)
    .maybeSingle()

  if (!invite) return NextResponse.json({ ok: false }, { status: 404 })

  // Спершу знімаємо доступ, потім позначаємо запрошення. Такий порядок
  // безпечніший: якщо друга дія не вдасться, людина вже без доступу, а місце
  // звільнить наступна спроба. Зворотний порядок лишив би доступ назавжди.
  await revokeMemberAccess(invite.subscription_id)
  await db.from('plan_invites')
    .update({ status: 'revoked', subscription_id: null })
    .eq('id', invite.id)

  return NextResponse.json({ ok: true })
}
