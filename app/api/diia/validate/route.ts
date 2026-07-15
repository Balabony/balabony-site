import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'

/**
 * Валідація статусу через Дію (сценарій "Валідація документа").
 * Повертає лише "дійсний/недійсний" — ЖОДНИХ персональних даних.
 * У БД пишемо тільки category. pensionType/ПІБ/діагноз — НІКОЛИ.
 *
 * Покриває 3 категорії (легкий шлях, працює на Vercel):
 *   ВПО, УБД, пенсіонер.
 * Інвалідність тут НЕ обробляється — вона потребує ШЕРИНГУ pension-card
 * (читання групи), окремий сервер з TLS 1.2 + ІІТ. Це Етап 2.
 */

// ── Мапа: тип документа Дія (валідація) → наша категорія пільги ──
const DOC_TO_CATEGORY = {
  'reference-internally-displaced-person': 'vpo',     // ВПО
  'veteran-certificate': 'veteran',                   // УБД
  'pension-card': 'age',                               // пенсіонер (будь-який)
} as const

type DiiaDocType = keyof typeof DOC_TO_CATEGORY
type BenefitCategory = (typeof DOC_TO_CATEGORY)[DiiaDocType]

// Схема benefit_status у Supabase (звірено):
//   user_id (uuid, unique/PK), category (enum benefit_category),
//   verified_at (timestamptz), valid_until (date).
const TABLE = 'benefit_status'

const DIIA_HOST = (process.env.DIIA_HOST ?? 'api2s.diia.gov.ua').trim()
const ACQUIRER_TOKEN = (process.env.DIIA_ACQUIRER_TOKEN ?? '').trim()
const AUTH_ACQUIRER_TOKEN = (process.env.DIIA_AUTH_ACQUIRER_TOKEN ?? '').trim() // лише тест
const BRANCH_ID = (process.env.DIIA_BRANCH_ID ?? '').trim()

// Сесійний токен Дії живе 2 год. Кешуємо в пам'яті процесу на 100 хв.
let cachedSession: { token: string; expires: number } | null = null

async function getSessionToken(): Promise<string> {
  if (cachedSession && cachedSession.expires > Date.now()) {
    return cachedSession.token
  }
  const headers: Record<string, string> = { accept: 'application/json' }
  if (AUTH_ACQUIRER_TOKEN) {
    headers['Authorization'] = `Basic ${AUTH_ACQUIRER_TOKEN}`
  }
  const res = await fetch(
    `https://${DIIA_HOST}/api/v1/auth/acquirer/${ACQUIRER_TOKEN}`,
    { headers },
  )
  if (!res.ok) {
    throw new Error(`Diia auth failed: ${res.status}`)
  }
  const data = (await res.json()) as { token?: string }
  if (!data.token) {
    throw new Error('Diia auth: token відсутній у відповіді')
  }
  cachedSession = { token: data.token, expires: Date.now() + 100 * 60 * 1000 }
  return data.token
}

// barcode: 13 цифр, живе 3 хв, одноразовий (вводиться вручну користувачем).
function normalizeBarcode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const digits = raw.replace(/\D/g, '')
  return digits.length === 13 ? digits : null
}

interface ValidateBody {
  docType?: string
  barcode?: string
}

/**
 * РОЗВІДКА (тимчасово): логуємо СТРУКТУРУ відповіді Дії, щоб зрозуміти,
 * чи повертає вона тип документа. Значення НЕ логуємо — тільки ключі й типи,
 * бо у відповіді можуть бути персональні дані.
 * Виняток — ключі, які за природою є enum (type/status/doc/code): їх значення
 * потрібне для розбору й персональними даними не є.
 */
const SAFE_VALUE_KEYS = /(type|status|doc|code|kind|category)/i

function describeShape(v: unknown, key = '', depth = 0): unknown {
  if (depth > 4) return '…'
  if (v === null) return 'null'
  if (Array.isArray(v)) {
    return v.length === 0 ? '[]' : [describeShape(v[0], key, depth + 1), `…×${v.length}`]
  }
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = describeShape(val, k, depth + 1)
    }
    return out
  }
  if (typeof v === 'string') {
    return SAFE_VALUE_KEYS.test(key) && v.length <= 64 ? `string:"${v}"` : `string(${v.length})`
  }
  return typeof v
}

export async function POST(req: NextRequest) {
  try {
    // 1. Запит має робити авторизований користувач
    const supaAuth = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supaAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })
    }

    // 2. Валідація вводу
    const body = (await req.json()) as ValidateBody
    const docType = body.docType
    if (!docType || !(docType in DOC_TO_CATEGORY)) {
      return NextResponse.json(
        { error: 'Непідтримуваний тип документа' },
        { status: 400 },
      )
    }
    const barcode = normalizeBarcode(body.barcode)
    if (!barcode) {
      return NextResponse.json(
        { error: 'Код має містити 13 цифр' },
        { status: 400 },
      )
    }

    // 3. Перевірка дійсності документа в Дії
    const session = await getSessionToken()
    const diiaRes = await fetch(
      `https://${DIIA_HOST}/api/v1/acquirers/document-identification`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branchId: BRANCH_ID, barcode }),
      },
    )
    const diiaRaw: unknown = await diiaRes.json()

    // РОЗВІДКА: чи є в відповіді тип документа?
    console.log(
      '[diia/validate] HTTP', diiaRes.status,
      '| claimed docType:', docType,
      '| response shape:', JSON.stringify(describeShape(diiaRaw)),
    )

    const diiaData = (diiaRaw ?? {}) as {
      success?: boolean
      message?: string
    }

    if (!diiaRes.ok || diiaData.success !== true) {
      // Недійсний АБО помилка (код протермінований / уже використаний тощо)
      return NextResponse.json(
        { verified: false, reason: diiaData.message ?? 'Документ не підтверджено' },
        { status: 200 },
      )
    }

    // 4. Документ дійсний → записуємо пільгу (тільки категорія)
    const category: BenefitCategory = DOC_TO_CATEGORY[docType as DiiaDocType]
    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setFullYear(validUntil.getFullYear() + 1) // пільга на рік

    const admin = getSupabaseAdmin()
    const { error: dbError } = await admin.from(TABLE).upsert(
      {
        user_id: user.id,
        category,
        verified_at: now.toISOString(),
        valid_until: validUntil.toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (dbError) {
      console.error('benefit_status upsert error:', dbError.message)
      return NextResponse.json(
        { error: 'Не вдалося зберегти статус' },
        { status: 500 },
      )
    }

    return NextResponse.json({ verified: true, category })
  } catch (e) {
    console.error('diia/validate error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Внутрішня помилка' }, { status: 500 })
  }
}
