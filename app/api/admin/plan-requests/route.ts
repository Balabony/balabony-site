/**
 * app/api/admin/plan-requests/route.ts
 *
 * Заявки юросіб на корпоративний і бібліотечний доступ.
 *
 *   GET                                    → перелік заявок
 *   PATCH { id, status | adminNote }       → змінити стан або примітку
 *   POST  { id, ownerEmail }               → ВІДКРИТИ ДОСТУП: створити групу
 *
 * Найважливіше тут — POST. Він виконується вручну, вже після того, як кошти
 * надійшли на рахунок ФОПа: сайт про оплату не знає й знати не може, бо
 * гроші йдуть банківським переказом за рахунком.
 *
 * Власником групи стає обліковий запис контактної особи. Якщо вона ще не
 * зареєстрована на сайті, доступ відкрити не можна — групі немає кому
 * належати. Тому роут відмовляє з зрозумілим поясненням, а не мовчки падає.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SEATS_BY_KIND, KIND_LABEL, type PlanGroupKind } from '@/lib/plan-groups'
import { sendGroupOpenedEmail } from '@/lib/email'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://balabony.com'

async function assertAdmin() {
  const jar = await cookies()
  return jar.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// ─── Перелік ────────────────────────────────────────────────────────────────
export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('plan_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[admin/plan-requests] list failed', error)
    return NextResponse.json({ error: 'db' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, items: data ?? [] })
}

// ─── Зміна стану або примітки ───────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id : null
  if (!id) return NextResponse.json({ error: 'id' }, { status: 400 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.status === 'string') {
    if (!['new', 'invoiced', 'paid', 'cancelled'].includes(body.status)) {
      return NextResponse.json({ error: 'status' }, { status: 400 })
    }
    // 'paid' ставиться лише через POST, разом зі створенням групи: інакше
    // заявка виглядала б оплаченою, а доступу в клієнта не було б.
    if (body.status === 'paid') {
      return NextResponse.json(
        { error: 'use_post', message: 'Позначити оплаченою можна лише кнопкою «Відкрити доступ».' },
        { status: 400 },
      )
    }
    patch.status = body.status
  }
  if (typeof body.adminNote === 'string') patch.admin_note = body.adminNote.slice(0, 2000)

  const db = getSupabaseAdmin()
  const { error } = await db.from('plan_requests').update(patch).eq('id', id)
  if (error) {
    console.error('[admin/plan-requests] patch failed', error)
    return NextResponse.json({ error: 'db' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

// ─── Відкрити доступ ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id : null
  const ownerEmail = typeof body?.ownerEmail === 'string'
    ? body.ownerEmail.trim().toLowerCase()
    : null
  const months = Number(body?.months) > 0 ? Math.min(36, Number(body.months)) : 12

  if (!id || !ownerEmail) {
    return NextResponse.json({ error: 'params' }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  const { data: reqRow } = await db
    .from('plan_requests')
    .select('id, kind, seats, org_name, status, plan_group_id')
    .eq('id', id)
    .maybeSingle()

  if (!reqRow) return NextResponse.json({ error: 'notfound' }, { status: 404 })
  if (reqRow.plan_group_id) {
    return NextResponse.json(
      { ok: false, message: 'Для цієї заявки групу вже створено.' },
      { status: 400 },
    )
  }

  // Знаходимо обліковий запис контактної особи. Без нього групі немає
  // власника: місцями має хтось керувати, і це має бути жива людина з
  // акаунтом, а не рядок у заявці.
  const admin = getSupabaseAdmin()
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const user = list?.users?.find(
    (u) => (u.email ?? '').trim().toLowerCase() === ownerEmail,
  )
  if (!user) {
    return NextResponse.json({
      ok: false,
      message: `На ${ownerEmail} немає облікового запису. Попросіть контактну особу зареєструватися на сайті, тоді відкривайте доступ.`,
    }, { status: 400 })
  }

  await db.from('app_users').upsert(
    { id: user.id, device_id: user.id },
    { onConflict: 'id', ignoreDuplicates: true },
  )

  const kind = reqRow.kind as PlanGroupKind
  const seats = reqRow.seats || SEATS_BY_KIND[kind]
  const expiresAt = new Date()
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + months)

  const { data: group, error: groupErr } = await db
    .from('plan_groups')
    .insert({
      owner_user_id: user.id,
      kind,
      seats,
      plan: 'yearly',
      expires_at: expiresAt.toISOString(),
      liqpay_order_id: `invoice_${reqRow.id}`,
    })
    .select('id')
    .single()

  if (groupErr || !group) {
    console.error('[admin/plan-requests] group insert failed', groupErr)
    return NextResponse.json({ error: 'db' }, { status: 500 })
  }

  // Власник теж має читати: група дає йому місце, але не підписку.
  await db.from('app_subscriptions').insert({
    user_id: user.id,
    status: 'active',
    plan: 'yearly',
    source: 'group',
    plan_group_id: group.id,
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    liqpay_order_id: `group_${group.id}_${user.id}`,
  })

  await db.from('plan_requests').update({
    status: 'paid',
    plan_group_id: group.id,
    owner_user_id: user.id,
    updated_at: new Date().toISOString(),
  }).eq('id', reqRow.id)

  // Лист — ОСТАННІМ і поза критичним шляхом: доступ уже відкрито, і збій
  // Resend не має його скасовувати. Якщо лист не пішов, адміністратор бачить
  // попередження і пише клієнту сам.
  let emailWarning: string | null = null
  try {
    await sendGroupOpenedEmail({
      to: ownerEmail,
      orgName: reqRow.org_name,
      kindLabel: KIND_LABEL[kind],
      seats,
      expiresLabel: expiresAt.toLocaleDateString('uk-UA'),
      manageUrl: `${SITE}/group`,
    })
  } catch (e) {
    console.error('[admin/plan-requests] opened-email failed', ownerEmail, e)
    emailWarning = 'Доступ відкрито, але лист не надіслався — напишіть клієнту самі.'
  }

  return NextResponse.json({
    ok: true,
    groupId: group.id,
    seats,
    kindLabel: KIND_LABEL[kind],
    expiresAt: expiresAt.toISOString(),
    emailWarning,
  })
}
