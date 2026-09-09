import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Автор видаляє власну чернетку: /api/author/delete-draft
 *
 * Навіщо. Помилково вставлений не той текст або дубль автор прибрати не міг —
 * лишалося писати редакції. Після появи форми додавання (09.09.2026) таких
 * випадків стане більше.
 *
 * ТІЛЬКИ чернетки. Опублікований твір авторові тут видалити не можна, і це
 * свідомо: на нього вже стоять посилання, прочитання в `article_reads` (з яких
 * рахується винагорода) і, можливо, голоси за озвучення. Зняти твір з
 * публікації — окрема розмова з редакцією, а не кнопка.
 *
 * Видаляємо назавжди, не міняючи статус: чернетка, яку автор прибрав, не має
 * лишатися в базі привидом і спливати в підрахунках творів за договором.
 */

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
  }

  let contentId = ''
  try {
    const b = (await req.json()) as { contentId?: string }
    contentId = String(b?.contentId ?? '').trim()
  } catch {
    return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
  }
  if (!contentId) {
    return NextResponse.json({ ok: false, error: 'Не вказано твір' }, { status: 400 })
  }

  try {
    const r = await dbQuery(
      `select id::text, author_id::text, status::text as status, title
         from content where id = $1 limit 1`,
      [contentId],
    )
    const row = r.rows[0] as { author_id: string | null; status: string; title: string } | undefined

    if (!row) {
      return NextResponse.json({ ok: false, error: 'Твір не знайдено' }, { status: 404 })
    }
    if (row.author_id !== user.id) {
      return NextResponse.json({ ok: false, error: 'Це не ваш твір' }, { status: 403 })
    }
    if (row.status !== 'draft') {
      return NextResponse.json(
        { ok: false, error: 'Видалити можна лише чернетку. Щоб зняти опублікований твір — напишіть нам.' },
        { status: 400 },
      )
    }

    // Прив'язані рядки прибираємо самі: у частини таблиць немає каскаду, і
    // без цього видалення впало б на зовнішньому ключі.
    await dbQuery(`delete from contract_works where content_id = $1`, [contentId]).catch(() => {})
    await dbQuery(`delete from voice_votes where content_id = $1`, [contentId]).catch(() => {})
    await dbQuery(`delete from content_likes where content_id = $1`, [contentId]).catch(() => {})

    await dbQuery(`delete from content where id = $1 and status::text = 'draft'`, [contentId])

    return NextResponse.json({ ok: true, title: row.title })
  } catch (err) {
    console.error('[author/delete-draft]', (err as Error)?.message)
    return NextResponse.json(
      { ok: false, error: 'Не вдалося видалити. Спробуйте ще раз або напишіть на nazar@balabony.com' },
      { status: 500 },
    )
  }
}
