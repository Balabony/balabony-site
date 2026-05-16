import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import sharp from 'sharp'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// Цільовий розмір картки на сайті
const TARGET_WIDTH  = 550   // 2x retina від 275
const TARGET_HEIGHT = 350   // 2x retina від 175

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as {
      sourceUrl: string
      crop: { x: number, y: number, width: number, height: number } // у пікселях оригіналу
      storyId?: string
    }

    if (!body.sourceUrl || !body.crop) {
      return NextResponse.json({ error: 'sourceUrl та crop обовʼязкові' }, { status: 400 })
    }

    // Завантажуємо оригінал
    const sourceResp = await fetch(body.sourceUrl)
    if (!sourceResp.ok) {
      return NextResponse.json({ error: 'Не вдалось завантажити оригінал' }, { status: 400 })
    }
    const sourceBuffer = Buffer.from(await sourceResp.arrayBuffer())

    // Перевіряємо реальні розміри (sharp видає метадані)
    const meta = await sharp(sourceBuffer).metadata()
    const imgW = meta.width || 0
    const imgH = meta.height || 0

    if (!imgW || !imgH) {
      return NextResponse.json({ error: 'Не вдалось зчитати розміри' }, { status: 400 })
    }

    // Округлюємо і обмежуємо crop межами фото
    const left   = Math.max(0, Math.min(imgW - 1, Math.round(body.crop.x)))
    const top    = Math.max(0, Math.min(imgH - 1, Math.round(body.crop.y)))
    const width  = Math.max(1, Math.min(imgW - left, Math.round(body.crop.width)))
    const height = Math.max(1, Math.min(imgH - top,  Math.round(body.crop.height)))

    // Обрізаємо + ресайз до 550×350 + JPEG quality 85
    const croppedBuffer = await sharp(sourceBuffer)
      .extract({ left, top, width, height })
      .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'cover' })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer()

    // Генеруємо назву файла
    const timestamp = Date.now()
    const idPart = body.storyId ? `story-${body.storyId}-` : 'cover-'
    const fileName = `${idPart}${timestamp}-crop.jpg`

    const supabase = getSupabaseAdmin()

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, croppedBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    const { data: pubData } = supabase.storage.from('covers').getPublicUrl(fileName)
    if (!pubData?.publicUrl) {
      return NextResponse.json({ error: 'Не вдалось отримати URL' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, url: pubData.publicUrl, fileName })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
