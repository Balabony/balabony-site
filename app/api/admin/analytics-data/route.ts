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

  const [surveys, pageViews, storyEvents, sessions, paywall, subs, revenue, acquisition] = await Promise.all([
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
    db.from('paywall_hits')
      .select('user_id, limit_type, hit_at')
      .order('hit_at', { ascending: false })
      .limit(20000),
    db.from('app_subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString()),
    db.from('revenue_events')
      .select('user_id, source, plan, provider, amount_kopecks, occurred_at')
      .eq('status', 'success')
      .order('occurred_at', { ascending: false })
      .limit(20000),
    db.from('user_acquisition')
      .select('user_id, utm_source, utm_medium, utm_campaign, referrer')
      .limit(20000),
  ])

  // Унікальні user_id активних підписників (той самий balabony_uid, що й у paywall_hits) —
  // дає змогу на сторінці порахувати, скільки тих, хто вперся в пейвол, стали платниками.
  const subscriberIds = Array.from(
    new Set((subs.data ?? []).map((r: { user_id: string | null }) => r.user_id).filter(Boolean))
  )

  return NextResponse.json({
    surveys:        surveys.data      ?? [],
    page_views:     pageViews.data    ?? [],
    story_events:   storyEvents.data  ?? [],
    sessions:       sessions.data     ?? [],
    paywall_hits:   paywall.data      ?? [],
    subscriber_ids: subscriberIds,
    revenue_events: revenue.data      ?? [],
    acquisition:    acquisition.data  ?? [],
  })
}
