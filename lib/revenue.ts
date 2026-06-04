/**
 * lib/revenue.ts
 *
 * Single helper that records a successful payment into revenue_events.
 * Wave 0, step 0.2.
 *
 * GOLDEN RULE: this function NEVER throws. Logging revenue must never break a
 * customer's payment. A failed insert (or a duplicate webhook retry) is logged
 * and swallowed — we'd rather lose one analytics row than fail a checkout.
 */

import { getSupabaseAdmin } from '@/lib/supabase-server'

type RevenueSource   = 'subscription' | 'installment' | 'gift' | 'purchase'
type RevenueProvider = 'liqpay' | 'privat' | 'oschad'

interface RecordRevenueInput {
  /** Anonymous balabony_uid. Null for gifts / installments with no uid. */
  userId?:    string | null
  source:     RevenueSource
  provider?:  RevenueProvider          // defaults to 'liqpay'
  plan?:      string | null            // 'monthly' | 'yearly' | gift_type | null
  /** Amount in HRYVNIA (as providers send it). Converted to kopecks here. */
  amountUah:  number | string
  orderId:    string
  paymentId?: string | number | null
}

export async function recordRevenueEvent(input: RecordRevenueInput): Promise<void> {
  try {
    const amountKopecks = Math.round(Number(input.amountUah) * 100)
    if (!Number.isFinite(amountKopecks) || amountKopecks < 0) {
      console.warn('[revenue] skipped — bad amount:', input.orderId, input.amountUah)
      return
    }
    if (!input.orderId) {
      console.warn('[revenue] skipped — missing orderId')
      return
    }

    const sb = getSupabaseAdmin()
    const { error } = await sb.from('revenue_events').insert({
      user_id:        input.userId ?? null,
      source:         input.source,
      provider:       input.provider ?? 'liqpay',
      plan:           input.plan ?? null,
      amount_kopecks: amountKopecks,
      order_id:       input.orderId,
      payment_id:     input.paymentId != null ? String(input.paymentId) : null,
    })

    if (error) {
      // 23505 = UNIQUE(order_id) → already recorded (normal on webhook retry)
      if ((error as { code?: string }).code === '23505') return
      console.error('[revenue] insert failed:', input.orderId, error)
      return
    }

    console.log(`[revenue] +${amountKopecks / 100}₴ ${input.source}/${input.provider ?? 'liqpay'} order=${input.orderId}`)
  } catch (e) {
    // Never throw — see GOLDEN RULE above.
    console.error('[revenue] unexpected error (swallowed):', e)
  }
}
