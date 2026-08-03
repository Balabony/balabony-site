// app/api/admin/cover-upload/route.ts
//
// Заміна обкладинки будь-якого твору — для екрана «Кадр обкладинки».
// Приймає файл або посилання на зображення, кладе у Supabase Storage
// (bucket `covers`) і присвоює твору.
//
// Старий файл не видаляємо: якщо заміна виявиться невдалою, попередня
// обкладинка лишається в сховищі й на неї можна повернутися.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

const MAX_BYTES = 8 * 1024 * 1024
const OK_TYPES  = ['image/jpeg', 'image/png', 'image/webp']

function extFor(type: string): string {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const form      = await req.formData()
    const contentId = form.get('content_id')
    const file      = form.get('file')
    const fromUrl   = form.get('source_url')

    if (!contentId || typeof contentId !== 'string') {
      return NextResponse.json({ error: 'Не вказано твір' }, { status: 400 })
    }

    let buffer: Buffer
    let mime: string

    if (file && typeof file !== 'string') {
      const blob = file as File
      if (!OK_TYPES.includes(blob.type)) {
        return NextResponse.json({ error: 'Лише JPG, PNG або WebP' }, { status: 400 })
      }
      if (blob.size > MAX_BYTES) {
        return NextResponse.json({ error: 'Файл більший за 8 МБ' }, { status: 400 })
      }
      buffer = Buffer.from(await blob.arrayBuffer())
      mime   = blob.type
    } else if (fromUrl && typeof fromUrl === 'string' && /^https?:\/\//i.test(fromUrl)) {
      const resp = await fetch(fromUrl)
      if (!resp.ok) {
        return NextResponse.json({ error: 'Не вдалось завантажити за посиланням' }, { status: 400 })
      }
      mime = resp.headers.get('content-type') ?? ''
      if (!OK_TYPES.includes(mime)) {
        return NextResponse.json({ error: 'За посиланням не зображення JPG, PNG чи WebP' }, { status: 400 })
      }
      const bytes = Buffer.from(await resp.arrayBuffer())
      if (bytes.byteLength > MAX_BYTES) {
        return NextResponse.json({ error: 'Зображення більше за 8 МБ' }, { status: 400 })
      }
      buffer = bytes
    } else {
      return NextResponse.json({ error: 'Потрібен файл або посилання на зображення' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const fileName = `replaced/${contentId}-${Date.now()}.${extFor(mime)}`

    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(fileName, buffer, { contentType: mime, upsert: true })
    if (upErr) {
      return NextResponse.json({ error: `Сховище: ${upErr.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    // Нове фото — новий кадр, тож попереднє положення скидаємо:
    // зсув від старої картинки на новій майже завжди виглядає навмання.
    const { error: updErr } = await supabase
      .from('content')
      .update({ cover_url: publicUrl, cover_position: 'center' })
      .eq('id', contentId)
    if (updErr) {
      return NextResponse.json({ error: `База: ${updErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, cover_url: publicUrl })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Не вдалось замінити фото' },
      { status: 500 },
    )
  }
}
