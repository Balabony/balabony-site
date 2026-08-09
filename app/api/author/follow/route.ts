import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Підписка читача на автора.
 *
 * GET  — стан кнопки: скільки підписників у автора і чи стежить цей читач.
 * POST — перемикач: підписатися або відписатися.
 *
 * Лічильник рахує service role, а не запит від імені читача: RLS показує
 * людині лише її власні підписки, і публічний count через звичайний клієнт
 * повертав би одиницю або нуль замість справжнього числа.
 *
 * Незалогінений отримує лічильник і followed: false — кнопка малюється
 * однаково для всіх, а на кліку компонент веде на /login. Так читач бачить,
 * що механізм живий, ще до реєстрації.
 */

function cleanId(value: unknown): string {
  return String(value ?? '').trim().slice(0, 64)
}

async function countFollowers(authorUserId: string): Promise<number> {
  const admin = getSupabaseAdmin()
  const { count, error } = await admin
    .from('author_follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('author_user_id', authorUserId)

  if (error) return 0
  return count ?? 0
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const authorUserId = cleanId(url.searchParams.get('authorUserId'))

    if (!authorUserId) {
      return NextResponse.json(
        { ok: false, count: 0, followed: false, authed: false },
        { status: 400 },
      )
    }

    const count = await countFollowers(authorUserId)

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: true, count, followed: false, authed: false })
    }

    const { data } = await supabase
      .from('author_follows')
      .select('created_at')
      .eq('follower_id', user.id)
      .eq('author_user_id', authorUserId)
      .maybeSingle()

    return NextResponse.json({
      ok: true,
      count,
      followed: Boolean(data),
      authed: true,
    })
  } catch {
    return NextResponse.json(
      { ok: false, count: 0, followed: false, authed: false },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Потрібно увійти' },
        { status: 401 },
      )
    }

    let payload: { authorUserId?: string; follow?: boolean }
    try {
      payload = (await req.json()) as typeof payload
    } catch {
      return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
    }

    const authorUserId = cleanId(payload.authorUserId)
    if (!authorUserId) {
      return NextResponse.json({ ok: false, error: 'Не вказано автора' }, { status: 400 })
    }

    if (authorUserId === user.id) {
      return NextResponse.json(
        { ok: false, error: 'Не можна стежити за собою' },
        { status: 400 },
      )
    }

    const follow = payload.follow !== false

    if (follow) {
      // upsert, а не insert: повторний клік по вже натиснутій кнопці
      // (друга вкладка, повільна мережа) не має падати помилкою.
      const { error } = await supabase
        .from('author_follows')
        .upsert(
          { follower_id: user.id, author_user_id: authorUserId },
          { onConflict: 'follower_id,author_user_id' },
        )
      if (error) {
        return NextResponse.json({ ok: false, error: 'Не вдалося зберегти' }, { status: 500 })
      }
    } else {
      const { error } = await supabase
        .from('author_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('author_user_id', authorUserId)
      if (error) {
        return NextResponse.json({ ok: false, error: 'Не вдалося зберегти' }, { status: 500 })
      }
    }

    const count = await countFollowers(authorUserId)

    return NextResponse.json({ ok: true, count, followed: follow, authed: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Помилка сервера' }, { status: 500 })
  }
}
