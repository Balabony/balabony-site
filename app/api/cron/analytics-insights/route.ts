import { NextRequest, NextResponse } from 'next/server'
import { makeWeeklyInsight } from '@/lib/analytics-insights'

/** Щотижневі висновки ШІ з аналітики (понеділок, див. vercel.json). Вручну — з-під cookie адмінки. */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true
  if (!secret && (req.headers.get('user-agent') ?? '').startsWith('vercel-cron/')) return true
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  try {
    const text = await makeWeeklyInsight()
    // Запуск із кнопки в адмінці — повертаємо на сторінку звіту.
    if (req.nextUrl.searchParams.get('back')) return NextResponse.redirect(new URL('/admin/dzherela', req.url), 303)
    return NextResponse.json({ ok: true, chars: text.length })
  } catch (err) {
    console.error('[cron analytics-insights]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: (err as Error)?.message }, { status: 500 })
  }
}
