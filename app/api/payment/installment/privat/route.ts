import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const PUBLIC_KEY = process.env.LIQPAY_PUBLIC_KEY || ''
const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const { amount, package: pkg } = await req.json()

    const params = {
      version: 3,
      public_key: PUBLIC_KEY,
      action: 'pay',
      amount: amount || 891,
      currency: 'UAH',
      description: 'Balabony — Річна підписка (частинами)',
      order_id: `balabony_installment_privat_${Date.now()}`,
      result_url: 'https://balabony.com/payment/success',
      server_url: 'https://balabony.com/api/payment/callback/privat',
      paytypes: 'privat24',
      installment_months: 6,
    }

    const data = Buffer.from(JSON.stringify(params)).toString('base64')
    const signature = crypto
      .createHash('sha1')
      .update(PRIVATE_KEY + data + PRIVATE_KEY)
      .digest('base64')

    return NextResponse.json({
      formData: { data, signature },
      redirectUrl: null,
    })
  } catch (err) {
    console.error('LiqPay installment error:', err)
    return NextResponse.json({ error: 'Помилка створення розстрочки' }, { status: 500 })
  }
}
