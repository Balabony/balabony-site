import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { sendGiftPurchaseEmail } from '@/lib/email'

const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY || ''

function sign(data: string): string {
  return crypto.createHash('sha1')
    .update(PRIVATE_KEY + data + PRIVATE_KEY)
    .digest('base64')
}

/**
 * POST: вебхук від LiqPay після оплати.
 * LiqPay шле x-www-form-urlencoded: data (base64-encoded JSON) + signature.
 */
export async function POST(req: NextRequest) {
  try {
    // LiqPay шле form-encoded, не JSON
    const form = await req.formData()
    const data      = form.get('data')      as string | null
    const signature = form.get('signature') as string | null

    if (!data || !signature) {
      return NextResponse.json({ error: 'Missing data/signature' }, { status: 400 })
    }

    // Перевірка підпису
    const expectedSig = sign(data)
    if (expectedSig !== signature) {
      console.error('Gift webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Розшифровуємо data
    const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
    const { order_id, status, amount } = decoded

    if (!order_id) {
      return NextResponse.json({ error: 'No order_id' }, { status: 400 })
    }

    // Дивимось чи це наш подарунок
    if (!order_id.startsWith('gift_')) {
      // Це не подарунок (мабуть, звичайна підписка) — ігноруємо
      return NextResponse.json({ ok: true, ignored: true })
    }

    const sb = getSupabaseAdmin()

    // Знаходимо запис
    const { data: gift, error: findErr } = await sb
      .from('gift_codes')
      .select('*')
      .eq('order_id', order_id)
      .maybeSingle()

    if (findErr || !gift) {
      console.error('Gift not found:', order_id, findErr)
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 })
    }

    // Якщо вже paid — пропускаємо (повторний webhook)
    if (gift.status !== 'pending') {
      return NextResponse.json({ ok: true, alreadyProcessed: true })
    }

    // Тільки success/sandbox статуси LiqPay вважаємо успіхом
    const successStatuses = ['success', 'sandbox', 'wait_compensation']
    if (!successStatuses.includes(status)) {
      // Невдала спроба — записуємо як cancelled, але не email-имо
      await sb.from('gift_codes')
        .update({ status: 'cancelled' })
        .eq('id', gift.id)
      return NextResponse.json({ ok: true, status: 'cancelled' })
    }

    // Все ок: позначаємо paid
    await sb.from('gift_codes')
      .update({
        status:  'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', gift.id)

    // Шлемо email дарувальнику (не блокуємо webhook у разі помилки)
    try {
      await sendGiftPurchaseEmail({
        to:              gift.sender_email,
        senderName:      gift.sender_name,
        recipientName:   gift.recipient_name,
        recipientEmail:  gift.recipient_email,
        giftType:        gift.gift_type,
        activationDate:  gift.activation_date,
        code:            gift.code,
        personalMessage: gift.personal_message || undefined,
      })
    } catch (emailErr) {
      console.error('Gift purchase email failed:', emailErr)
      // Не повертаємо помилку — LiqPay повторно слатиме webhook
    }

    return NextResponse.json({ ok: true, status: 'paid' })
  } catch (error) {
    console.error('Gift webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * GET: фронтенд після редіректу з LiqPay перевіряє статус оплати.
 * /api/gift/confirm?order_id=gift_xxx
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('order_id')
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()
  const { data: gift } = await sb
    .from('gift_codes')
    .select('status, gift_type, sender_name, recipient_name, activation_date, code')
    .eq('order_id', orderId)
    .maybeSingle()

  if (!gift) {
    return NextResponse.json({ error: 'Gift not found' }, { status: 404 })
  }

  return NextResponse.json(gift)
}