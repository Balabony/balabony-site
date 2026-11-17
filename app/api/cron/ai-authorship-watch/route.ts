import { NextRequest, NextResponse } from 'next/server'
import { runAiAuthorshipWatch } from '@/lib/ai-authorship-watch'

/**
 * Щогодинний нагляд за ШІ-авторством (17.11.2026): перевірка свіжих звичайних творів
 * і лист на nazar@balabony.com, коли обидві системи ≥ 50 (див. lib/ai-authorship-watch.ts).
 * Запуск: Vercel Cron (vercel.json) або вручну з-під cookie адмінки.
 */

export const runtime = 'nodejs'
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
    return NextResponse.json({ ok: true, ...(await runAiAuthorshipWatch()) })
  } catch (err) {
    console.error('[cron ai-authorship-watch]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: (err as Error)?.message }, { status: 500 })
  }
}
