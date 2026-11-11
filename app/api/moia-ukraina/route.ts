// 11.11.2026: рейтинг шкіл для гри «Моя Україна на мапі». Зберігаємо лише місто, номер школи, клас і бали — жодних даних дітей.
// Таблиця й подання створюються SQL-скриптом moia_ukraina.sql (запускається вручну в Supabase).
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { CITIES } from '@/app/moia-ukraina/data'

export const dynamic = 'force-dynamic'

const NAMES = new Set(CITIES.map((c) => c.n))
const hits = new Map<string, { n: number; t: number }>()

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'x'
  const now = Date.now()
  const h = hits.get(ip)
  if (h && now - h.t < 3_600_000 && h.n >= 30) return NextResponse.json({ ok: false }, { status: 429 })
  hits.set(ip, h && now - h.t < 3_600_000 ? { n: h.n + 1, t: h.t } : { n: 1, t: now })

  const b = await req.json().catch(() => null)
  const sp = req.nextUrl.searchParams
  // 11.11.2026: лічильник завершених ігор (без жодних даних) і пропозиції запитань від дітей (лише на модерацію).
  if (sp.get('played')) {
    await getSupabaseAdmin().from('moia_ukraina_plays').insert({})
    return NextResponse.json({ ok: true })
  }
  if (sp.get('suggest')) {
    const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
    const row = { city: s(b?.city, 40), place: s(b?.place, 40), question: s(b?.q, 200), answer: s(b?.a, 80), wrong1: s(b?.w1, 80), wrong2: s(b?.w2, 80), wrong3: s(b?.w3, 80), explanation: s(b?.why, 300), signature: s(b?.sign, 40) }
    if (!row.city || !row.question || !row.answer || !row.wrong1 || !row.wrong2 || !row.wrong3 || !row.signature) return NextResponse.json({ ok: false }, { status: 400 })
    const { error } = await getSupabaseAdmin().from('moia_ukraina_suggestions').insert(row)
    if (error) return NextResponse.json({ ok: false }, { status: 503 })
    return NextResponse.json({ ok: true })
  }
  const city = typeof b?.city === 'string' ? b.city : ''
  const school = Number(b?.school), score = Number(b?.score), right = Number(b?.right)
  const cls = typeof b?.cls === 'string' ? b.cls : ''
  const valid = NAMES.has(city) && Number.isInteger(school) && school >= 1 && school <= 999
    && /^(5|6|7|8|9|10|11)$/.test(cls) && Number.isInteger(right) && right >= 0 && right <= 10
    && Number.isInteger(score) && score >= 0 && score <= right * 260
  if (!valid) return NextResponse.json({ ok: false }, { status: 400 })

  const { error } = await getSupabaseAdmin().from('moia_ukraina_scores').insert({ city, school, cls, score, correct: right })
  if (error) return NextResponse.json({ ok: false }, { status: 503 })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('stats')) {
    const db = getSupabaseAdmin()
    const [g, s] = await Promise.all([
      db.from('moia_ukraina_plays').select('id', { count: 'exact', head: true }),
      db.from('moia_ukraina_rating').select('school', { count: 'exact', head: true }),
    ])
    if (g.error) return NextResponse.json({ ok: false }, { status: 503 })
    return NextResponse.json({ ok: true, stats: { games: g.count ?? 0, schools: s.count ?? 0 } }, { headers: { 'Cache-Control': 'no-store' } })
  }
  const { data, error } = await getSupabaseAdmin().from('moia_ukraina_rating').select('city, school, points, players').limit(200)
  if (error) return NextResponse.json({ ok: false }, { status: 503 })
  return NextResponse.json({ ok: true, rows: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}
