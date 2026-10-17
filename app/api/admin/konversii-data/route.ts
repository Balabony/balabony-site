import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Дані для /admin/konversii (17.10.2026).
 * conversion_events — змістовні дії (lib/conversion.ts), з джерелом сесії.
 * page_views — відвідування цільових сторінок реклами (клуб, календар, пільга…).
 */
function checkAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value
  return cookie === process.env.ADMIN_PASSWORD
}

// Сторінки, куди веде реклама. Порядок = порядок у таблиці.
const LANDINGS = [
  '/klub', '/chytsi', '/kalendar-2027', '/kalendar-2027/na-odnomu-arkushi', '/kalendar-2027/dytiachyi',
  '/pilga', '/support', '/konkursy', '/konkursy/podaty', '/become-author', '/dlia-orhanizatsiy', '/stories', '/',
]

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get('days') || 30), 1), 365)
  const out: Record<string, unknown> = { days }
  try {
    const byName = await dbQuery(
      `select name,
              count(*)::int as total,
              count(*) filter (where created_at > now() - interval '7 days')::int as d7,
              count(*) filter (where source = 'google_ads')::int as ads
         from conversion_events
        where created_at > now() - ($1 || ' days')::interval
        group by name order by total desc`, [String(days)])
    out.by_name = byName.rows
    const bySource = await dbQuery(
      `select coalesce(source, 'невідомо') as source, name, count(*)::int as n
         from conversion_events
        where created_at > now() - ($1 || ' days')::interval
        group by 1, 2 order by n desc`, [String(days)])
    out.by_source = bySource.rows
    const recent = await dbQuery(
      `select name, detail, path, source, created_at
         from conversion_events order by created_at desc limit 50`)
    out.recent = recent.rows
  } catch (e) {
    out.conv_error = (e as Error).message
  }
  try {
    const lp = await dbQuery(
      `select url,
              count(distinct session_id)::int as sessions,
              count(distinct session_id) filter (where timestamp > now() - interval '7 days')::int as d7
         from page_views
        where timestamp > now() - ($1 || ' days')::interval and url = any($2::text[])
        group by url`, [String(days), LANDINGS])
    const map = new Map(lp.rows.map((r) => [r.url as string, r]))
    out.landings = LANDINGS.map((u) => ({ url: u, sessions: (map.get(u)?.sessions as number) ?? 0, d7: (map.get(u)?.d7 as number) ?? 0 }))
  } catch (e) {
    out.lp_error = (e as Error).message
  }
  try {
    const km = await dbQuery(
      `select name, email, role, source, created_at from klub_members order by created_at desc limit 200`)
    out.klub = km.rows
    const kc = await dbQuery(`select count(*)::int as n from klub_members`)
    out.klub_total = kc.rows[0]?.n ?? 0
  } catch (e) {
    out.klub_error = (e as Error).message
  }
  return NextResponse.json(out)
}
