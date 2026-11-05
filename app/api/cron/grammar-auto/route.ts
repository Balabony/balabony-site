import { NextRequest, NextResponse } from 'next/server'
import { autoGrammarChecks } from '@/lib/grammar-auto'

/** Щогодинна ШІ-перевірка грамотності робіт перед редакторами (див. lib/grammar-auto.ts). */

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
    return NextResponse.json({ ok: true, checked: await autoGrammarChecks() })
  } catch (err) {
    console.error('[cron grammar-auto]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: (err as Error)?.message }, { status: 500 })
  }
}
