import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { dbQuery } from '@/lib/db'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Обкладинка конкурсної роботи (14.10.2026): /api/admin/contest-cover
 *
 * Автор надсилає власну обкладинку листом — засновник завантажує її тут,
 * на сторінці «Оцінки конкурсів». Файл зберігається в сховищі `covers`,
 * посилання — в contest_entries.cover_url. Щоб обкладинка не загубилася:
 *  - якщо серії вже прийнято в content — ставимо її всім серіям одразу;
 *  - якщо ні — /api/admin/konkursy підставить її під час приймання.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 8 * 1024 * 1024
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIDE = 1600

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const form = await req.formData()
    const entryId = String(form.get('entryId') ?? '').trim()
    const file = form.get('file')
    if (!entryId) return NextResponse.json({ ok: false, error: 'Не вказано заявку' }, { status: 400 })
    if (!file || typeof file === 'string') return NextResponse.json({ ok: false, error: 'Оберіть файл зображення' }, { status: 400 })
    const blob = file as File
    if (!OK_TYPES.includes(blob.type)) return NextResponse.json({ ok: false, error: 'Лише JPG, PNG або WebP' }, { status: 400 })
    if (blob.size > MAX_BYTES) return NextResponse.json({ ok: false, error: 'Файл більший за 8 МБ' }, { status: 400 })

    const found = await dbQuery(`select id::text from contest_entries where id::text = $1`, [entryId])
    if (!found.rowCount) return NextResponse.json({ ok: false, error: 'Заявку не знайдено' }, { status: 404 })

    let output: Buffer
    try {
      output = await sharp(Buffer.from(await blob.arrayBuffer()))
        .rotate()
        .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 86 })
        .toBuffer()
    } catch {
      return NextResponse.json({ ok: false, error: 'Не вдалося обробити зображення' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const fileName = `contest/${entryId}-${Date.now()}.jpg`
    const { error: upErr } = await admin.storage.from('covers').upload(fileName, output, { contentType: 'image/jpeg', upsert: true })
    if (upErr) return NextResponse.json({ ok: false, error: `Сховище: ${upErr.message}` }, { status: 500 })
    const { data: { publicUrl } } = admin.storage.from('covers').getPublicUrl(fileName)

    await dbQuery(`update contest_entries set cover_url = $2, updated_at = now() where id::text = $1`, [entryId, publicUrl])
    const upd = await dbQuery(
      `update content set cover_url = $2, cover_position = 'center'
        where id in (select content_id from contest_episodes where entry_id::text = $1 and content_id is not null)`,
      [entryId, publicUrl],
    )
    return NextResponse.json({ ok: true, cover_url: publicUrl, applied: upd.rowCount ?? 0 })
  } catch (err) {
    console.error('[contest-cover]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти обкладинку. Чи додано колонку cover_url?' }, { status: 500 })
  }
}
