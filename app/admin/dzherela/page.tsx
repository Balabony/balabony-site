// 06.11.2026 (Богдан): джерела візитів, час на сторінках, повторні відвідувачі,
// частка команди і серійне читання. Пункти 1–4 рахуються з 06.11.2026 (нові поля
// page_views/user_sessions), пункт 5 — з article_reads за весь час.
import { dbQuery } from '@/lib/db'

export const metadata = { title: 'Аналітика: джерела — адмінка', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#ef9f27'
const th: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #ddd', fontSize: 13, color: '#555' }
const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #eee', fontSize: 14 }

async function q<T>(sql: string, p: unknown[] = []): Promise<T[]> {
  try { return (await dbQuery(sql, p)).rows as T[] } catch (e) { console.error('[dzherela]', (e as Error).message); return [] }
}

// Джерело: мітка utm → сайт-реферер → «прямий захід»
const SRC = `coalesce(nullif(utm_source,''),
  case when referrer is null or referrer = '' then 'прямий захід (набрали адресу, закладка, застосунок)'
       else regexp_replace(regexp_replace(referrer, '^https?://(www\\.)?', ''), '/.*$', '') end)`

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (!rows.length) return <p style={{ color: '#888', fontSize: 14 }}>Даних ще немає — з’являться з перших візитів після 06.11.2026.</p>
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', margin: '6px 0 4px' }}>
      <thead><tr>{head.map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={td}>{c}</td>)}</tr>)}</tbody>
    </table>
  )
}

const H = ({ children }: { children: React.ReactNode }) => <h2 style={{ fontSize: 18, color: GOLD, margin: '28px 0 6px' }}>{children}</h2>
const N = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: 13, color: '#777', margin: '0 0 6px' }}>{children}</p>
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')
const mmss = (s: number | null) => (s == null ? '—' : `${Math.floor(s / 60)} хв ${Math.round(s % 60)} с`)

