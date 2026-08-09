import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getOrCreateAnonUserId } from '@/lib/anon-user'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const PUBLIC_KEY  = process.env.LIQPAY_PUBLIC_KEY  || ''
const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY || ''
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL || 'https://balabony.com'
const WEBHOOK_URL = `${SITE_URL}/api/webhook/liqpay`
const RESULT_URL  = `${SITE_URL}/payment/success`

function sign(data: string): string {
  return crypto.createHash('sha1')
    .update(PRIVATE_KEY + data + PRIVATE_KEY)
    .digest('base64')
}

export async function POST(req: NextRequest) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    return NextResponse.json(
      { error: 'LIQPAY_PUBLIC_KEY and LIQPAY_PRIVATE_KEY must be set' },
      { status: 500 }
    )
  }

  try {
    const { amount } = await req.json()
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Identity = balabony_uid cookie.
    const userId = await getOrCreateAnonUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Failed to identify user' }, { status: 500 })
    }

    // ── Гарантуємо рядок в app_users ДО оплати.
    //
    // 09.08.2026: тут стояв лише коментар про те, що getOrCreateAnonUserId
    // «створює рядок в app_users, якщо його немає». Насправді вона цього не
    // робила — тільки генерувала UUID і ставила cookie. Через це вебхук
    // LiqPay падав на FOREIGN KEY (app_subscriptions.user_id → app_users.id),
    // повертав 404, і жодна оплата не перетворювалась на підписку:
    // revenue_events була порожня за весь час існування сайту.
    //
    // device_id — NOT NULL без default, тому кладемо туди той самий UUID.
    // onConflict: 'id' + ignoreDuplicates — повторний виклик нічого не ламає.
    {
      const sb = getSupabaseAdmin()
      const { error: userErr } = await sb
        .from('app_users')
        .upsert(
          { id: userId, device_id: userId },
          { onConflict: 'id', ignoreDuplicates: true }
        )

      if (userErr) {
        console.error('[payment/create] app_users upsert failed:', userId, userErr)
        return NextResponse.json(
          { error: 'Failed to prepare user record' },
          { status: 500 }
        )
      }
    }

    const plan        = numAmount <= 199 ? 'monthly' : 'yearly'
    const description = plan === 'monthly'
      ? 'Balabony Premium — 1 місяць'
      : 'Balabony Premium — 1 рік'

    // Order ID format: sub_<userId>_<timestamp>
    // The "sub_" prefix lets the webhook distinguish subscriptions from gifts.
    const orderId = `sub_${userId}_${Date.now()}`

    const params = {
      version:    3,
      public_key: PUBLIC_KEY,
      action:     'pay',
      amount:     numAmount,
      currency:   'UAH',
      description,
      order_id:   orderId,
      result_url: RESULT_URL,
      server_url: WEBHOOK_URL,
    }

    const data      = Buffer.from(JSON.stringify(params)).toString('base64')
    const signature = sign(data)

    return NextResponse.json({ data, signature })
  } catch (error) {
    console.error('LiqPay payment error:', error)
    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 })
  }
}
