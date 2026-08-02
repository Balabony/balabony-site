// app/api/admin/content/[id]/route.ts
// API для редагування будь-якого запису з таблиці content (історії, серії, казки)
// На відміну від /api/admin/stories1/update — без фільтру type='story'
// Це дозволяє редагувати "Парочку" та інші старі записи без UI

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { toPlainText } from '@/lib/plain-text'

// ── Auth helper (той самий патерн, що в stories1/update) ─────────────────────
function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

interface RouteContext {
  params: Promise<{ id: string }>
}

// ── GET: повертає один запис content за id (без фільтру по type/status) ──────
export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await ctx.params
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('content')
      .select('id, slug, title, author_name, genre, category, cover_url, cover_position, status, approved_at, text, type, season_number, episode_number, description, duration_minutes, is_premium, recap, publish_at, published_at, hook, next_teaser, short_description, writer_note')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Не знайдено' }, { status: 404 })
    }

    return NextResponse.json({ item: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── PATCH: оновлює поля запису ───────────────────────────────────────────────
interface PatchBody {
  title?: string
  author_name?: string
  genre?: string
  category?: string | null
  cover_url?: string | null
  cover_position?: string
  description?: string | null
  text?: string
  is_premium?: boolean
  recap?: string | null
  hook?: string | null
  next_teaser?: string | null
  short_description?: string | null
  writer_note?: string | null
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await ctx.params
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const body = (await req.json()) as PatchBody
    const update: Record<string, unknown> = {}

    if (body.title          !== undefined) update.title          = body.title
    if (body.author_name    !== undefined) update.author_name    = body.author_name
    if (body.genre          !== undefined) update.genre          = body.genre
    if (body.category       !== undefined) update.category       = body.category
    if (body.cover_url      !== undefined) update.cover_url      = body.cover_url
    if (body.cover_position !== undefined) update.cover_position = body.cover_position
    if (body.description    !== undefined) update.description    = body.description
    if (body.text           !== undefined) update.text           = toPlainText(body.text)
    if (body.is_premium     !== undefined) update.is_premium     = body.is_premium === true
    if (body.recap          !== undefined) update.recap          = body.recap
    if (body.hook           !== undefined) update.hook           = body.hook
    if (body.next_teaser    !== undefined) update.next_teaser    = body.next_teaser
    if (body.short_description !== undefined) update.short_description = body.short_description
    if (body.writer_note    !== undefined) update.writer_note    = body.writer_note

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('content')
      .update(update)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true, message: 'Оновлено' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── DELETE: видаляє запис ────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await ctx.params
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true, message: 'Видалено' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
