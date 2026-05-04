import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = getSupabaseAdmin()
    const country = req.headers.get('x-vercel-ip-country') ?? null

    switch (body.type) {
      case 'page_view':
        await db.from('page_views').insert({
          url: body.url,
          device: body.device ?? null,
          country,
          session_id: body.session_id ?? null,
        })
        break

      case 'story_event':
        await db.from('story_events').insert({
          story_id: body.story_id ?? null,
          story_title: body.story_title ?? null,
          event_type: body.event_type,
          duration_seconds: body.duration_seconds ?? null,
          session_id: body.session_id ?? null,
        })
        break

      case 'session_start':
        await db.from('user_sessions').upsert({
          session_id: body.session_id,
          device: body.device ?? null,
          city: body.city ?? null,
          start_time: new Date().toISOString(),
        }, { onConflict: 'session_id' })
        break

      case 'session_end':
        await db.from('user_sessions')
          .update({ end_time: new Date().toISOString() })
          .eq('session_id', body.session_id)
        break
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
