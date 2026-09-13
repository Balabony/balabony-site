/**
 * app/api/plan-group/accept/route.ts
 *
 * Прийняття запрошення запрошеною людиною.
 *
 * ПРАВИЛО ПРИВ'ЯЗКИ: запрошення дійсне лише для тієї пошти, на яку надіслане.
 * Інакше посилання, переслане в месенджері, відкривало б доступ будь-кому —
 * а це рівно те, через що спільні коди для бібліотек не працюють.
 *
 * Так само роблять Fitbod і Spotify: «увійдіть саме тією адресою, на яку
 * прийшов лист».
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { grantMemberAccess, seatsUsed, type PlanGroup } from '@/lib/plan-groups'

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServerClient()
  const { data: auth } = await sb.auth.getUser()
  const user = auth?.user
  if (!user) {
    return NextResponse.json(
      { ok: false, code: 'auth', message: 'Спершу увійдіть тією поштою, на яку прийшло запрошення.' },
      { status: 401 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const token = typeof body?.token === 'string' ? body.token : null
  if (!token) return NextResponse.json({ ok: false, code: 'token' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { data: invite } = await db
    .from('plan_invites')
    .select('id, group_id, email, status, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!invite) {
    return NextResponse.json(
      { ok: false, code: 'notfound', message: 'Запрошення не знайдено.' },
      { status: 404 },
    )
  }

  if (invite.status === 'accepted') {
    return NextResponse.json({ ok: true, already: true })
  }

  if (invite.status !== 'pending') {
    return NextResponse.json(
      { ok: false, code: 'revoked', message: 'Це запрошення вже недійсне.' },
      { status: 400 },
    )
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, code: 'expired', message: 'Термін запрошення минув. Попросіть надіслати нове.' },
      { status: 400 },
    )
  }

  const userEmail = (user.email ?? '').trim().toLowerCase()
  if (userEmail !== invite.email.trim().toLowerCase()) {
    return NextResponse.json(
      {
        ok: false,
        code: 'wrong_email',
        message: `Запрошення надіслано на ${invite.email}. Увійдіть саме цією поштою.`,
      },
      { status: 403 },
    )
  }

  const { data: groupRow } = await db
    .from('plan_groups')
    .select('id, owner_user_id, kind, seats, plan, expires_at')
    .eq('id', invite.group_id)
    .maybeSingle()

  if (!groupRow || new Date(groupRow.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, code: 'group_expired', message: 'Термін дії пакета минув.' },
      { status: 400 },
    )
  }
  const group = groupRow as PlanGroup

  // Місця перевіряємо ще раз, у момент прийняття: між надсиланням листа й
  // переходом за посиланням власник міг запросити інших і вичерпати ліміт.
  const used = await seatsUsed(group.id)
  if (used > group.seats) {
    return NextResponse.json(
      { ok: false, code: 'no_seats', message: 'У пакеті не лишилося вільних місць.' },
      { status: 400 },
    )
  }

  // Рядок в app_users потрібен через FK у app_subscriptions.
  await db.from('app_users').upsert(
    { id: user.id, device_id: user.id },
    { onConflict: 'id', ignoreDuplicates: true },
  )

  const subscriptionId = await grantMemberAccess(group, user.id)
  if (!subscriptionId) {
    return NextResponse.json(
      { ok: false, code: 'grant_failed', message: 'Не вдалося відкрити доступ. Спробуйте ще раз.' },
      { status: 500 },
    )
  }

  await db.from('plan_invites').update({
    status: 'accepted',
    user_id: user.id,
    subscription_id: subscriptionId,
    accepted_at: new Date().toISOString(),
  }).eq('id', invite.id)

  return NextResponse.json({ ok: true })
}
