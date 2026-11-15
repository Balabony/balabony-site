import { NextRequest, NextResponse } from 'next/server'
import { autoCorrections } from '@/lib/ai-correct-auto'

/** Щогодинна підготовка ШІ-правок наперед (див. lib/ai-correct-auto.ts, з 15.11.2026). */

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
    return NextResponse.json({ ok: true, prepared: await autoCorrections() })
  } catch (err) {
    console.error('[cron ai-correct]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: (err as Error)?.message }, { status: 500 })
  }
}
