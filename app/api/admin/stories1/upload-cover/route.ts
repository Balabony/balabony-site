import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const storyId = formData.get('storyId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Файл не передано' }, { status: 400 })
    }

    // Перевірка розміру (макс 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Файл занадто великий (макс 5 МБ)' }, { status: 400 })
    }

    // Перевірка типу
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Потрібен файл зображення' }, { status: 400 })
    }

    // Генеруємо безпечну назву файлу (тільки латиниця, без пробілів)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
    const timestamp = Date.now()
    const idPart = storyId ? `story-${storyId}-` : 'cover-'
    const fileName = `${idPart}${timestamp}.${safeExt}`

    // Конвертуємо File → ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const supabase = getSupabaseAdmin()

    // Заливаємо в bucket "covers"
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    // Отримуємо публічний URL
    const { data: pubData } = supabase.storage.from('covers').getPublicUrl(fileName)

    if (!pubData?.publicUrl) {
      return NextResponse.json({ error: 'Не вдалось отримати URL' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, url: pubData.publicUrl, fileName })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
