import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { dbQuery } from '@/lib/db'
import { EDITOR_COOKIE, SESSION_DAYS } from '@/lib/editor-auth'

/**
 * GET  /api/editor/session?token=…  — перехід за посиланням із листа.
 * POST /api/editor/session          — вихід із кабінету.
 *
 * ОДНОРАЗОВІСТЬ. Токен приймається лише поки token_used_at порожній.
 * Після обміну рядок переписується: посилання з листа більше не працює,
 * а cookie отримує окремий session_token. Пересланий комусь лист після
 * першого переходу вже нічого не відкриває.
 */

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://balabony.com'
  const token = req.nextUrl.searchParams.get('token')

  const fail = (reason: string) =>
    NextResponse.redirect(`${site}/editor/login?error=${reason}`)

  if (!token) return fail('no-token')

  try {
    const found = await dbQuery(
      `select id, editor_id
         from editor_sessions
        where token = $1
          and token_used_at is null
          and expires_at > now()
        limit 1`,
      [token],
    )
    if (!found.rowCount) return fail('expired')

    const row = found.rows[0] as { id: string; editor_id: number }

    const sessionToken = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

    await dbQuery(
      `update editor_sessions
          set token_used_at = now(),
              session_token = $2,
              expires_at    = $3
        where id = $1`,
      [row.id, sessionToken, expires.toISOString()],
    )

    const res = NextResponse.redirect(`${site}/editor`)
    res.cookies.set(EDITOR_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_DAYS * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    })
    return res
  } catch (err) {
    console.error('[editor/session]', (err as Error)?.message)
    return fail('server')
  }
}

/** Вихід: гасимо сесію в базі, щоб cookie з іншого пристрою теж не працювала. */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(EDITOR_COOKIE)?.value
  if (token) {
    await dbQuery(
      `update editor_sessions set expires_at = now() where session_token = $1`,
      [token],
    ).catch(() => {})
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(EDITOR_COOKIE)
  return res
}
