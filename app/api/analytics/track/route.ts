import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { dbQuery } from '@/lib/db'
import { getOrCreateAnonUserId } from '@/lib/anon-user'
import { logAudioPlay } from '@/lib/analytics-extra'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = getSupabaseAdmin()
    const country = req.headers.get('x-vercel-ip-country') ?? null
    // 06.11.2026: аналітика джерел/часу/повернень/команди. Команда = браузер, з якого заходили
    // в адмінку чи кабінет редактора (мітка з клієнта) або є cookie адмінки.
    const cut = (v: unknown, n = 300) => (typeof v === 'string' && v ? v.slice(0, n) : null)
    const isTeam = body.team === true || Boolean(req.cookies.get('admin_session')?.value)

    switch (body.type) {
      case 'page_view':
        await db.from('page_views').insert({
          url: body.url,
          device: body.device ?? null,
          country,
          session_id: body.session_id ?? null,
          visitor_id: cut(body.visitor_id, 64),
          referrer: cut(body.referrer),
          utm_source: cut(body.utm_source, 100),
          utm_medium: cut(body.utm_medium, 100),
          utm_campaign: cut(body.utm_campaign, 100),
          is_team: isTeam,
        })
        break

      case 'audio_play':
        if (body.key) await logAudioPlay(String(body.key), body.title ? String(body.title) : null, cut(body.session_id, 64), cut(body.visitor_id, 64))
        break

      // Час на сторінці: клієнт шле, коли людина йде зі сторінки (перехід, закриття, згортання).
      case 'page_time': {
        const sec = Math.round(Number(body.seconds))
        if (body.session_id && body.url && sec > 0 && sec < 4 * 3600) {
          await dbQuery(
            `update page_views set duration_seconds = coalesce(duration_seconds, 0) + $3
              where id = (select id from page_views where session_id = $1 and url = $2
                           order by created_at desc limit 1)`,
            [String(body.session_id).slice(0, 64), String(body.url).slice(0, 500), sec],
          )
        }
        break
      }

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
          visitor_id: cut(body.visitor_id, 64),
          referrer: cut(body.referrer),
          utm_source: cut(body.utm_source, 100),
          utm_medium: cut(body.utm_medium, 100),
          utm_campaign: cut(body.utm_campaign, 100),
          landing_path: cut(body.landing_path, 300),
          is_team: isTeam,
        }, { onConflict: 'session_id' })
        break

      case 'session_end':
        await db.from('user_sessions')
          .update({ end_time: new Date().toISOString() })
          .eq('session_id', body.session_id)
        break

      case 'conversion': {
        // Змістовні конверсії (lib/conversion.ts). Назву пропускаємо лише з білого списку.
        const allowed = ['pidpyska','donat','pilga_zaiavka','stati_avtorom','zaiavka_orhanizatsii','reiestratsiia','zavantazhennia_pdf','zaiavka_konkurs','namir_konkurs','klub','chytets']
        const name = String(body.name ?? '')
        if (!allowed.includes(name)) break
        await dbQuery(
          `insert into conversion_events (name, detail, path, source, session_id, country)
           values ($1, $2, $3, $4, $5, $6)`,
          [
            name,
            body.detail ? String(body.detail).slice(0, 200) : null,
            body.path ? String(body.path).slice(0, 300) : null,
            body.source ? String(body.source).slice(0, 100) : null,
            body.session_id ? String(body.session_id).slice(0, 64) : null,
            country,
          ],
        )
        break
      }

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
