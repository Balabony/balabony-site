import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// In-memory rate limit: IP → [timestamps]
const rateMap = new Map<string, number[]>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

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

    const { name, email, topic, message } = body

    if (!name || !email || !topic || !message) {
      return NextResponse.json({ error: 'Заповніть усі поля' }, { status: 400 })
    }

    // Basic email format check
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
      from: 'Balabony Contact <contact@balabony.com>',
      to: 'nazar@balabony.com',
      replyTo: email,
      subject: `[${topic}] від ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
          <h2 style="color: #ef9f27; border-bottom: 2px solid #ef9f27; padding-bottom: 8px;">
            Нове повідомлення з сайту Balabony
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; font-weight: bold; width: 120px;">Ім'я:</td><td style="padding: 8px;">${name}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Тема:</td><td style="padding: 8px;">${topic}</td></tr>
          </table>
          <div style="background: #f8fafc; border-left: 4px solid #ef9f27; padding: 16px; border-radius: 4px;">
            <strong>Повідомлення:</strong><br/><br/>
            ${message.replace(/\n/g, '<br/>')}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Надіслано з форми зворотного зв'язку balabony.com
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }
}
