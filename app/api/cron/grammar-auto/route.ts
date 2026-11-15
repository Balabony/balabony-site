import { NextRequest, NextResponse } from 'next/server'
import { autoGrammarChecks } from '@/lib/grammar-auto'
import { autoGenres } from '@/lib/genre-auto'

/** Щогодинна ШІ-перевірка грамотності робіт перед редакторами (див. lib/grammar-auto.ts)
 *  і автоматичне проставлення жанру творам без жанру (lib/genre-auto.ts, з 15.11.2026). */

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
    // Жанри — першими і з власним коротким бюджетом: вони дешеві й швидкі, а перевірка
    // грамотності може забрати весь час. Помилка жанрів не зупиняє грамотність.
    let genres: string[] = []
    try { genres = await autoGenres(60_000) } catch (err) { console.error('[cron genre-auto]', (err as Error)?.message) }
    return NextResponse.json({ ok: true, genres, checked: await autoGrammarChecks(220_000) })
  } catch (err) {
    console.error('[cron grammar-auto]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: (err as Error)?.message }, { status: 500 })
  }
}
