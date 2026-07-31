import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { dbQuery } from '@/lib/db'
import { getOrCreateAnonUserId } from '@/lib/anon-user'

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

      case 'story_event': {
        // story_id історично text: більшість трекерів шлють uuid контенту,
        // але AudioPlayer передає назву. Розбираємо тут, щоб події одразу
        // лягали привʼязаними, а не звʼязувалися заднім числом.
        const raw = String(body.story_id ?? '')
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(raw)
        let contentId: string | null = isUuid ? raw : null

        if (!contentId) {
          const title = String(body.story_title ?? raw).trim()
          if (title) {
            const found = await dbQuery(
              `select id from content where lower(trim(title)) = lower($1) limit 1`,
              [title],
            )
            contentId = (found.rows[0]?.id as string | undefined) ?? null
          }
        }

        await db.from('story_events').insert({
          story_id: body.story_id ?? null,
          story_title: body.story_title ?? null,
          event_type: body.event_type,
          duration_seconds: body.duration_seconds ?? null,
          session_id: body.session_id ?? null,
          content_id: contentId,
        })

        // Перегляди рахуємо унікальними сесіями: одне відкриття пʼять разів
        // тим самим читачем — один перегляд.
        if (contentId && (body.event_type === 'open' || body.event_type === 'read_start')) {
          await dbQuery(
            `update content set views_count = (
               select count(distinct session_id) filter (where session_id is not null)
                    + count(*) filter (where session_id is null)
                 from story_events
                where content_id = $1 and event_type in ('open','read_start')
             ) where id = $1`,
            [contentId],
          )
        }
        break
      }

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

      case 'acquisition': {
        // First-touch attribution. user_id = balabony_uid (same as revenue_events).
        // ignoreDuplicates keeps the earliest row → never overwrite first touch.
        const userId = await getOrCreateAnonUserId()
        await db.from('user_acquisition').upsert({
          user_id:      userId,
          utm_source:   body.utm_source   ?? null,
          utm_medium:   body.utm_medium   ?? null,
          utm_campaign: body.utm_campaign ?? null,
          utm_content:  body.utm_content  ?? null,
          utm_term:     body.utm_term     ?? null,
          referrer:     body.referrer     ?? null,
          landing_path: body.landing_path ?? null,
        }, { onConflict: 'user_id', ignoreDuplicates: true })
        break
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
