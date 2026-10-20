import { NextRequest, NextResponse } from 'next/server'
import { autoStyleChecks } from '@/lib/contest-style-auto'

/**
 * Щогодинна автоматична перевірка «ознак ШІ» конкурсних робіт (див. lib/contest-style-auto.ts).
 * Запуск: Vercel Cron (vercel.json) або вручну з-під cookie адмінки.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  try {
    const done = await autoStyleChecks()
    return NextResponse.json({ ok: true, checked: done })
  } catch (err) {
    console.error('[cron contest-style]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: (err as Error)?.message }, { status: 500 })
  }
}
