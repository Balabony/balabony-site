import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// In-memory rate limit: IP → [timestamps]
const rateMap = new Map<string, number[]>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// Екранування: значення з форми потрапляють у HTML листа
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Honeypot check
    if (body.website) {
      return NextResponse.json({ ok: true }) // silent drop
    }

    const { name, email, workTitle, workType, volume, voiceGender, voiceAge, comment } = body

    if (!name || !email || !workTitle || !comment) {
      return NextResponse.json({ error: "Заповніть обов'язкові поля" }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Невірний формат email' }, { status: 400 })
    }

    const ip = getIP(req)
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Забагато запитів. Спробуйте пізніше.' },
        { status: 429 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Balabony Narration <contact@balabony.com>',
      to: 'admin@balabony.com',
      replyTo: email,
      subject: `[Озвучення] Заявка від ${String(name).slice(0, 80)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
          <h2 style="color: #ef9f27; border-bottom: 2px solid #ef9f27; padding-bottom: 8px;">
            Нова заявка на озвучення
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; font-weight: bold; width: 140px;">Ім'я:</td><td style="padding: 8px;">${esc(name)}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Назва твору:</td><td style="padding: 8px;">${esc(workTitle)}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Тип:</td><td style="padding: 8px;">${esc(workType) || '—'}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Обсяг:</td><td style="padding: 8px;">${esc(volume) || '—'}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Голос:</td><td style="padding: 8px;">${esc(voiceGender) || '—'}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Вік голосу:</td><td style="padding: 8px;">${esc(voiceAge) || '—'}</td></tr>
          </table>
          ${comment ? `<div style="background: #f8fafc; border-left: 4px solid #ef9f27; padding: 16px; border-radius: 4px;">
            <strong>Побажання до озвучення:</strong><br/><br/>
            ${esc(comment).replace(/\n/g, '<br/>')}
          </div>` : ''}
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Надіслано з форми «Замовити озвучення» balabony.com
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Narration order error:', err)
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }
}
