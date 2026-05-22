import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const PUBLIC_KEY  = process.env.LIQPAY_PUBLIC_KEY  || ''
const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY || ''
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://balabony.com'}/api/gift/confirm`
const RESULT_URL  = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://balabony.com'}/gift/success`

const PRICES: Record<string, number> = {
  'annual':        890,
  'family-annual': 1390,
}

const LABELS: Record<string, string> = {
  'annual':        'Річна підписка Балабонів',
  'family-annual': 'Сімейна річна підписка Балабонів',
}

function sign(data: string): string {
  return crypto.createHash('sha1')
    .update(PRIVATE_KEY + data + PRIVATE_KEY)
    .digest('base64')
}

function generateCode(): string {
  // Формат: BLBN-XXXX-XXXX (літери A-Z крім I,O,L + цифри 2-9)
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const pick = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  return `BLBN-${pick(4)}-${pick(4)}`
}

export async function POST(req: NextRequest) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    return NextResponse.json({ error: 'LIQPAY keys not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const {
      giftType, senderName, senderEmail,
      recipientName, recipientEmail,
      activationDate, personalMessage,
    } = body

    // Валідація
    if (!giftType || !PRICES[giftType]) {
      return NextResponse.json({ error: 'Invalid gift type' }, { status: 400 })
    }
    if (!senderName || !senderEmail || !recipientName || !recipientEmail || !activationDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    // Дата має бути сьогодні або в майбутньому
    const today = new Date().toISOString().slice(0, 10)
    if (activationDate < today) {
      return NextResponse.json({ error: 'Activation date in past' }, { status: 400 })
    }
    // Особисте побажання ≤ 200 символів
    if (personalMessage && personalMessage.length > 200) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const amount  = PRICES[giftType]
    const code    = generateCode()
    const orderId = `gift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Записуємо в БД зі статусом pending
    const sb = getSupabaseAdmin()
    const { error: dbErr } = await sb.from('gift_codes').insert({
      code,
      order_id:         orderId,
      gift_type:        giftType,
      paid_amount:      amount * 100,
      sender_name:      senderName.trim(),
      sender_email:     senderEmail.trim().toLowerCase(),
      recipient_name:   recipientName.trim(),
      recipient_email:  recipientEmail.trim().toLowerCase(),
      activation_date:  activationDate,
      personal_message: personalMessage?.trim() || null,
      status: 'pending',
    })

    if (dbErr) {
      console.error('Gift DB insert error:', dbErr)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // LiqPay параметри
    const params = {
      version:     3,
      public_key:  PUBLIC_KEY,
      action:      'pay',
      amount,
      currency:    'UAH',
      description: `Подарунок: ${LABELS[giftType]} для ${recipientName}`,
      order_id:    orderId,
      result_url:  `${RESULT_URL}?order_id=${orderId}`,
      server_url:  WEBHOOK_URL,
    }

    const data      = Buffer.from(JSON.stringify(params)).toString('base64')
    const signature = sign(data)

    return NextResponse.json({ data, signature, code, orderId })
  } catch (error) {
    console.error('Gift create error:', error)
    return NextResponse.json({ error: 'Gift creation failed' }, { status: 500 })
  }
}