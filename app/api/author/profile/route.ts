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
 *
 * Оригінал зберігається поруч з обрізаним (avatar_source_url). Спершу
 * зберігався тільки квадрат, і через це зсунути кадр було неможливо —
 * доводилося завантажувати фото наново. Тепер положення (avatar_position,
 * 0–100) можна змінювати окремо: обрізаємо з оригіналу.
 */

const MAX_BYTES = 8 * 1024 * 1024
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_SIDE = 600
const MAX_BIO = 1200

/**
 * Квадрат із заданим положенням. pos 0 — верхній край (для портретів),
 * 50 — центр, 100 — нижній. Рахуємо так само, як CSS object-position,
 * щоб прев'ю в кабінеті збігалося з тим, що збережеться.
 */
async function cropSquare(source: Buffer, pos: number): Promise<Buffer> {
  const img = sharp(source).rotate()
  const meta = await img.metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0

  if (!w || !h) throw new Error('no metadata')

  const side = Math.min(w, h)
  const k = Math.min(100, Math.max(0, pos)) / 100

  const left = Math.round((w - side) * k)
  const top = Math.round((h - side) * k)

  return img
    .extract({ left, top, width: side, height: side })
    .resize(AVATAR_SIDE, AVATAR_SIDE, { fit: 'cover' })
    .jpeg({ quality: 88 })
    .toBuffer()
}

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
      .select('user_id, avatar_source_url, avatar_position')
      .eq('user_id', user.id)
      .maybeSingle() as {
        data: { user_id: string; avatar_source_url: string | null; avatar_position: number | null } | null
      }

    if (!profile) {
      return NextResponse.json({ error: 'Профіль автора не знайдено' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file')
    const bioRaw = form.get('bio')
    const consent = String(form.get('photo_consent') ?? '')
    const posRaw = form.get('avatar_position')
    const hideRaw = form.get('hide_from_directory')

    const update: Record<string, unknown> = {}

    // Прапорець «не показувати в каталозі». Приходить лише з редактора
    // профілю; інші виклики його не надсилають і поле не чіпається.
    if (typeof hideRaw === 'string' && hideRaw !== '') {
      update.hide_from_directory = hideRaw === 'yes'
    }

    // Біографію можна змінювати окремо від фото.
    if (typeof bioRaw === 'string') {
      const bio = bioRaw.trim().slice(0, MAX_BIO)
      update.bio = bio.length > 0 ? bio : null
    }

    // Положення кадру. Приходить не завжди — біографію можна правити окремо.
    let position: number | null = null
    if (typeof posRaw === 'string' && posRaw.trim() !== '') {
      const n = Number(posRaw)
      if (Number.isFinite(n)) position = Math.min(100, Math.max(0, Math.round(n)))
    }

    const hasFile = file && typeof file !== 'string'

    if (hasFile) {
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
      const pos = position ?? 50

      let output: Buffer
      let original: Buffer
      try {
        output = await cropSquare(source, pos)
        // Оригінал кладемо приведеним до розумного розміру: повний файл на
        // 8 МБ у сховищі не потрібен, а 1400 px вистачає, щоб переобрізати.
        original = await sharp(source)
          .rotate()
          .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toBuffer()
      } catch {
        return NextResponse.json({ error: 'Не вдалося обробити зображення' }, { status: 400 })
      }

      const stamp = Date.now()
      const fileName = `avatars/${user.id}-${stamp}.jpg`
      const srcName = `avatars/src-${user.id}-${stamp}.jpg`

      const { error: upErr } = await admin.storage
        .from('covers')
        .upload(fileName, output, { contentType: 'image/jpeg', upsert: true })

      if (upErr) {
        return NextResponse.json({ error: `Сховище: ${upErr.message}` }, { status: 500 })
      }

      const { error: srcErr } = await admin.storage
        .from('covers')
        .upload(srcName, original, { contentType: 'image/jpeg', upsert: true })

      if (srcErr) console.error('[author/profile] source:', srcErr.message)

      const { data: { publicUrl } } = admin.storage.from('covers').getPublicUrl(fileName)
      update.avatar_url = publicUrl
      update.avatar_position = pos

      if (!srcErr) {
        const { data: { publicUrl: srcUrl } } = admin.storage.from('covers').getPublicUrl(srcName)
        update.avatar_source_url = srcUrl
      }

      // Слід згоди. Помилку тут не пропускаємо нагору: фото вже завантажене,
      // і валити весь запит через журнал було б гірше — але лишаємо в логах.
      const { error: consentErr } = await admin.from('author_consents').insert({
        author_id: user.id,
        scope: 'photo',
        status: 'given',
        channel: 'site',
      })
      if (consentErr) console.error('[author/profile] consent:', consentErr.message)

    } else if (position !== null && position !== (profile.avatar_position ?? 50)) {
      // Нового файлу немає, але кадр просять зсунути. Беремо збережений
      // оригінал і ріжемо наново. Якщо оригіналу немає (фото залите до цієї
      // зміни) — чесно кажемо, що треба завантажити ще раз.
      if (!profile.avatar_source_url) {
        return NextResponse.json(
          { error: 'Щоб посунути кадр, завантажте фото ще раз — оригінал не збережено' },
          { status: 400 },
        )
      }

      let output: Buffer
      try {
        const resp = await fetch(profile.avatar_source_url, { cache: 'no-store' })
        if (!resp.ok) throw new Error('fetch failed')
        const source = Buffer.from(await resp.arrayBuffer())
        output = await cropSquare(source, position)
      } catch {
        return NextResponse.json(
          { error: 'Не вдалося перечитати оригінал. Завантажте фото ще раз' },
          { status: 400 },
        )
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
      update.avatar_position = position
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
      avatar_position: (update.avatar_position as number) ?? null,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Не вдалося зберегти' },
      { status: 500 },
    )
  }
}
