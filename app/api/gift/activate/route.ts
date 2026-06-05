import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://balabony.com'

/**
 * POST: активація подарункового коду одержувачем.
 * Тіло: { code, device_id?: string }
 * Якщо device_id не передано — генеруємо новий.
 * Повертає: { ok, user_id, device_id, giftType, expiresAt }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const codeRaw = (body.code || '').toString().trim().toUpperCase()
    let   deviceId = (body.device_id || '').toString().trim()

    if (!codeRaw) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()

    // Шукаємо подарунок
    const { data: gift, error: findErr } = await sb
      .from('gift_codes')
      .select('*')
      .eq('code', codeRaw)
      .maybeSingle()

    if (findErr || !gift) {
      return NextResponse.json({ error: 'Код не знайдено' }, { status: 404 })
    }

    // Перевірки статусу
    if (gift.status === 'activated') {
      return NextResponse.json({ error: 'Цей код вже активовано' }, { status: 409 })
    }
    if (gift.status === 'cancelled') {
      return NextResponse.json({ error: 'Цей код скасовано' }, { status: 410 })
    }
    if (gift.status === 'pending') {
      return NextResponse.json({ error: 'Оплата за подарунок ще не підтверджена' }, { status: 402 })
    }
    // paid або delivered — можна активувати

    // Перевірка дати активації — не активуємо до дати вручення
    // (одержувач може спробувати ввести код раніше, ніж надійшов email)
    const today = new Date().toISOString().slice(0, 10)
    if (gift.activation_date > today) {
      return NextResponse.json({
        error: `Подарунок буде доступний з ${gift.activation_date}`,
      }, { status: 423 })
    }

    // Створюємо/беремо device_id
    if (!deviceId) {
      deviceId = `gift_${randomUUID()}`
    }

    // Реєструємо юзера через існуючий /api/user
    const userRes = await fetch(`${API_BASE}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    })
    const { user_id } = await userRes.json().catch(() => ({}))

    if (!user_id) {
      return NextResponse.json({ error: 'Не вдалося створити сесію' }, { status: 502 })
    }

    // Тривалість залежить від типу подарунка (3 / 6 / 12 місяців)
    const giftMonths =
      (gift.gift_type === 'quarter' || gift.gift_type === 'family-quarter') ? 3 :
      (gift.gift_type === 'half'    || gift.gift_type === 'family-half')    ? 6 : 12
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + giftMonths)
    const expiresAtIso = expiresAt.toISOString()

    // Записуємо підписку в users (поля subscription_tier, subscription_until)
    // tier = рівень доступу (родинний чи індивідуальний); термін несе subscription_until
    const tier = String(gift.gift_type).startsWith('family') ? 'family-annual' : 'annual'
    const { error: updErr } = await sb
      .from('users')
      .update({
        subscription_tier:  tier,
        subscription_until: expiresAtIso,
        gift_code_used:     gift.code,
      })
      .eq('id', user_id)

    if (updErr) {
      console.error('Failed to update user subscription:', updErr)
      // Не повертаємо помилку юзеру — код вже валідний, підписку можна активувати вручну
    }

    // Позначаємо код як activated
    await sb.from('gift_codes')
      .update({
        status:               'activated',
        activated_at:         new Date().toISOString(),
        activated_by_user_id: user_id,
      })
      .eq('id', gift.id)

    return NextResponse.json({
      ok:        true,
      user_id,
      device_id: deviceId,
      giftType:  gift.gift_type,
      senderName: gift.sender_name,
      expiresAt: expiresAtIso,
    })
  } catch (error) {
    console.error('Gift activate error:', error)
    return NextResponse.json({ error: 'Activation failed' }, { status: 500 })
  }
}

/**
 * GET: попередня перевірка коду (без активації).
 * /api/gift/activate?code=BLBN-XXXX-YYYY
 * Повертає інформацію про подарунок без активації.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()
  const { data: gift } = await sb
    .from('gift_codes')
    .select('code, gift_type, sender_name, recipient_name, status, activation_date')
    .eq('code', code)
    .maybeSingle()

  if (!gift) {
    return NextResponse.json({ error: 'Код не знайдено' }, { status: 404 })
  }

  return NextResponse.json(gift)
}