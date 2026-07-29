import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/** Опитування статусу сесії підпису. Клієнт питає раз на 3 секунди. */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ status: 'failed' }, { status: 401 })

  const sessionId = (req.nextUrl.searchParams.get('session') ?? '').trim()
  if (!sessionId) return NextResponse.json({ status: 'failed' }, { status: 400 })

  const r = await dbQuery(
    `select s.id, s.status, s.expires_at, c.signed_pdf_url, c.signature_url
       from signing_sessions s
       join author_contracts c on c.id = s.contract_id
      where s.id = $1 and s.author_id = $2
      limit 1`,
    [sessionId, user.id],
  )
  const row = r.rows[0] as
    | { status: string; expires_at: string; signed_pdf_url: string | null; signature_url: string | null }
    | undefined

  if (!row) return NextResponse.json({ status: 'failed' }, { status: 404 })

  if (row.status === 'pending' && new Date(row.expires_at).getTime() < Date.now()) {
    await dbQuery(`update signing_sessions set status = 'expired' where id = $1`, [sessionId])
    return NextResponse.json({ status: 'expired' })
  }

  return NextResponse.json({
    status: row.status,
    signedPdfUrl: row.signed_pdf_url,
    signatureUrl: row.signature_url,
  })
}
