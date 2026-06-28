// app/api/admin/tysha-upload-cover/route.ts
// Завантаження ВЛАСНОГО фото як обкладинки «Тиші».
//   - приймає multipart/form-data з полем `file` (image/*)
//   - кладе у Supabase Storage bucket `covers` (той самий, що й AI-обкладинки)
//   - повертає стабільний publicUrl
//   - опційно: якщо переданий `episode_id`, одразу присвоює cover_url цій серії
// Доступ — лише адмін (cookie admin_session === ADMIN_PASSWORD), як в інших tysha-роутах.
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

const MAX_BYTES = 8 * 1024 * 1024 // 8 МБ
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const form = await req.formData()
    const file = form.get('file')
    const episodeId = form.get('episode_id')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Немає файлу' }, { status: 400 })
    }
    const blob = file as File
    if (!OK_TYPES.includes(blob.type)) {
      return NextResponse.json({ error: 'Лише JPG, PNG або WebP' }, { status: 400 })
    }
    if (blob.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Файл більший за 8 МБ' }, { status: 400 })
    }

    const buffer = Buffer.from(await blob.arrayBuffer())
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
    const fileName = `tysha-own/cover-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`

    const supabase = getSupabaseAdmin()
    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(fileName, buffer, { contentType: blob.type, upsert: true })
    if (upErr) {
      return NextResponse.json({ error: `Storage: ${upErr.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    // Якщо передано серію — одразу присвоюємо обкладинку.
    let assigned = false
    if (episodeId && typeof episodeId === 'string') {
      const { error: assignErr } = await supabase
        .from('content')
        .update({ cover_url: publicUrl })
        .eq('id', episodeId)
        .eq('type', 'tysha')
      assigned = !assignErr
    }

    return NextResponse.json({ ok: true, url: publicUrl, assigned })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
