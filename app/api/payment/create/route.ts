import { NextRequest, NextResponse } from 'next/server'
import crypto, { randomUUID } from 'crypto'

const PUBLIC_KEY  = process.env.LIQPAY_PUBLIC_KEY  || ''
const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY || ''
const WEBHOOK_URL = 'https://balabony.vercel.app/api/webhook/liqpay'
const RESULT_URL  = process.env.NEXT_PUBLIC_SITE_URL || 'https://balabony.com'
const API_BASE    = 'https://balabony.vercel.app'

function sign(data: string): string {
  return crypto.createHash('sha1')
    .update(PRIVATE_KEY + data + PRIVATE_KEY)
    .digest('base64')
}

export async function POST(req: NextRequest) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    return NextResponse.json({ error: 'LIQPAY_PUBLIC_KEY and LIQPAY_PRIVATE_KEY must be set' }, { status: 500 })
  }

  try {
    const { amount } = await req.json()
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Register an anonymous web visitor so the webhook can record the subscription
    const deviceId = `web_${randomUUID()}`
    const userRes = await fetch(`${API_BASE}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    })
    const { user_id } = await userRes.json().catch(() => ({}))
    if (!user_id) {
      return NextResponse.json({ error: 'Failed to register session' }, { status: 502 })
    }

    const plan        = numAmount <= 99 ? 'monthly' : 'yearly'
    const description = plan === 'monthly'
      ? 'Balabony Premium — 1 місяць'
      : 'Balabony Premium — 1 рік'
    const orderId = `${user_id}_${Date.now()}`

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
