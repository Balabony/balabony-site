import { NextRequest, NextResponse } from 'next/server'
import { REF_COOKIE, REF_COOKIE_OPTIONS, normalizeCode } from '@/lib/referral'

/**
 * Запам'ятати, за чиїм кодом прийшла людина: /api/referral/capture
 *
 * Викликається з ReferralCapture, коли в адресі є ?ref=. Cookie ставимо на
 * сервері й HttpOnly — щоб код не можна було підмінити з консолі браузера.
 *
 * Перший код виграє: якщо cookie вже стоїть, не перезаписуємо. Інакше той,
 * хто поділився останнім, забирав би чужого читача.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const code = normalizeCode(String(body?.code ?? ''))
    if (code.length < 4) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const existing = req.cookies.get(REF_COOKIE)?.value
    if (existing) {
      return NextResponse.json({ ok: true, kept: true })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set(REF_COOKIE, code, REF_COOKIE_OPTIONS)
    return res
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
