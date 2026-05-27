import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getOrCreateAnonUserId } from '@/lib/anon-user'

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

    // Identity = balabony_uid cookie. Creates new app_users row if absent,
    // so the webhook can link the subscription back to the same anonymous
    // user that's reading on the site.
    const userId = await getOrCreateAnonUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Failed to identify user' }, { status: 500 })
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
