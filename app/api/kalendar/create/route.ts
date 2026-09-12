import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Створення замовлення на друкований календар-планувальник.
 *
 * Зроблено за зразком app/api/gift/create — той самий мерчант LiqPay
 * (ФОП Хомин Ігор Іванович), той самий підпис, той самий порядок:
 * спершу пишемо замовлення зі статусом pending, потім віддаємо
 * фронтенду data+signature для форми LiqPay.
 *
 * Відмінність від подарунка: тут фізичний товар, тому разом із
 * замовленням збираємо адресу Нової пошти. Дані доставки лежать у
 * calendar_orders під RLS — з браузера вони недоступні.
 *
 * Префікс order_id — `cal_`. Вебхук /api/kalendar/confirm за ним
 * відрізняє наші платежі від подарунків і підписок.
 */

const PUBLIC_KEY  = process.env.LIQPAY_PUBLIC_KEY  || ''
const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY || ''
const SITE        = process.env.NEXT_PUBLIC_SITE_URL || 'https://balabony.com'
const WEBHOOK_URL = `${SITE}/api/kalendar/confirm`
const RESULT_URL  = `${SITE}/kalendar/success`

/** Ціна на сайті. На «Розетці» 600 — там комісія майданчика. */
export const PRICE_UAH = 550
/** Більше за раз — це вже опт, хай пишуть у редакцію. */
export const MAX_QTY = 5

function sign(data: string): string {
  return crypto.createHash('sha1')
    .update(PRIVATE_KEY + data + PRIVATE_KEY)
    .digest('base64')
}

/** Телефон у вигляді +380XXXXXXXXX. Приймаємо як завгодно записаний. */
function normalizePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('380')) return `+${d}`
  if (d.length === 10 && d.startsWith('0'))   return `+38${d}`
  if (d.length === 9)                          return `+380${d}`
  return null
}

export async function POST(req: NextRequest) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    return NextResponse.json({ error: 'LIQPAY keys not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { buyerName, buyerPhone, buyerEmail, npCity, npBranch, comment } = body
    const qty = Math.max(1, Math.min(MAX_QTY, parseInt(body.qty, 10) || 1))

    // Валідація. Повідомлення українською — вони йдуть просто у форму.
    if (!buyerName || String(buyerName).trim().length < 3) {
      return NextResponse.json({ error: 'Вкажіть прізвище та ім’я' }, { status: 400 })
    }
    const phone = normalizePhone(String(buyerPhone || ''))
    if (!phone) {
      return NextResponse.json({ error: 'Вкажіть телефон у форматі 0XX XXX XX XX' }, { status: 400 })
    }
    if (!npCity || String(npCity).trim().length < 2) {
      return NextResponse.json({ error: 'Вкажіть місто' }, { status: 400 })
    }
    if (!npBranch || String(npBranch).trim().length < 1) {
      return NextResponse.json({ error: 'Вкажіть відділення Нової пошти' }, { status: 400 })
    }
    if (buyerEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(buyerEmail).trim())) {
      return NextResponse.json({ error: 'Перевірте адресу пошти' }, { status: 400 })
    }
    if (comment && String(comment).length > 300) {
      return NextResponse.json({ error: 'Коментар задовгий' }, { status: 400 })
    }

    const amount  = PRICE_UAH * qty
    const orderId = `cal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const sb = getSupabaseAdmin()
    const { error: dbErr } = await sb.from('calendar_orders').insert({
      order_id:    orderId,
      status:      'pending',
      qty,
      amount:      amount * 100,          // копійки, як у gift_codes
      buyer_name:  String(buyerName).trim(),
      buyer_phone: phone,
      buyer_email: buyerEmail ? String(buyerEmail).trim().toLowerCase() : null,
      np_city:     String(npCity).trim(),
      np_branch:   String(npBranch).trim(),
      comment:     comment ? String(comment).trim() : null,
    })

    if (dbErr) {
      console.error('Calendar order insert error:', dbErr)
      return NextResponse.json({ error: 'Не вдалося створити замовлення' }, { status: 500 })
    }

    const params = {
      version:     3,
      public_key:  PUBLIC_KEY,
      action:      'pay',
      amount,
      currency:    'UAH',
      description: qty > 1
        ? `Календар-планувальник 2027, ${qty} шт.`
        : 'Календар-планувальник 2027',
      order_id:    orderId,
      result_url:  `${RESULT_URL}?order_id=${orderId}`,
      server_url:  WEBHOOK_URL,
    }

    const data      = Buffer.from(JSON.stringify(params)).toString('base64')
    const signature = sign(data)

    return NextResponse.json({ data, signature, orderId, amount })
  } catch (error) {
    console.error('Calendar create error:', error)
    return NextResponse.json({ error: 'Не вдалося створити замовлення' }, { status: 500 })
  }
}
