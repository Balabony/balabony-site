import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Стеження читача за серіалом.
 *
 * GET  — стан кнопки: скільки читачів стежить і чи стежить цей.
 * POST — перемикач.
 *
 * НАВІЩО. Таблиця `series_follows` створена 09.09.2026, а API і кнопки до неї
 * не зробили — механізм лежав мертвий. Привід доробити, вимір 16.09.2026:
 * зі 124 читачів, що відкрили першу серію «Балабонів», другу відкрили 8.
 * Людині, якій серія сподобалася, ніде було лишити слід, щоб дізнатися про
 * наступну: «Стежити за автором» на серіалах свідомо не ставили (автор один
 * на обидва серіали, і читач сільського гумору отримував би листи про
 * воєнну драму 18+). Саме тому підписка тут — на СЕРІАЛ, а не на автора.
 *
 * Лічильник рахує service role, а не запит від імені читача: RLS показує
 * людині лише її власні підписки, тож публічний count через звичайний клієнт
 * повертав би одиницю або нуль замість справжнього числа.
 *
 * Незалогінений отримує лічильник і followed: false — кнопка малюється
 * однаково для всіх, а на кліку компонент веде на вхід. Ховати її від гостя
 * не можна: саме вона й пояснює, навіщо реєструватися.
 */

/** Ті самі два значення, що в check-обмеженні таблиці. */
const SERIES = ['balabony', 'tysha'] as const
type Series = (typeof SERIES)[number]

function cleanSeries(value: unknown): Series | '' {
  const v = String(value ?? '').trim().toLowerCase()
  return (SERIES as readonly string[]).includes(v) ? (v as Series) : ''
}

async function countFollowers(series: Series): Promise<number> {
  const admin = getSupabaseAdmin()
  const { count, error } = await admin
    .from('series_follows')
    .select('user_id', { count: 'exact', head: true })
    .eq('series', series)

  if (error) return 0
  return count ?? 0
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const series = cleanSeries(url.searchParams.get('series'))
    if (!series) {
      return NextResponse.json({ ok: false, error: 'Не вказано серіал' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    let followed = false
    if (user) {
      const admin = getSupabaseAdmin()
      const { data } = await admin
        .from('series_follows')
        .select('series')
        .eq('user_id', user.id)
        .eq('series', series)
        .maybeSingle()
      followed = Boolean(data)
    }

    return NextResponse.json({
      ok: true,
      count: await countFollowers(series),
      followed,
      authed: Boolean(user),
    })
  } catch {
    // Кнопка вміє показати себе без стану; ламати сторінку через лічильник
    // не можна.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { series?: string; follow?: boolean }
    const series = cleanSeries(body.series)
    if (!series) {
      return NextResponse.json({ ok: false, error: 'Не вказано серіал' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    if (body.follow === false) {
      await admin.from('series_follows').delete()
        .eq('user_id', user.id).eq('series', series)
    } else {
      // Ключ таблиці — (user_id, series), тож повторне натискання нічого не
      // дублює; ignoreDuplicates зберігає першу дату підписки.
      await admin.from('series_follows')
        .upsert({ user_id: user.id, series }, { onConflict: 'user_id,series', ignoreDuplicates: true })
    }

    return NextResponse.json({
      ok: true,
      count: await countFollowers(series),
      followed: body.follow !== false,
      authed: true,
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти' }, { status: 500 })
  }
}
