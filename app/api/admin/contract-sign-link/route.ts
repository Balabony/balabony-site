// 08.11.2026: адмінка — персональне посилання на підпис договору для автора (без входу в кабінет), діє 21 день.
import { NextRequest, NextResponse } from 'next/server'
import { signLinkUrl } from '@/lib/contract/sign-link'

export const dynamic = 'force-dynamic'
function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  let b: { authorId?: string }
  try { b = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 }) }
  const id = String(b.authorId || '').trim()
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, error: 'Невірний автор' }, { status: 400 })
  return NextResponse.json({ ok: true, url: signLinkUrl(id) })
}
