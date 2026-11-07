// 07.11.2026: редакція ставить фото профілю автору, який надіслав його поштою (сам не зміг завантажити).
// Фото обрізається квадратом за позицією (0 — верх/ліво, 50 — центр, 100 — низ/право), як у кабінеті.
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { dbQuery } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const fd = await req.formData()
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const file = fd.get('file')
  const pos = Math.min(100, Math.max(0, Number(fd.get('position') ?? 50) || 0))
  if (!email || !file || typeof file === 'string') return NextResponse.json({ error: 'Потрібні пошта автора й фото' }, { status: 400 })

  const r = await dbQuery(
    `select p.user_id from author_profiles p join auth.users u on u.id = p.user_id where lower(u.email) = $1 limit 1`, [email])
  const userId = (r.rows[0] as { user_id: string } | undefined)?.user_id
  if (!userId) return NextResponse.json({ error: 'Автора з такою поштою не знайдено' }, { status: 404 })

  let output: Buffer, original: Buffer
  try {
    const src = Buffer.from(await (file as File).arrayBuffer())
    const img = sharp(src).rotate()
    const m = await img.metadata()
    const w = m.width ?? 0, h = m.height ?? 0
    if (!w || !h) throw new Error('meta')
    const side = Math.min(w, h), k = pos / 100
    output = await img.extract({ left: Math.round((w - side) * k), top: Math.round((h - side) * k), width: side, height: side })
      .resize(600, 600, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer()
    original = await sharp(src).rotate().resize(1400, 1400, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer()
  } catch {
    return NextResponse.json({ error: 'Не вдалося обробити зображення' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const stamp = Date.now()
  const name = `avatars/${userId}-${stamp}.jpg`, srcName = `avatars/src-${userId}-${stamp}.jpg`
  const up = await admin.storage.from('covers').upload(name, output, { contentType: 'image/jpeg', upsert: true })
  if (up.error) return NextResponse.json({ error: `Сховище: ${up.error.message}` }, { status: 500 })
  await admin.storage.from('covers').upload(srcName, original, { contentType: 'image/jpeg', upsert: true })
  const url = admin.storage.from('covers').getPublicUrl(name).data.publicUrl
  const srcUrl = admin.storage.from('covers').getPublicUrl(srcName).data.publicUrl

  await dbQuery(`update author_profiles set avatar_url = $2, avatar_position = $3, avatar_source_url = $4 where user_id = $1`,
    [userId, url, pos, srcUrl])
  // Автор надіслав фото сам — фіксуємо згоду з позначкою, що через пошту.
  await admin.from('author_consents').insert({ author_id: userId, scope: 'photo', status: 'given', channel: 'email' })
  return NextResponse.json({ ok: true, url })
}
