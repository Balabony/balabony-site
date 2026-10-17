import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Вступ до Клубу Балабонів (17.10.2026).
 * Пише в klub_members і заодно підписує на розсилку (subscribers, source 'klub'),
 * бо головна перевага клубу — щотижневий лист.
 */
const hits = new Map<string, number[]>()
function limited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000)
  arr.push(now)
  hits.set(ip, arr)
  return arr.length > 8
}

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as { name?: string; email?: string; role?: string; consent?: boolean; website?: string; source?: string }
    if (b.website) return NextResponse.json({ ok: true }) // honeypot
    const name = String(b.name ?? '').trim().slice(0, 80)
    const email = String(b.email ?? '').trim().toLowerCase().slice(0, 160)
    const role = ['reader', 'author', 'both'].includes(String(b.role)) ? String(b.role) : 'reader'
    if (name.length < 2) return NextResponse.json({ ok: false, error: 'Вкажіть, як до вас звертатися' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: 'Перевірте адресу пошти' }, { status: 400 })
    if (b.consent !== true) return NextResponse.json({ ok: false, error: 'Потрібна згода на листи клубу' }, { status: 400 })
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (limited(ip)) return NextResponse.json({ ok: false, error: 'Забагато спроб. Спробуйте пізніше.' }, { status: 429 })

    const res = await dbQuery(
      `insert into klub_members (name, email, role, source)
       values ($1, $2, $3, $4)
       on conflict (email) do update set name = excluded.name, role = excluded.role
       returning (xmax = 0) as is_new`,
      [name, email, role, b.source ? String(b.source).slice(0, 100) : null],
    )
    const isNew = Boolean(res.rows[0]?.is_new)

    try {
      await getSupabaseAdmin().from('subscribers').upsert(
        { email, consent: true, source: 'klub', token: crypto.randomUUID() },
        { onConflict: 'email', ignoreDuplicates: true },
      )
    } catch { /* розсилка не критична */ }

    return NextResponse.json({ ok: true, isNew })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти. Спробуйте ще раз.' }, { status: 500 })
  }
}
