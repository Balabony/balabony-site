import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Фото і біографія автора: /api/author/profile
 *
 * Автор редагує тільки власний профіль — user_id береться з сесії, а не
 * з тіла запиту. Інакше достатньо було б підмінити одне поле, щоб
 * переписати чужу сторінку.
 *
 * Фото людини — персональні дані, і згода на публікацію текстів її не
 * покриває. Тому підтвердження обовʼязкове і фіксується в author_consents
 * окремим scope='photo': коли автор попросить прибрати фото, має бути
 * видно, коли і на що він погоджувався.
 */

const MAX_BYTES = 8 * 1024 * 1024
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_SIDE = 600
const MAX_BIO = 1200

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    const { data: profile } = await admin
      .from('author_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Профіль автора не знайдено' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file')
    const bioRaw = form.get('bio')
    const consent = String(form.get('photo_consent') ?? '')

    const update: Record<string, unknown> = {}

    // Біографію можна змінювати окремо від фото.
    if (typeof bioRaw === 'string') {
      const bio = bioRaw.trim().slice(0, MAX_BIO)
      update.bio = bio.length > 0 ? bio : null
    }

    if (file && typeof file !== 'string') {
      const blob = file as File

      if (consent !== 'yes') {
        return NextResponse.json(
          { error: 'Підтвердіть згоду на публікацію фото' },
          { status: 400 },
        )
      }
      if (!OK_TYPES.includes(blob.type)) {
        return NextResponse.json({ error: 'Лише JPG, PNG або WebP' }, { status: 400 })
      }
      if (blob.size > MAX_BYTES) {
        return NextResponse.json({ error: 'Файл більший за 8 МБ' }, { status: 400 })
      }

      const source = Buffer.from(await blob.arrayBuffer())
      let output: Buffer
      try {
        // Квадрат: портрет показується в круглій рамці, і прямокутне фото
        // там обрізалося б випадковим чином.
        output = await sharp(source)
          .rotate()
          .resize(AVATAR_SIDE, AVATAR_SIDE, { fit: 'cover', position: 'top' })
          .jpeg({ quality: 88 })
          .toBuffer()
      } catch {
        return NextResponse.json({ error: 'Не вдалося обробити зображення' }, { status: 400 })
      }

      const fileName = `avatars/${user.id}-${Date.now()}.jpg`

      const { error: upErr } = await admin.storage
        .from('covers')
        .upload(fileName, output, { contentType: 'image/jpeg', upsert: true })

      if (upErr) {
        return NextResponse.json({ error: `Сховище: ${upErr.message}` }, { status: 500 })
      }

      const { data: { publicUrl } } = admin.storage.from('covers').getPublicUrl(fileName)
      update.avatar_url = publicUrl

      // Слід згоди. Помилку тут не пропускаємо нагору: фото вже завантажене,
      // і валити весь запит через журнал було б гірше — але лишаємо в логах.
      const { error: consentErr } = await admin.from('author_consents').insert({
        author_id: user.id,
        scope: 'photo',
        status: 'given',
        channel: 'site',
      })
      if (consentErr) console.error('[author/profile] consent:', consentErr.message)
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Нічого не змінено' }, { status: 400 })
    }

    const { error: updErr } = await admin
      .from('author_profiles')
      .update(update)
      .eq('user_id', user.id)

    if (updErr) {
      return NextResponse.json({ error: `База: ${updErr.message}` }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      avatar_url: (update.avatar_url as string) ?? null,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Не вдалося зберегти' },
      { status: 500 },
    )
  }
}
