// app/api/admin/tysha-publish/route.ts
// Публікація / планування / зняття серій «Тиші».
// action='publish'   → одразу published (published_at = now)
// action='schedule'  → scheduled з publish_at (серія з'явиться на сайті о цей час)
// action='unpublish' → назад у draft (знімає з публікації й графіка)
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

interface Body {
  id?: string
  action?: 'publish' | 'schedule' | 'unpublish'
  publish_at?: string // ISO; потрібен лише для schedule
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, action, publish_at } = (await req.json()) as Body
    if (!id || !action) return NextResponse.json({ error: 'id та action обовʼязкові' }, { status: 400 })

    const now = new Date().toISOString()
    let update: Record<string, unknown>

    if (action === 'publish') {
      update = { status: 'published', published_at: now, publish_at: null }
    } else if (action === 'schedule') {
      if (!publish_at) return NextResponse.json({ error: 'Вкажи дату публікації' }, { status: 400 })
      const when = new Date(publish_at)
      if (isNaN(when.getTime())) return NextResponse.json({ error: 'Невірна дата' }, { status: 400 })
      update = { status: 'scheduled', publish_at: when.toISOString(), published_at: null }
    } else if (action === 'unpublish') {
      update = { status: 'draft', publish_at: null, published_at: null }
    } else {
      return NextResponse.json({ error: 'Невідома дія' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('content').update(update).eq('id', id).eq('type', 'tysha')
    if (error) throw error

    return NextResponse.json({ ok: true, ...update })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
