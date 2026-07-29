import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/** Опитування авторів: зручність кабінету, теми, побажання. Одна відповідь на автора, можна оновлювати. */

type Body = {
  easeRating?: number | null
  inconvenience?: string | null
  topics?: string[]
  topicsOther?: string | null
  helpsWrite?: string[]
  audioInterest?: string | null
  wishes?: string | null
}

const clip = (v: unknown, n: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const ease = typeof b.easeRating === 'number' && b.easeRating >= 1 && b.easeRating <= 5
    ? Math.round(b.easeRating)
    : null
  const topics = Array.isArray(b.topics) ? b.topics.slice(0, 20).map(t => String(t).slice(0, 60)) : []
  const helps = Array.isArray(b.helpsWrite) ? b.helpsWrite.slice(0, 20).map(t => String(t).slice(0, 60)) : []

  await dbQuery(
    `insert into author_feedback
       (author_id, ease_rating, inconvenience, topics, topics_other, helps_write, audio_interest, wishes, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now())
     on conflict (author_id) do update
        set ease_rating = excluded.ease_rating,
            inconvenience = excluded.inconvenience,
            topics = excluded.topics,
            topics_other = excluded.topics_other,
            helps_write = excluded.helps_write,
            audio_interest = excluded.audio_interest,
            wishes = excluded.wishes,
            updated_at = now()`,
    [
      user.id, ease, clip(b.inconvenience, 2000), topics,
      clip(b.topicsOther, 300), helps, clip(b.audioInterest, 60), clip(b.wishes, 2000),
    ],
  )

  return NextResponse.json({ ok: true })
}
