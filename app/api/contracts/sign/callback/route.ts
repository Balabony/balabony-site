import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Callback від сервера підпису (не від Дії напряму).
 * Сервер з бібліотекою ІІТ отримує підпис автора, накладає КЕП ФОПа
 * на той самий хеш і повідомляє сюди результат.
 */

const SIGN_SERVICE_TOKEN = (process.env.SIGN_SERVICE_TOKEN ?? '').trim()

type CallbackBody = {
  sessionId?: string
  status?: string
  signedPdfUrl?: string
  signatureUrl?: string
  error?: string
}

export async function POST(req: NextRequest) {
  if (!SIGN_SERVICE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'not configured' }, { status: 503 })
  }
  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${SIGN_SERVICE_TOKEN}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let body: CallbackBody
  try {
    body = (await req.json()) as CallbackBody
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 })
  }

  const sessionId = (body.sessionId ?? '').trim()
  if (!sessionId) return NextResponse.json({ ok: false, error: 'no session' }, { status: 400 })

  const r = await dbQuery(
    `select contract_id from signing_sessions where id = $1 limit 1`,
    [sessionId],
  )
  const row = r.rows[0] as { contract_id: string } | undefined
  if (!row) return NextResponse.json({ ok: false, error: 'unknown session' }, { status: 404 })

  if (body.status === 'signed') {
    await dbQuery(`update signing_sessions set status = 'signed' where id = $1`, [sessionId])
    await dbQuery(
      `update author_contracts
          set status = 'signed', signed_at = now(),
              signed_pdf_url = coalesce($1, signed_pdf_url),
              signature_url  = coalesce($2, signature_url)
        where id = $3`,
      [body.signedPdfUrl ?? null, body.signatureUrl ?? null, row.contract_id],
    )
  } else {
    await dbQuery(
      `update signing_sessions set status = 'failed', error = $1 where id = $2`,
      [body.error ?? 'declined', sessionId],
    )
  }

  return NextResponse.json({ ok: true })
}
