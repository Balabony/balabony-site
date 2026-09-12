import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { recordRevenueEvent } from '@/lib/revenue'

/**
 * Вебхук LiqPay для замовлень календаря.
 *
 * Копія логіки app/api/gift/confirm з двома відмінностями:
 * префікс order_id `cal_` замість `gift_`, і листа покупцеві поки
 * не шлемо — шаблону в lib/email під фізичний товар немає.
 * Богдан бачить оплачені замовлення в calendar_orders.
 *
 * LiqPay шле вебхук повторно, поки не отримає 200, тому обробка
 * ідемпотентна: другий виклик по вже оплаченому замовленню нічого
 * не змінює й повертає ok.
 */

const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY || ''

function sign(data: string): string {
  return crypto.createHash('sha1')
    .update(PRIVATE_KEY + data + PRIVATE_KEY)
    .digest('base64')
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const data      = form.get('data')      as string | null
    const signature = form.get('signature') as string | null

    if (!data || !signature) {
      return NextResponse.json({ error: 'Missing data/signature' }, { status: 400 })
    }

    if (sign(data) !== signature) {
      console.error('Calendar webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
    const { order_id, status, amount } = decoded

    if (!order_id) {
      return NextResponse.json({ error: 'No order_id' }, { status: 400 })
    }
    if (!String(order_id).startsWith('cal_')) {
      // Чужий платіж — подарунок або підписка. Не наша справа.
      return NextResponse.json({ ok: true, ignored: true })
    }

    const sb = getSupabaseAdmin()

    const { data: order, error: findErr } = await sb
      .from('calendar_orders')
      .select('id, status, qty')
      .eq('order_id', order_id)
      .maybeSingle()

    if (findErr || !order) {
      console.error('Calendar order not found:', order_id, findErr)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ ok: true, alreadyProcessed: true })
    }

    const successStatuses = ['success', 'sandbox', 'wait_compensation']
    if (!successStatuses.includes(status)) {
      await sb.from('calendar_orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
      return NextResponse.json({ ok: true, status: 'cancelled' })
    }

    await sb.from('calendar_orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', order.id)

    await recordRevenueEvent({
      userId:    null,
      // 'calendar' у типі RevenueSource немає — саме для такого є 'purchase'.
      // Що це календар, видно з plan і префікса order_id.
      source:    'purchase',
      provider:  'liqpay',
      plan:      `calendar-2027-x${order.qty}`,
      amountUah: amount,
      orderId:   order_id,
    })

    return NextResponse.json({ ok: true, status: 'paid' })
  } catch (error) {
    console.error('Calendar webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * GET: сторінка /kalendar/success питає, чи пройшла оплата.
 * Віддаємо тільки статус і кількість — адресу назовні не показуємо.
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('order_id')
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()
  const { data: order } = await sb
    .from('calendar_orders')
    .select('status, qty')
    .eq('order_id', orderId)
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json(order)
}
