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
  const city = typeof b?.city === 'string' ? b.city : ''
  const school = Number(b?.school), score = Number(b?.score), right = Number(b?.right)
  const cls = typeof b?.cls === 'string' ? b.cls : ''
  const valid = NAMES.has(city) && Number.isInteger(school) && school >= 1 && school <= 999
    && /^(5|6|7|8|9|10|11)$/.test(cls) && Number.isInteger(right) && right >= 0 && right <= 10
    && Number.isInteger(score) && score >= 0 && score <= right * 200
  if (!valid) return NextResponse.json({ ok: false }, { status: 400 })

  const { error } = await getSupabaseAdmin().from('moia_ukraina_scores').insert({ city, school, cls, score, correct: right })
  if (error) return NextResponse.json({ ok: false }, { status: 503 })
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const { data, error } = await getSupabaseAdmin().from('moia_ukraina_rating').select('city, school, points, players').limit(200)
  if (error) return NextResponse.json({ ok: false }, { status: 503 })
  return NextResponse.json({ ok: true, rows: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}
