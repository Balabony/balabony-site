import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Чи є той, хто зараз увійшов, автором.
 *
 * Раніше це питали з браузера прямо в author_profiles, і відповідь залежала
 * від того, чи встигла сесія долетіти до політики доступу. Не встигла —
 * помилка ковталася, і людині показували «Профіль» замість кабінету. Авторка
 * описала це точно: вчора заходило, сьогодні ні, при тих самих діях.
 *
 * Тут перевірка йде на сервері з прямим підключенням, тож політики доступу
 * ні на що не впливають, а помилку видно, а не ковтається.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ authenticated: false, isAuthor: false })

  try {
    const r = await dbQuery(
      `select 1 from author_profiles
        where user_id = $1 and is_active = true
        limit 1`,
      [user.id],
    )
    return NextResponse.json({ authenticated: true, isAuthor: r.rows.length > 0 })
  } catch {
    // Свідомо повертаємо помилку, а не «не автор»: хай краще кнопка лишиться
    // як була, ніж автора мовчки перекине в читацький профіль.
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }
}
