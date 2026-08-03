// app/api/admin/genres/route.ts
//
// Список творів для екрана «Жанри» і збереження жанру.
// GET   — які твори без жанру (або всі, для перегляду).
// PATCH — проставити жанр одному або кільком творам.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { isGenre } from '@/lib/genres'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url   = new URL(req.url)
  const only  = url.searchParams.get('only') ?? 'empty'   // empty | all
  const limit = Math.min(300, Math.max(1, Number(url.searchParams.get("limit") ?? 50)))

  const db = getSupabaseAdmin()
  let q = db
    .from('content')
    .select('id, title, author_name, slug, genre, status', { count: 'exact' })
    .eq('type', 'story')
    .in('status', ['approved', 'published'])
    .order('approved_at', { ascending: false })
    .limit(limit)

  if (only === 'empty') q = q.or('genre.is.null,genre.eq.')

  const { data, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rows: data ?? [], total: count ?? 0 })
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { items?: Array<{ id: string; genre: string }> }
  const items = Array.isArray(body.items) ? body.items : []
  if (items.length === 0) {
    return NextResponse.json({ error: 'Нічого зберігати' }, { status: 400 })
  }

  // Приймаємо лише жанри з канонічного переліку: інакше в базу потрапить
  // те, чого немає у фільтрах, і твір зникне з навігації.
  const bad = items.find(i => !isGenre(i.genre))
  if (bad) {
    return NextResponse.json({ error: `Невідомий жанр: ${bad.genre}` }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  let saved = 0
  for (const item of items) {
    const { error } = await db.from('content').update({ genre: item.genre }).eq('id', item.id)
    if (!error) saved++
  }

  return NextResponse.json({ ok: true, saved })
}
