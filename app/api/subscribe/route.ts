import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { Resend } from 'resend'

// In-memory rate limit: IP → [timestamps]
const rateMap = new Map<string, number[]>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 година

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (rateMap.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS)
  if (hits.length >= RATE_LIMIT) return true
  rateMap.set(ip, [...hits, now])
  return false
}

interface SubscribeBody {
  email?:   string
  consent?: boolean
  source?:  string
  website?: string // honeypot
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SubscribeBody

    // Honeypot — мовчазний дроп ботів
    if (body.website) return NextResponse.json({ ok: true })

    const email = (body.email ?? '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Невірний формат email' }, { status: 400 })
    }
    if (body.consent !== true) {
      return NextResponse.json({ error: 'Потрібна згода на отримання листів' }, { status: 400 })
    }

    const ip = getIP(req)
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Забагато спроб. Спробуйте трохи пізніше.' }, { status: 429 })
    }

    const token = crypto.randomUUID()
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('subscribers')
      .upsert(
        { email, consent: true, source: body.source ?? 'homepage', token },
        { onConflict: 'email' },
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Вітальний лист — не критично: якщо не відправиться, підписка все одно зберігається
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Балабони <contact@balabony.com>',
          to: email,
          subject: 'Вітаємо у Балабонах! 🌻',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b; line-height: 1.6;">
              <h2 style="color: #EF9F27;">Раді бачити вас у Балабонах!</h2>
              <p>Тепер ви першими дізнаватиметеся про нові серії та історії, отримуватимете квести-загадки від Діда Панаса (за відповіді — бали) та новини про подарункові сертифікати.</p>
              <p>До зустрічі в селі Балабони!</p>
              <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">Якщо ви не залишали свій email на balabony.com — просто проігноруйте цей лист.</p>
            </div>`,
        })
      } catch { /* лист не критичний */ }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
