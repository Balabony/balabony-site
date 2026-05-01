import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const data = body.get('data') as string
    const signature = body.get('signature') as string

    const expectedSignature = crypto
      .createHash('sha1')
      .update(PRIVATE_KEY + data + PRIVATE_KEY)
      .digest('base64')

    if (signature !== expectedSignature) {
      console.error('LiqPay: невірний підпис')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const params = JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
    const { status, order_id, amount } = params

    if (status === 'success' || status === 'subscribed') {
      // Надсилаємо в Telegram як і основний webhook
      await fetch(`https://balabony.com/api/telegram/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'installment_privat',
          orderId: order_id,
          amount,
          status: 'approved',
        }),
      })
      console.log(`✅ ПриватБанк розстрочка: ${order_id}, ${amount} ₴`)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('LiqPay callback error:', err)
    return NextResponse.json({ error: 'Callback error' }, { status: 500 })
  }
}
