// app/api/admin/works/route.ts
// Пошук по УСІХ записах content, включно з чернетками (draft).
// Публічний /api/stories ріже draft — тому чернеток не видно в адмінці.
// Тут фільтру за статусом немає: адмін бачить усе.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// ── GET: список творів з фільтрами ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const q      = (searchParams.get('q') || '').trim()
    const status = searchParams.get('status') || 'all'
    const limit  = Math.min(Number(searchParams.get('limit')) || 200, 500)

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('content')
      .select('id, title, author_name, status, type, genre, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (q) {
      const safe = q.replace(/[%,()]/g, ' ')
      query = query.or(`title.ilike.%${safe}%,author_name.ilike.%${safe}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ items: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── PATCH: зміна статусу одного твору ───────────────────────────────────────
interface PatchBody {
  id?: string
  ids?: string[]
  status?: string
}

const ALLOWED_STATUSES = ['draft', 'approved', 'published']

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as PatchBody
    const status = body.status

    // Приймаємо або один id, або масив ids (масове схвалення)
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.filter(x => typeof x === 'string' && x.length > 0)
      : body.id
        ? [body.id]
        : []

    if (ids.length === 0) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }
    if (ids.length > 200) {
      return NextResponse.json({ error: 'не більше 200 за раз' }, { status: 400 })
    }
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 })
    }

    const update: Record<string, unknown> = { status }
    if (status === 'approved') update.approved_at = new Date().toISOString()
    if (status === 'published') update.published_at = new Date().toISOString()

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('content')
      .update(update)
      .in('id', ids)

    if (error) throw error

    return NextResponse.json({ ok: true, status, count: ids.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
