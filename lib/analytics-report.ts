import { dbQuery } from '@/lib/db'
import { ensureAnalyticsTables } from '@/lib/analytics-extra'

/**
 * 06.11.2026 (Богдан): єдиний звіт аналітики для /admin/dzherela і для щотижневих
 * рекомендацій ШІ. Команда (is_team) з читацьких показників виключена.
 */

async function q<T>(sql: string, p: unknown[] = []): Promise<T[]> {
  try { return (await dbQuery(sql, p)).rows as T[] } catch (e) { console.error('[analytics-report]', (e as Error).message); return [] }
}

const SRC = `coalesce(nullif(utm_source,''),
  case when referrer is null or referrer = '' then 'прямий захід'
       else regexp_replace(regexp_replace(referrer, '^https?://(www\\.)?', ''), '/.*$', '') end)`
const P = `($1 || ' days')::interval`

export type Row = Record<string, string | number | null>

export async function getReport(days: number) {
  await ensureAnalyticsTables().catch(() => {})
  const d = [days]

  const calendar = await q<Row>(`select ${SRC} as dzherelo, count(*)::int as vizytiv from user_sessions s
     where s.start_time > now() - ${P} and not coalesce(s.is_team,false) and s.visitor_id is not null
       and exists (select 1 from page_views p where p.session_id = s.session_id and p.url like '/kalendar-2027%')
     group by 1 order by 2 desc limit 15`, d)

  const sources = await q<Row>(`select ${SRC} as dzherelo, count(*)::int as vizytiv from user_sessions
     where start_time > now() - ${P} and not coalesce(is_team,false) and visitor_id is not null
     group by 1 order by 2 desc limit 15`, d)

  const pageTime = await q<Row>(`select url as storinka, count(*)::int as perehliadiv,
       round(percentile_cont(0.5) within group (order by duration_seconds))::int as mediana_sek,
       round(avg(duration_seconds))::int as serednie_sek
     from page_views where duration_seconds > 0 and created_at > now() - ${P} and not coalesce(is_team,false)
     group by url having count(*) >= 3 order by 2 desc limit 20`, d)

  const returning = (await q<Row>(`with v as (
       select visitor_id, count(*) as visits, min(start_time) as f, max(start_time) as l
         from user_sessions where visitor_id is not null and not coalesce(is_team,false) and start_time > now() - ${P}
        group by visitor_id)
     select count(*)::int as vidviduvachiv, count(*) filter (where visits > 1)::int as povernulysia,
            round(coalesce(avg(visits),0)::numeric, 1)::float8 as vizytiv_na_liudynu,
            round(avg(extract(epoch from (l - f)) / 86400 / nullif(visits - 1, 0))::numeric, 1)::float8 as dniv_mizh_vizytamy
       from v`, d))[0] ?? null

  const team = await q<Row>(`select case when coalesce(is_team,false) then 'команда' else 'читачі' end as khto, count(*)::int as perehliadiv
     from page_views where created_at > now() - ${P} and visitor_id is not null group by 1`, d)

  const serial = await q<{ series: string; ep: number; readers: number; prev_first: number }>(`with r as (
       select ar.user_id, min(ar.read_date) as d,
              coalesce(substring(c.title from '^(.*?)\\.?\\s*Серія\\s*\\d+'), c.author_name || ' · сезон ' || c.season_number) as series,
              coalesce(substring(c.title from 'Серія\\s*(\\d+)')::int, c.episode_number) as ep
         from article_reads ar join content c on c.id = ar.content_id
        where ar.completed = true and ar.user_id is not null and (c.title ~ 'Серія\\s*\\d+' or c.episode_number is not null)
        group by ar.user_id, 3, 4)
     select a.series, a.ep, count(*)::int as readers,
            count(*) filter (where exists (select 1 from r b where b.user_id = a.user_id and b.series = a.series and b.ep = a.ep - 1 and b.d <= a.d))::int as prev_first
       from r a where a.ep is not null group by 1, 2 having count(*) >= 2 order by 1, 2`)

  // 1. Воронка: відвідувачі → відкрили твір → дочитали → реєстрація → дії
  const funnel = (await q<Row>(`select
       (select count(distinct visitor_id) from user_sessions where start_time > now() - ${P} and not coalesce(is_team,false) and visitor_id is not null)::int as vidviduvachi,
       (select count(distinct user_id) from article_reads where read_date > (now() - ${P})::date)::int as vidkryly_tvir,
       (select count(distinct user_id) from article_reads where completed and read_date > (now() - ${P})::date)::int as dochytaly,
       (select count(*) from conversion_events where name = 'reiestratsiia' and created_at > now() - ${P})::int as reiestratsii,
       (select count(*) from conversion_events where name in ('pidpyska','klub','donat') and created_at > now() - ${P})::int as pidpysky_klub_donaty`, d))[0] ?? null

  // 2. Де кидають читати: частка читачів, що зупинились до 25/50/70 %
  const dropoff = await q<Row>(`select c.title as tvir, count(*)::int as chytachiv,
       round(100.0 * count(*) filter (where ar.read_percentage < 25) / count(*))::int as do_25,
       round(100.0 * count(*) filter (where ar.read_percentage >= 25 and ar.read_percentage < 50) / count(*))::int as do_50,
       round(100.0 * count(*) filter (where ar.read_percentage >= 50 and ar.read_percentage < 70) / count(*))::int as do_70,
       round(100.0 * count(*) filter (where ar.completed) / count(*))::int as dochytaly
     from article_reads ar join content c on c.id = ar.content_id
    where ar.read_date > (now() - ${P})::date
    group by c.title having count(*) >= 10 order by 2 desc limit 20`, d)

  // 3. Пошук без результатів і найчастіші запити
  const searchZero = await q<Row>(`select q as zapyt, count(*)::int as raziv from search_log
     where results = 0 and length(q) >= 3 and created_at > now() - ${P} group by q order by 2 desc limit 15`, d)
  const searchTop = await q<Row>(`select q as zapyt, count(*)::int as raziv, max(results)::int as rezultativ from search_log
     where length(q) >= 3 and created_at > now() - ${P} group by q order by 2 desc limit 15`, d)

  // 4. Які автори приводять читачів ззовні (візит почався зі сторінки їхнього твору, прийшли з іншого сайту/мітки)
  const authors = await q<Row>(`select c.author_name as avtor, count(*)::int as vizytiv_zzovni,
       string_agg(distinct ${SRC.replace(/utm_source|referrer/g, (m) => 's.' + m)}, ', ') as zvidky
     from user_sessions s
     join content c on c.slug = regexp_replace(s.landing_path, '^.*/', '')
    where s.start_time > now() - ${P} and not coalesce(s.is_team,false)
      and s.landing_path ~ '^/(stories|episodes|tysha)/' and (s.referrer is not null or s.utm_source is not null)
      and c.author_name is not null
    group by c.author_name order by 2 desc limit 15`, d)

  // 5. Газета: візити з коротких адрес /g/… по випусках
  const newspaper = await q<Row>(`select coalesce(utm_campaign, '—') as vypusk, count(*)::int as vizytiv
     from user_sessions where utm_source = 'gazeta' and start_time > now() - ${P} group by 1 order by 2 desc`, d)

  // 6. Аудіо проти тексту
  const audio = (await q<Row>(`select
       (select count(*) from audio_plays where created_at > now() - ${P})::int as zapuskiv_audio,
       (select count(distinct coalesce(visitor_id, session_id)) from audio_plays where created_at > now() - ${P})::int as slukhachiv,
       (select count(*) from article_reads where read_date > (now() - ${P})::date)::int as vidkryttiv_tekstu,
       (select count(distinct user_id) from article_reads where read_date > (now() - ${P})::date)::int as chytachiv`, d))[0] ?? null
  const audioTop = await q<Row>(`select coalesce(title, content_key) as tvir, count(*)::int as zapuskiv from audio_plays
     where created_at > now() - ${P} group by 1 order by 2 desc limit 10`, d)

  // 7. Коли читають (за Києвом)
  const hours = await q<Row>(`select extract(hour from created_at at time zone 'Europe/Kyiv')::int as hodyna, count(*)::int as perehliadiv
     from page_views where created_at > now() - ${P} and not coalesce(is_team,false) group by 1 order by 1`, d)
  const weekdays = await q<Row>(`select extract(isodow from created_at at time zone 'Europe/Kyiv')::int as den, count(*)::int as perehliadiv
     from page_views where created_at > now() - ${P} and not coalesce(is_team,false) group by 1 order by 1`, d)

  // 8. Що працює в тексті: довжина, назва, зачин, жанр — у найкраще й найгірше дочитуваних творів
  const W = `array_length(regexp_split_to_array(btrim(coalesce(c.text,'')), '\\s+'), 1)`
  const works = await q<Row>(`with w as (
       select c.title as nazva, c.genre as zhanr, ${W} as sliv,
              left(regexp_replace(coalesce(c.text,''), '\\s+', ' ', 'g'), 280) as zachyn,
              count(*)::int as chytachiv, round(100.0 * count(*) filter (where ar.completed) / count(*))::int as dochytaly_pct
         from article_reads ar join content c on c.id = ar.content_id
        where ar.read_date > (now() - ${P})::date
        group by c.id having count(*) >= 10)
     (select 'найкраще' as hrupa, * from w order by dochytaly_pct desc limit 8)
     union all
     (select 'найгірше', * from w order by dochytaly_pct asc limit 8)`, d)
  const byLength = await q<Row>(`with w as (
       select ${W} as sliv, count(*) as n, count(*) filter (where ar.completed) as done
         from article_reads ar join content c on c.id = ar.content_id
        where ar.read_date > (now() - ${P})::date group by c.id)
     select case when sliv < 500 then 'до 500 слів' when sliv < 1000 then '500–1000' when sliv < 2000 then '1000–2000'
                 when sliv < 4000 then '2000–4000' else 'понад 4000' end as dovzhyna,
            count(*)::int as tvoriv, sum(n)::int as vidkryttiv, round(100.0 * sum(done) / nullif(sum(n),0))::int as dochytaly_pct
       from w where sliv is not null group by 1 order by min(sliv)`, d)

  return { days, works, byLength, calendar, sources, pageTime, returning, team, serial, funnel, dropoff, searchZero, searchTop, authors, newspaper, audio, audioTop, hours, weekdays }
}

export type Report = Awaited<ReturnType<typeof getReport>>
