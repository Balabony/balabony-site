import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { fetchAll } from '@/lib/fetch-all'
import { dbQuery } from '@/lib/db'

function checkAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value
  return cookie === process.env.ADMIN_PASSWORD
}

/**
 * Акаунти читачів і кабінети авторів. Додано 18.09.2026.
 *
 * Рахуємо в самій базі й віддаємо лише підсумки: auth.users недоступна через
 * клієнт Supabase, тож ідемо прямим з'єднанням (dbQuery), як /admin/author-accounts.
 *
 * Читач = обліковий запис без рядка в author_profiles.
 * «Не завершили вхід» = запросили посилання на пошту, але жодного разу не
 * увійшли (last_sign_in_at порожній) — саме ті, хто губиться на /login.
 *
 * Автор = рядок в author_profiles. Кабінети авторів створює редакція
 * (/admin/create-author), тож їхній приріст показує швидкість нашої роботи,
 * а не реакцію на дописи. Дата — created_at профілю, якщо така колонка є,
 * інакше дата облікового запису (через to_jsonb, щоб запит не падав).
 */
async function loadAccounts() {
  const sql = `
    with rd as (
      select u.id, u.created_at, u.last_sign_in_at,
             coalesce(u.raw_app_meta_data->>'provider', 'email') as provider
        from auth.users u
       where not exists (select 1 from author_profiles p where p.user_id = u.id)
    ),
    au as (
      select p.user_id as id,
             coalesce((to_jsonb(p)->>'created_at')::timestamptz, u.created_at) as created_at,
             u.last_sign_in_at,
             coalesce(p.is_active, true) as is_active,
             exists (select 1 from content c
                      where c.author_id = p.user_id
                        and c.status in ('approved','published')) as has_works
        from author_profiles p
        left join auth.users u on u.id = p.user_id
    ),
    -- Джерело першого дотику (user_acquisition). На id акаунта воно
    -- переноситься при вході з 16.09.2026 (lib/reader-id.ts, mergeAnonInto),
    -- тож у старіших акаунтів і в кабінетів, куди автор ще не входив, його
    -- немає — це «невідомо», а не «прямий».
    src as (
      select a.user_id::text as id,
             case
               when coalesce(a.utm_source, '') <> '' then lower(a.utm_source)
               when coalesce(a.referrer, '') = '' then 'прямий'
               else lower(substring(a.referrer from '^https?://([^/:?#]+)'))
             end as raw,
             nullif(split_part(coalesce(a.landing_path, ''), '?', 1), '') as landing
        from user_acquisition a
    ),
    ch as (
      select id, landing,
             case
               when raw is null                                  then 'інше'
               when raw ~ '(facebook|^fb$|^fb\\.)'                  then 'facebook'
               when raw ~ '(instagram|^ig$)'                      then 'instagram'
               when raw ~ '(^|\\.)google\\.' or raw = 'google'        then 'google'
               when raw ~ '(telegram|^t\\.me$|^tg$)'                then 'telegram'
               when raw ~ 'viber'                                 then 'viber'
               when raw ~ 'tiktok'                                then 'tiktok'
               when raw ~ 'balabony'                              then 'прямий'
               else regexp_replace(raw, '^(www|m|l|lm|mobile)\\.', '')
             end as channel
        from src
    ),
    r30 as (
      select coalesce(ch.channel, 'невідомо') as channel, ch.landing
        from rd left join ch on ch.id = rd.id::text
       where rd.created_at >= now() - interval '30 days'
    ),
    a30 as (
      select coalesce(ch.channel, 'невідомо') as channel
        from au left join ch on ch.id = au.id::text
       where au.created_at >= now() - interval '30 days'
    ),
    days as (
      select generate_series(
               (now() at time zone 'Europe/Kyiv')::date - 29,
               (now() at time zone 'Europe/Kyiv')::date,
               interval '1 day')::date as d
    )
    select
      (select json_build_object(
         'total',    count(*),
         'new7',     count(*) filter (where created_at >= now() - interval '7 days'),
         'new30',    count(*) filter (where created_at >= now() - interval '30 days'),
         'entered',  count(*) filter (where last_sign_in_at is not null),
         'never',    count(*) filter (where last_sign_in_at is null),
         'active30', count(*) filter (where last_sign_in_at >= now() - interval '30 days'),
         'google',   count(*) filter (where provider = 'google')
       ) from rd) as readers,
      (select json_build_object(
         'total',     count(*),
         'active',    count(*) filter (where is_active),
         'new7',      count(*) filter (where created_at >= now() - interval '7 days'),
         'new30',     count(*) filter (where created_at >= now() - interval '30 days'),
         'entered',   count(*) filter (where last_sign_in_at is not null),
         'active30',  count(*) filter (where last_sign_in_at >= now() - interval '30 days'),
         'withWorks', count(*) filter (where has_works)
       ) from au) as authors,
      (select json_agg(json_build_object(
         'date',    to_char(d, 'DD.MM'),
         'readers', (select count(*) from rd where (rd.created_at at time zone 'Europe/Kyiv')::date = days.d),
         'authors', (select count(*) from au where (au.created_at at time zone 'Europe/Kyiv')::date = days.d)
       ) order by d) from days) as by_day,
      (select coalesce(json_agg(json_build_object('name', channel, 'value', n) order by n desc), '[]'::json)
         from (select channel, count(*) as n from r30 group by channel) t) as readers_by_channel,
      (select coalesce(json_agg(json_build_object('name', channel, 'value', n) order by n desc), '[]'::json)
         from (select channel, count(*) as n from a30 group by channel) t) as authors_by_channel,
      (select coalesce(json_agg(json_build_object('name', landing, 'value', n) order by n desc), '[]'::json)
         from (select landing, count(*) as n from r30 where landing is not null
                group by landing order by n desc limit 8) t) as readers_landing
  `
  try {
    const r = await dbQuery(sql)
    const row = r.rows[0] as Record<string, unknown>
    return {
      readers:            row.readers,
      authors:            row.authors,
      by_day:             row.by_day ?? [],
      readers_by_channel: row.readers_by_channel ?? [],
      authors_by_channel: row.authors_by_channel ?? [],
      readers_landing:    row.readers_landing ?? [],
    }
  } catch (e) {
    const err = e as { message?: string }
    return { error: err?.message ?? 'невідома помилка' }
  }
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()

  const accountsPromise = loadAccounts()

  const [surveys, pageViews, storyEvents, sessions, paywall, subs, revenue, acquisition, works, reviews] = await Promise.all([
    // fetchAll — бо Supabase віддає максимум 1000 рядків за запит (див. lib/fetch-all.ts).
    fetchAll((a, b) => db.from('survey_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(a, b), 5000),
    fetchAll((a, b) => db.from('page_views')
      .select('url, timestamp, device, country, session_id')
      .order('timestamp', { ascending: false })
      .range(a, b), 20000),
    fetchAll((a, b) => db.from('story_events')
      .select('story_id, story_title, event_type, duration_seconds, created_at')
      .order('created_at', { ascending: false })
      .range(a, b), 20000),
    fetchAll((a, b) => db.from('user_sessions')
      .select('device, city, start_time, end_time')
      .order('start_time', { ascending: false })
      .range(a, b), 5000),
    fetchAll((a, b) => db.from('paywall_hits')
      .select('user_id, limit_type, hit_at')
      .order('hit_at', { ascending: false })
      .range(a, b), 20000),
    db.from('app_subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString()),
    fetchAll((a, b) => db.from('revenue_events')
      .select('user_id, source, plan, provider, amount_kopecks, occurred_at')
      .eq('status', 'success')
      .order('occurred_at', { ascending: false })
      .range(a, b), 20000),
    fetchAll((a, b) => db.from('user_acquisition')
      .select('user_id, utm_source, utm_medium, utm_campaign, referrer')
      .order('user_id')
      .range(a, b), 20000),
    // Жанр не зберігається в подіях читання, тому тягнемо довідник творів
    // і зіставляємо вже на сторінці. Без цього «популярні жанри» рахувалися
    // з анкет — тобто з того, що читачі про себе кажуть, а не з того,
    // що вони насправді читають.
    fetchAll((a, b) => db.from('content')
      .select('id, genre, title')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .order('id')
      .range(a, b), 5000),
    // Відгуки. Додано 09.09.2026: механіка існувала з самого початку, але
    // ReviewModal ніде не викликався — залишити відгук було неможливо, і
    // аналітика про відгуки не знала взагалі.
    fetchAll((a, b) => db.from('reviews')
      .select('content_type, content_id, rating, comment, created_at')
      .order('created_at', { ascending: false })
      .range(a, b), 5000),
  ])

  // Унікальні user_id активних підписників (той самий balabony_uid, що й у paywall_hits) —
  // дає змогу на сторінці порахувати, скільки тих, хто вперся в пейвол, стали платниками.
  const subscriberIds = Array.from(
    new Set((subs.data ?? []).map((r: { user_id: string | null }) => r.user_id).filter(Boolean))
  )

  const accounts = await accountsPromise

  return NextResponse.json({
    accounts,
    surveys:        surveys.data      ?? [],
    page_views:     pageViews.data    ?? [],
    story_events:   storyEvents.data  ?? [],
    sessions:       sessions.data     ?? [],
    paywall_hits:   paywall.data      ?? [],
    subscriber_ids: subscriberIds,
    revenue_events: revenue.data      ?? [],
    acquisition:    acquisition.data  ?? [],
    reviews:        reviews.data      ?? [],
    genre_by_id:    Object.fromEntries(
      ((works.data ?? []) as { id: string; genre: string | null }[])
        .filter((w) => w.genre)
        .map((w) => [w.id, w.genre as string]),
    ),
    // Назви творів — щоб у блоці відгуків стояла назва, а не uuid.
    title_by_id:    Object.fromEntries(
      ((works.data ?? []) as { id: string; title: string | null }[])
        .filter((w) => w.title)
        .map((w) => [w.id, w.title as string]),
    ),
  })
}
