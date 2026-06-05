import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Обкладинка зберігається з завантаженого фото БЕЗ ШІ-генерації —
// так нема артефактів (криві руки тощо). Лише нормалізуємо розмір і якість.
export async function POST(req: NextRequest) {
  try {
    const { storyId, photoBase64 } = await req.json()

    if (!storyId || !photoBase64) {
      return NextResponse.json({ error: 'storyId and photoBase64 required' }, { status: 400 })
    }

    // Прибираємо префікс data:image/...;base64, якщо він є
    const b64 = typeof photoBase64 === 'string' && photoBase64.includes(',')
      ? photoBase64.split(',')[1]
      : photoBase64
    const rawBuffer = Buffer.from(b64, 'base64')

    const finalBuffer = await sharp(rawBuffer)
      .resize(1024, 1024, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 92 })
      .toBuffer()

    const supabase = getSupabaseAdmin()
    const fileName = `story-${storyId}-${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, finalBuffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)
    return NextResponse.json({ url: publicUrl, fileName })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
