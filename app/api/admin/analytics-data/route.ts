import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value
  return cookie === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()

  const [surveys, pageViews, storyEvents, sessions] = await Promise.all([
    db.from('survey_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000),
    db.from('page_views')
      .select('url, timestamp, device, country, session_id')
      .order('timestamp', { ascending: false })
      .limit(20000),
    db.from('story_events')
      .select('story_id, story_title, event_type, duration_seconds, created_at')
      .order('created_at', { ascending: false })
      .limit(20000),
    db.from('user_sessions')
      .select('device, city, start_time, end_time')
      .order('start_time', { ascending: false })
      .limit(5000),
  ])

  return NextResponse.json({
    surveys:      surveys.data      ?? [],
    page_views:   pageViews.data    ?? [],
    story_events: storyEvents.data  ?? [],
    sessions:     sessions.data     ?? [],
  })
}
