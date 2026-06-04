/**
 * app/api/webhook/liqpay/route.ts
 *
 * LiqPay server-to-server webhook for subscription payments.
 *
 * Flow:
 *   1. LiqPay POSTs form-encoded {data, signature} after checkout
 *   2. We verify signature: sha1(PRIVATE_KEY + data + PRIVATE_KEY) base64
 *   3. We decode data (base64 JSON) to get {order_id, status, payment_id, amount}
 *   4. order_id format: `sub_<userId>_<timestamp>` — we extract userId
 *   5. On success/sandbox/wait_compensation: upsert app_subscriptions
 *      with status=active, expires_at = now + 1 month / 1 year (by plan)
 *
 * Security:
 *   - PRIVATE_KEY never leaves the server
 *   - Idempotent via UNIQUE constraint on liqpay_order_id
 *   - Gift orders (gift_*) are ignored here — handled by /api/gift/confirm
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { recordRevenueEvent } from '@/lib/revenue'

const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY || ''

function sign(data: string): string {
  return crypto.createHash('sha1')
    .update(PRIVATE_KEY + data + PRIVATE_KEY)
    .digest('base64')
}

/**
 * Determines plan + expires_at based on amount paid.
 * Pricing table (PricingSection.tsx):
 *   monthly:        129 ₴ / month  (1 month)
 *   annual:         890 ₴ / year   (1 year)
 *   family-monthly: 199 ₴ / month  (1 month)
 *   family-annual: 1390 ₴ / year   (1 year)
 *
 * DB plan column only allows 'monthly' | 'yearly' (check constraint),
 * so we collapse family-* into the same buckets.
 */
function inferPlanAndDuration(amount: number): { plan: 'monthly' | 'yearly', months: number } {
  // Anything paid as a year-tier (>= 890₴) → yearly. Otherwise monthly.
  if (amount >= 890) return { plan: 'yearly',  months: 12 }
  return                    { plan: 'monthly', months: 1  }
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d
}

export async function POST(req: NextRequest) {
  if (!PRIVATE_KEY) {
    console.error('[webhook/liqpay] LIQPAY_PRIVATE_KEY missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  try {
    // LiqPay sends application/x-www-form-urlencoded
    const form = await req.formData()
    const data      = form.get('data')      as string | null
    const signature = form.get('signature') as string | null

    if (!data || !signature) {
      return NextResponse.json({ error: 'Missing data/signature' }, { status: 400 })
    }

    // ── Verify signature
    const expectedSig = sign(data)
    if (expectedSig !== signature) {
      console.error('[webhook/liqpay] invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // ── Decode payload
    let decoded: any
    try {
      decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
    } catch (e) {
      console.error('[webhook/liqpay] failed to decode data:', e)
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const { order_id, status, payment_id, amount } = decoded
    const numAmount = Number(amount)

    if (!order_id || typeof order_id !== 'string') {
      return NextResponse.json({ error: 'No order_id' }, { status: 400 })
    }

    // ── Route by order_id prefix
    //    gift_*  → handled by /api/gift/confirm — ignore here
    //    sub_*   → subscription, process below
    //    other   → log & ignore (could be legacy / unknown)
    if (order_id.startsWith('gift_')) {
      return NextResponse.json({ ok: true, ignored: 'gift_route' })
    }
    if (!order_id.startsWith('sub_')) {
      console.warn('[webhook/liqpay] unknown order_id prefix:', order_id)
      return NextResponse.json({ ok: true, ignored: 'unknown_prefix' })
    }

    // ── Extract userId from order_id: sub_<userId>_<timestamp>
    // userId is a UUID (36 chars with hyphens), so we split off the leading
    // "sub_" and the trailing "_<digits>".
    const tail = order_id.slice(4) // strip "sub_"
    const lastUnderscore = tail.lastIndexOf('_')
    if (lastUnderscore < 0) {
      console.error('[webhook/liqpay] malformed order_id:', order_id)
      return NextResponse.json({ error: 'Malformed order_id' }, { status: 400 })
    }
    const userId = tail.slice(0, lastUnderscore)
    if (!userId || userId.length < 30) {
      console.error('[webhook/liqpay] invalid userId in order_id:', order_id)
      return NextResponse.json({ error: 'Invalid order_id' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()

    // ── Ignore non-success statuses (still log for analytics)
    const successStatuses = ['success', 'sandbox', 'wait_compensation']
    if (!successStatuses.includes(status)) {
      console.log(`[webhook/liqpay] non-success status="${status}" order=${order_id}`)
      return NextResponse.json({ ok: true, ignored: `status_${status}` })
    }

    // ── Idempotency: liqpay_order_id is UNIQUE in app_subscriptions.
    // If a row with this order_id already exists → already processed.
    const { data: existing } = await sb
      .from('app_subscriptions')
      .select('id, status')
      .eq('liqpay_order_id', order_id)
      .maybeSingle()

    if (existing) {
      console.log(`[webhook/liqpay] order ${order_id} already processed (sub ${existing.id})`)
      return NextResponse.json({ ok: true, alreadyProcessed: true })
    }

    // ── Compute plan + expiry
    const { plan, months } = inferPlanAndDuration(numAmount)
    const startedAt = new Date()
    const expiresAt = addMonths(startedAt, months)

    // ── Insert subscription
    const { error: insertErr } = await sb
      .from('app_subscriptions')
      .insert({
        user_id:           userId,
        status:            'active',
        plan,
        started_at:        startedAt.toISOString(),
        expires_at:        expiresAt.toISOString(),
        liqpay_order_id:   order_id,
        liqpay_payment_id: payment_id ? String(payment_id) : null,
      })

    if (insertErr) {
      // 23503 = FK violation (user_id doesn't exist in app_users)
      if ((insertErr as any).code === '23503') {
        console.error(`[webhook/liqpay] user ${userId} not found in app_users for order ${order_id}`)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      // 23505 = UNIQUE constraint (race with another webhook delivery)
      if ((insertErr as any).code === '23505') {
        console.log(`[webhook/liqpay] race: order ${order_id} inserted by parallel call`)
        return NextResponse.json({ ok: true, alreadyProcessed: true })
      }
      console.error('[webhook/liqpay] insert error:', insertErr)
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
    }

    console.log(`[webhook/liqpay] ✅ subscription created: user=${userId} plan=${plan} amount=${numAmount}₴ order=${order_id}`)

    // ── Record revenue (never throws; won't break the payment)
    await recordRevenueEvent({
      userId:    userId,
      source:    'subscription',
      provider:  'liqpay',
      plan,
      amountUah: numAmount,
      orderId:   order_id,
      paymentId: payment_id ?? null,
    })

    return NextResponse.json({ ok: true, plan, expires_at: expiresAt.toISOString() })
  } catch (error) {
    console.error('[webhook/liqpay] unexpected error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
