import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * POST /api/diia/share/init
 *
 * Ініціює СЦЕНАРІЙ ШЕРИНГУ Дії (не barcode-валідацію — той в /validate).
 * Потрібен, щоб отримати pension-card і прочитати pensionType → факт
 * інвалідності (див. lib/diia/pension-type.ts). Група/причина не зберігаються.
 *
 * Послідовність:
 *   1. auth: GET /api/v1/auth/acquirer/{token} → session token
 *   2. offer-request/dynamic → deeplink (діє 3 хв, одноразовий)
 *   3. записуємо requestId у diia_share_requests (status='pending'),
 *      щоб колбек (/api/diia/share-callback) звірив за X-Document-Request-Trace-Id
 *   4. повертаємо deeplink клієнту — юзер відкриває в Дії й ділиться
 *
 * ⚠️ URL offer-request/dynamic узято з хендофу; ЗВІРИТИ з повною
 *    інтеграційною докою Дії перед першим бойовим запуском (ця константа —
 *    єдине місце, яке треба підправити, якщо шлях відрізняється).
 * ⚠️ DIIA_OFFER_ID створюється РАЗ (окремий крок, scripts/diia-create-offer),
 *    перевикористовується. Масове створення offer/branch → бан.
 */

const DIIA_HOST = (process.env.DIIA_HOST ?? 'api2s.diia.gov.ua').trim()
const ACQUIRER_TOKEN = (process.env.DIIA_ACQUIRER_TOKEN ?? '').trim()
const AUTH_ACQUIRER_TOKEN = (process.env.DIIA_AUTH_ACQUIRER_TOKEN ?? '').trim()
const BRANCH_ID = (process.env.DIIA_BRANCH_ID ?? '').trim()
const OFFER_ID = (process.env.DIIA_OFFER_ID ?? '').trim()

// ⚠️ ЗВІРИТИ шлях з інтеграційною докою Дії:
const OFFER_REQUEST_PATH = (branchId: string) =>
  `/api/v2/acquirers/branch/${branchId}/offer-request/dynamic`

const TABLE = 'diia_share_requests'

// Сесійний токен живе ~2 год; кешуємо в пам'яті процесу на 100 хв.
let cachedSession: { token: string; expires: number } | null = null

async function getSessionToken(): Promise<string> {
  if (cachedSession && cachedSession.expires > Date.now()) {
    return cachedSession.token
  }
  const headers: Record<string, string> = { accept: 'application/json' }
  if (AUTH_ACQUIRER_TOKEN) headers['Authorization'] = `Basic ${AUTH_ACQUIRER_TOKEN}`

  const res = await fetch(
    `https://${DIIA_HOST}/api/v1/auth/acquirer/${ACQUIRER_TOKEN}`,
    { headers },
  )
  if (!res.ok) throw new Error(`Diia auth failed: ${res.status}`)

  const data = (await res.json()) as { token?: string }
  if (!data.token) throw new Error('Diia auth: no token in response')

  cachedSession = { token: data.token, expires: Date.now() + 100 * 60 * 1000 }
  return data.token
}

export async function POST() {
  // Fail fast, якщо не сконфігуровано (щоб не висіти й не плодити offer'ів).
  if (!ACQUIRER_TOKEN || !BRANCH_ID || !OFFER_ID) {
    return NextResponse.json(
      { error: 'Diia sharing is not configured yet (ACQUIRER_TOKEN / BRANCH_ID / OFFER_ID).' },
      { status: 503 },
    )
  }

  // requestId: uuid v4 (10–255 символів). Це ж значення прийде в колбеку
  // як X-Document-Request-Trace-Id (читати регістронезалежно).
  const requestId = randomUUID()

  try {
    const session = await getSessionToken()

    const res = await fetch(`https://${DIIA_HOST}${OFFER_REQUEST_PATH(BRANCH_ID)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session}`,
      },
      body: JSON.stringify({
        offerId: OFFER_ID,
        requestId,
        // returnLink / useDiiaId — опційні; додати за потреби після звірки доки.
      }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Diia offer-request failed', status: res.status },
        { status: 502 },
      )
    }

    const data = (await res.json()) as { deeplink?: string }
    if (!data.deeplink) {
      return NextResponse.json({ error: 'No deeplink in Diia response' }, { status: 502 })
    }

    // Реєструємо очікуваний колбек. У БД — лише службові поля, жодних ПД.
    try {
      const supabase = getSupabaseAdmin()
      await supabase.from(TABLE).insert({
        request_id: requestId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    } catch {
      // Якщо запис не вдався — не валимо флоу; колбек усе одно звірятиме requestId.
    }

    // deeplink діє 3 хв, одноразовий.
    return NextResponse.json({ deeplink: data.deeplink })
  } catch {
    return NextResponse.json({ error: 'Diia sharing init error' }, { status: 500 })
  }
}
