import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const MERCHANT_ACCOUNT = process.env.WFP_MERCHANT_ACCOUNT || ''
const MERCHANT_SECRET = process.env.WFP_MERCHANT_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json()
    const orderReference = `balabony_oschadbank_${Date.now()}`
    const orderDate = Math.floor(Date.now() / 1000)
    const finalAmount = amount || 891

    const signatureString = [
      MERCHANT_ACCOUNT,
      'balabony.com',
      orderReference,
      orderDate,
      finalAmount,
      'UAH',
      'Balabony Річна підписка',
      1,
      finalAmount,
    ].join(';')

    const signature = crypto
      .createHmac('md5', MERCHANT_SECRET)
      .update(signatureString)
      .digest('hex')

    const formData = {
      merchantAccount: MERCHANT_ACCOUNT,
      merchantDomainName: 'balabony.com',
      orderReference,
      orderDate,
      amount: finalAmount,
      currency: 'UAH',
      productName: 'Balabony Річна підписка',
      productPrice: finalAmount,
      productCount: 1,
      returnUrl: 'https://balabony.com/payment/success',
      serviceUrl: 'https://balabony.com/api/payment/callback/oschadbank',
      paymentSystems: 'oschadbank',
      installmentPayment: 1,
      installmentPaymentCount: 6,
      merchantSignature: signature,
    }

    return NextResponse.json({ formData })
  } catch (err) {
    console.error('WayForPay oschadbank error:', err)
    return NextResponse.json({ error: 'Помилка створення розстрочки' }, { status: 500 })
  }
}
