/**
 * app/api/plan-request/route.ts
 *
 * Прийом заявки від юрособи на корпоративний або бібліотечний доступ.
 *
 * ПУБЛІЧНИЙ роут без входу: організація подає заявку до того, як хтось із
 * її людей завів обліковий запис. Вимагати реєстрацію тут означало б
 * втратити половину заявок на першому кроці.
 *
 * Захист від засмічення мінімальний і навмисно простий: обмеження довжини,
 * перевірка обов'язкових полів і одна заявка на організацію за годину.
 * Складніший захист тут не потрібен — заявки читає людина, а не автомат,
 * і сміття видно з першого погляду.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SEATS_BY_KIND, KIND_LABEL, type PlanGroupKind } from '@/lib/plan-groups'
import { sendEditorEmail } from '@/lib/email'

const KINDS: PlanGroupKind[] = ['corporate', 'library']

function clean(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim().replace(/\s+/g, ' ')
  return s.length ? s.slice(0, max) : null
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  const kind = body?.kind as PlanGroupKind
  if (!KINDS.includes(kind)) {
    return NextResponse.json({ ok: false, message: 'Оберіть пакет.' }, { status: 400 })
  }

  const orgName = clean(body?.orgName, 200)
  const contactName = clean(body?.contactName, 120)
  const emailRaw = clean(body?.contactEmail, 254)
  const email = emailRaw?.toLowerCase() ?? null

  if (!orgName || !contactName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, message: 'Заповніть назву організації, контактну особу й пошту.' },
      { status: 400 },
    )
  }

  const edrpou = clean(body?.edrpou, 20)
  const phone = clean(body?.contactPhone, 40)
  const note = clean(body?.note, 1500)

  const db = getSupabaseAdmin()

  // Одна заявка на пошту за годину: захищає і від подвійного натискання, і
  // від найпростішого засмічення, не заважаючи законному клієнту подати
  // виправлену заявку пізніше.
  const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
  const { data: recent } = await db
    .from('plan_requests')
    .select('id')
    .ilike('contact_email', email)
    .gt('created_at', hourAgo)
    .limit(1)
    .maybeSingle()

  if (recent) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      message: 'Заявку вже прийнято — ми зв’яжемося найближчим часом.',
    })
  }

  const { error } = await db.from('plan_requests').insert({
    kind,
    seats: SEATS_BY_KIND[kind],
    org_name: orgName,
    edrpou,
    contact_name: contactName,
    contact_email: email,
    contact_phone: phone,
    note,
    status: 'new',
  })

  if (error) {
    console.error('[plan-request] insert failed', error)
    return NextResponse.json(
      { ok: false, message: 'Не вдалося надіслати заявку. Напишіть на nazar@balabony.com.' },
      { status: 500 },
    )
  }

  // Сповіщення редакції. Через наявну функцію листа, щоб не плодити третій
  // шаблон: заявок буде небагато, і вигляд листа тут значення не має —
  // важливо, щоб він дійшов.
  try {
    await sendEditorEmail({
      to: process.env.RESEND_FROM_EMAIL ?? 'nazar@balabony.com',
      editorName: 'редакціє',
      filename: `Заявка: ${orgName}`,
      text:
        `${KIND_LABEL[kind]}\n` +
        `Організація: ${orgName}${edrpou ? ` (ЄДРПОУ ${edrpou})` : ''}\n` +
        `Контакт: ${contactName}, ${email}${phone ? `, ${phone}` : ''}\n` +
        (note ? `\n${note}` : ''),
      approveUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://balabony.com'}/admin/plan-requests`,
      reviseUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://balabony.com'}/admin/plan-requests`,
    })
  } catch (e) {
    // Заявка вже в базі й видима в адмінці — лист лише прискорює реакцію.
    console.error('[plan-request] notify failed', e)
  }

  return NextResponse.json({ ok: true })
}
