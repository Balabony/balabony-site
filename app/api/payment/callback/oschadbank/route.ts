import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const MERCHANT_LOGIN = 'balabony_com'
const SECRET_KEY = process.env.WFP_SECRET_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      merchantAccount,
      orderReference,
      amount,
      currency,
      authCode,
      cardPan,
      transactionStatus,
      reasonCode,
      merchantSignature,
    } = body

    // Перевірка підпису — як в основному webhook
    const signatureString = [
      merchantAccount,
      orderReference,
      amount,
      currency,
      authCode,
      cardPan,
      transactionStatus,
      reasonCode,
    ].join(';')

    const expectedSignature = crypto
      .createHmac('md5', SECRET_KEY)
      .update(signatureString)
      .digest('hex')

    if (merchantSignature !== expectedSignature) {
      console.error('WayForPay Ощадбанк: невірний підпис')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (transactionStatus === 'Approved') {
      // Надсилаємо в Telegram як і основний webhook
      await fetch(`https://balabony.com/api/telegram/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'installment_oschadbank',
          orderId: orderReference,
          amount,
          status: 'approved',
        }),
      })
      console.log(`✅ Ощадбанк розстрочка: ${orderReference}, ${amount} ₴`)
    }

    // WayForPay вимагає відповідь у певному форматі
    const responseSignature = crypto
      .createHmac('md5', SECRET_KEY)
      .update([orderReference, 'accept', Math.floor(Date.now() / 1000)].join(';'))
      .digest('hex')

    return NextResponse.json({
      orderReference,
      status: 'accept',
      time: Math.floor(Date.now() / 1000),
      signature: responseSignature,
    })
  } catch (err) {
    console.error('WayForPay callback error:', err)
    return NextResponse.json({ error: 'Callback error' }, { status: 500 })
  }
}