export default async function Page({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const days = Math.min(365, Math.max(1, Number((await searchParams).d) || 30))

  // Візит на календар = сесія, у якій відкривали /kalendar-2027…; джерело — з початку тієї сесії.
  const cal = await q<{ src: string; v: number }>(
    `select ${SRC} as src, count(*)::int as v from user_sessions s
      where s.start_time > now() - ($1 || ' days')::interval and not coalesce(s.is_team,false) and s.visitor_id is not null
        and exists (select 1 from page_views p where p.session_id = s.session_id and p.url like '/kalendar-2027%')
      group by 1 order by 2 desc limit 20`, [days])

  const all = await q<{ src: string; v: number }>(
    `select ${SRC} as src, count(*)::int as v from user_sessions
      where start_time > now() - ($1 || ' days')::interval and not coalesce(is_team,false) and visitor_id is not null
      group by 1 order by 2 desc limit 20`, [days])

  const time = await q<{ url: string; n: number; med: number; avg: number }>(
    `select url, count(*)::int as n,
            percentile_cont(0.5) within group (order by duration_seconds)::float8 as med,
            avg(duration_seconds)::float8 as avg
       from page_views
      where duration_seconds > 0 and created_at > now() - ($1 || ' days')::interval and not coalesce(is_team,false)
      group by url having count(*) >= 3 order by n desc limit 25`, [days])

  const ret = await q<{ visitors: number; returning: number; avg_visits: number; avg_gap: number | null }>(
    `with v as (
       select visitor_id, count(*) as visits, min(start_time) as first, max(start_time) as last
         from user_sessions where visitor_id is not null and not coalesce(is_team,false)
          and start_time > now() - ($1 || ' days')::interval group by visitor_id)
     select count(*)::int as visitors,
            count(*) filter (where visits > 1)::int as returning,
            coalesce(avg(visits),0)::float8 as avg_visits,
            avg(extract(epoch from (last - first)) / 86400 / nullif(visits - 1, 0))::float8 as avg_gap
       from v`, [days])

  const team = await q<{ team: boolean; views: number }>(
    `select coalesce(is_team,false) as team, count(*)::int as views from page_views
      where created_at > now() - ($1 || ' days')::interval and visitor_id is not null group by 1`, [days])

  // Серійне читання: «Назва. Серія N» (або номер серії) — хто читав попередню серію раніше.
  const serial = await q<{ series: string; ep: number; readers: number; prev_first: number }>(
    `with r as (
       select ar.user_id, min(ar.read_date) as d,
              coalesce(substring(c.title from '^(.*?)\\.?\\s*Серія\\s*\\d+'), c.author_name || ' · сезон ' || c.season_number) as series,
              coalesce(substring(c.title from 'Серія\\s*(\\d+)')::int, c.episode_number) as ep
         from article_reads ar join content c on c.id = ar.content_id
        where ar.completed = true and ar.user_id is not null
          and (c.title ~ 'Серія\\s*\\d+' or c.episode_number is not null)
        group by ar.user_id, 3, 4)
     select a.series, a.ep, count(*)::int as readers,
            count(*) filter (where exists (select 1 from r b where b.user_id = a.user_id and b.series = a.series
                                            and b.ep = a.ep - 1 and b.d <= a.d))::int as prev_first
       from r a where a.ep is not null
      group by 1, 2 having count(*) >= 2 order by 1, 2`)

  const ser = new Map<string, { ep: number; readers: number; prev_first: number }[]>()
  for (const s of serial) { const l = ser.get(s.series) ?? []; l.push(s); ser.set(s.series, l) }
  const later = serial.filter((s) => s.ep > 1)
  const laterReaders = later.reduce((a, s) => a + s.readers, 0)
  const laterSerial = later.reduce((a, s) => a + s.prev_first, 0)

  const r0 = ret[0]
  const teamV = team.find((t) => t.team)?.views ?? 0
  const pubV = team.find((t) => !t.team)?.views ?? 0

  return (
    <main style={{ fontFamily: FONT, maxWidth: 980, margin: '0 auto', padding: '24px 16px 60px' }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Аналітика: джерела, час, повернення, серії</h1>
      <N>Період: останні {days} дн. · <a href="?d=7">7</a> · <a href="?d=30">30</a> · <a href="?d=90">90</a>. Пункти 1–4 збираються з 06.11.2026, пункт 5 — за весь час. Команда (браузери, з яких заходили в адмінку чи кабінет редактора) у пунктах 1–3 не врахована.</N>

      <H>1. Звідки приходять на «Календар 2027»</H>
      <N>«Прямий захід» — людина набрала адресу сама, з закладки або застосунку. Газетні QR і короткі адреси balabony.com/g… мають власну мітку (utm), тож видні окремо.</N>
      <Table head={['Джерело', 'Візитів']} rows={cal.map((r) => [r.src, r.v])} />
      <N>Для порівняння — джерела всіх візитів на сайт:</N>
      <Table head={['Джерело', 'Візитів']} rows={all.map((r) => [r.src, r.v])} />

      <H>2. Скільки часу проводять на сторінках</H>
      <N>Лише видимий час (вкладка відкрита на екрані). Медіана — «типовий» читач, без тих, хто забув вкладку.</N>
      <Table head={['Сторінка', 'Переглядів з часом', 'Медіана', 'Середнє']} rows={time.map((r) => [r.url, r.n, mmss(r.med), mmss(r.avg)])} />

      <H>3. Повторні відвідувачі</H>
      {r0 && r0.visitors > 0 ? (
        <Table head={['Відвідувачів', 'Повернулися', 'Частка', 'Візитів на людину', 'Повертаються в середньому через']}
          rows={[[r0.visitors, r0.returning, pct(r0.returning, r0.visitors), r0.avg_visits.toFixed(1), r0.avg_gap == null ? '—' : `${r0.avg_gap.toFixed(1)} дн.`]]} />
      ) : <Table head={[]} rows={[]} />}

      <H>4. Частка команди</H>
      <Table head={['Хто', 'Переглядів', 'Частка']} rows={pubV + teamV ? [['Читачі', pubV, pct(pubV, pubV + teamV)], ['Команда', teamV, pct(teamV, pubV + teamV)]] : []} />

      <H>5. Серійне читання</H>
      <N>Для серій 2 і далі: скільки дочитали серію і скільки з них перед тим дочитали попередню (читають підряд). Решта — заходять хаотично або одразу на пізню серію.</N>
      {later.length > 0 && <p style={{ fontSize: 15, margin: '4px 0 10px' }}>Загалом: <b>{pct(laterSerial, laterReaders)}</b> читачів серій 2+ читають підряд ({laterSerial} з {laterReaders}).</p>}
      {[...ser.entries()].slice(0, 40).map(([name, eps]) => (
        <details key={name} style={{ margin: '4px 0' }}>
          <summary style={{ cursor: 'pointer', fontSize: 14 }}>{name} — серій: {eps.length}, читачів серії 1: {eps.find((e) => e.ep === 1)?.readers ?? 0}</summary>
          <Table head={['Серія', 'Дочитали', 'З них читали попередню']} rows={eps.map((e) => [e.ep, e.readers, e.ep > 1 ? `${e.prev_first} (${pct(e.prev_first, e.readers)})` : '—'])} />
        </details>
      ))}
      {!serial.length && <Table head={[]} rows={[]} />}
    </main>
  )
}
