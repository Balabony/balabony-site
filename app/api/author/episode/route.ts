import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Супровідні тексти серії, які пише сам автор у кабінеті:
 * опис (картка в стрічці), «Що було раніше», анонс наступної, пост для соцмереж.
 *
 * Автор нічого не публікує: кнопка «Надіслати на редактуру» переводить
 * серію в статус review, далі рішення за редактором.
 *
 * Володіння перевіряємо через вигляд author_story_stats — він уже віддає
 * лише твори цього автора, тож окремої логіки прав тут не треба.
 */

const LIMITS = { description: 160, recap: 600, next_teaser: 200, social_post: 600 } as const
type Field = keyof typeof LIMITS

async function ownedByUser(contentId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401, error: 'Потрібно увійти' }

  const { data } = await supabase
    .from('author_story_stats')
    .select('content_id')
    .eq('author_id', user.id)
    .eq('content_id', contentId)
    .maybeSingle()

  if (!data) return { ok: false as const, status: 403, error: 'Це не ваш твір' }
  return { ok: true as const }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ ok: false, error: 'Не вказано серію' }, { status: 400 })

  const own = await ownedByUser(id)
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status })

  const r = await dbQuery(
    `select id, title, status, publish_at, description, recap, next_teaser, social_post, type
       from content where id = $1`,
    [id],
  )
  if (r.rowCount === 0) return NextResponse.json({ ok: false, error: 'Серію не знайдено' }, { status: 404 })

  return NextResponse.json({ ok: true, episode: r.rows[0] })
}

export async function POST(req: NextRequest) {
  let b: { id?: string; submit?: boolean } & Partial<Record<Field, string>>
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const id = (b.id ?? '').trim()
  if (!id) return NextResponse.json({ ok: false, error: 'Не вказано серію' }, { status: 400 })

  const own = await ownedByUser(id)
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status })

  // Редагувати можна лише те, що ще не пішло далі
  const cur = await dbQuery(`select status from content where id = $1`, [id])
  if (cur.rowCount === 0) return NextResponse.json({ ok: false, error: 'Серію не знайдено' }, { status: 404 })
  const status = String(cur.rows[0].status)
  if (status !== 'draft') {
    return NextResponse.json(
      { ok: false, error: 'Серія вже на редактурі або опублікована — правки через редактора' },
      { status: 409 },
    )
  }

  const values: string[] = []
  const sets: string[] = []
  for (const f of Object.keys(LIMITS) as Field[]) {
    const v = b[f]
    if (v === undefined) continue
    const t = v.trim()
    if (t.length > LIMITS[f]) {
      return NextResponse.json({ ok: false, error: `Задовгий текст у полі «${f}»` }, { status: 400 })
    }
    values.push(t)
    sets.push(`${f} = $${values.length}`)
  }

  if (b.submit === true) {
    const need: Field[] = ['description', 'next_teaser']
    for (const f of need) {
      const v = (b[f] ?? '').trim()
      if (!v) return NextResponse.json({ ok: false, error: 'Заповніть опис серії й анонс наступної' }, { status: 400 })
    }
    sets.push(`status = 'review'`)
  }

  if (sets.length === 0) return NextResponse.json({ ok: true, saved: false })

  values.push(id)
  await dbQuery(`update content set ${sets.join(', ')} where id = $${values.length}`, values)

  return NextResponse.json({ ok: true, saved: true, submitted: b.submit === true })
}
