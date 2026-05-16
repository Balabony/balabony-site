import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// ── GET: список усіх історій АБО одна з повним текстом (за ?id=xxx) ──────────
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    // ── Режим 1: одна історія з повним текстом ──
    if (id) {
      const { data, error } = await supabase
        .from('content')
        .select('id, slug, title, author_name, genre, category, cover_url, cover_position, status, approved_at, text')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) {
        return NextResponse.json({ error: 'Історію не знайдено' }, { status: 404 })
      }
      return NextResponse.json({ story: data })
    }

    // ── Режим 2: список усіх (без повного тексту) ──
    const { data, error } = await supabase
      .from('content')
      .select('id, slug, title, author_name, genre, category, cover_url, cover_position, status, approved_at, text')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .order('approved_at', { ascending: false })

    if (error) throw error

    const enriched = (data ?? []).map(row => ({
      ...row,
      word_count: row.text ? row.text.trim().split(/\s+/).length : 0,
      text: undefined, // не повертаємо повний текст у список (економимо трафік)
    }))

    return NextResponse.json({ stories: enriched })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST: оновити одну історію ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json() as {
      id: string
      title?: string
      author_name?: string
      genre?: string
      category?: string | null
      text?: string
      cover_url?: string | null
      cover_position?: string
    }

    if (!body.id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const update: Record<string, unknown> = {}
    if (body.title          !== undefined) update.title          = body.title
    if (body.author_name    !== undefined) update.author_name    = body.author_name
    if (body.genre          !== undefined) update.genre          = body.genre
    if (body.category       !== undefined) update.category       = body.category
    if (body.text           !== undefined) {
      update.text = body.text
      const wc = body.text.trim().split(/\s+/).length
      update.duration_minutes = Math.max(1, Math.round(wc / 200))
    }
    if (body.cover_url      !== undefined) update.cover_url      = body.cover_url
    if (body.cover_position !== undefined) update.cover_position = body.cover_position

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('content').update(update).eq('id', body.id)

    if (error) throw error

    return NextResponse.json({ ok: true, message: 'Оновлено' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── DELETE: видалити історію ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('content').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true, message: 'Видалено' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
