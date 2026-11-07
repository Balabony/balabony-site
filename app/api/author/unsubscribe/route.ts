// 07.11.2026: відписка автора від листів редакції за посиланням із листа.
// GET — людина натиснула посилання; POST — поштовий сервіс (Gmail тощо) за List-Unsubscribe-Post.
import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { checkUnsubToken } from '@/lib/unsub-token'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f-]{36}$/i

async function optOut(req: Request): Promise<boolean> {
  const u = new URL(req.url)
  const id = u.searchParams.get('u') ?? '', t = u.searchParams.get('t') ?? ''
  if (!UUID.test(id) || !checkUnsubToken(id, t)) return false
  await dbQuery(`update author_profiles set newsletter_opt_out = true where user_id = $1`, [id])
  return true
}

function page(ok: boolean) {
  const body = ok
    ? `<h1>Ви відписалися від листів редакції</h1><p>Більше не надсилатимемо вам розсилок. Важливі листи про ваші твори й договір (якщо такі будуть) — окремо.</p><p>Передумали? Увімкнути листи знову можна в кабінеті автора, розділ «Листи від редакції».</p>`
    : `<h1>Посилання не спрацювало</h1><p>Можливо, воно пошкоджене. Відпишіться в кабінеті автора (розділ «Листи від редакції») або напишіть на nazar@balabony.com.</p>`
  return new NextResponse(`<!DOCTYPE html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Балабони — відписка</title></head><body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px 16px"><main style="max-width:560px;margin:0 auto;line-height:1.6">${body}<p><a href="https://balabony.com/author/dashboard" style="color:#ef9f27">Кабінет автора</a> · <a href="https://balabony.com" style="color:#ef9f27">Балабони</a></p></main></body></html>`,
    { status: ok ? 200 : 400, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

export async function GET(req: Request) {
  try { return page(await optOut(req)) } catch { return page(false) }
}

export async function POST(req: Request) {
  try { return NextResponse.json({ ok: await optOut(req) }) } catch { return NextResponse.json({ ok: false }, { status: 500 }) }
}
