import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'

/**
 * Заявка на пільговий тариф із ручною перевіркою документа.
 *
 * Навіщо окремо від /api/diia/validate: цивільну інвалідність Дія
 * валідувати не вміє — окремого типу документа немає (підтверджено
 * підтримкою Дії 24.07.2026). Тому людина позначає статус сама,
 * пільга вмикається ОДРАЗУ, а скан перевіряє редактор.
 *
 * У БД не потрапляє ні діагноз, ні група, ні ПІБ — лише категорія
 * і шлях до файлу, який видаляється після рішення редактора.
 */

const TABLE = 'benefit_status'
const BUCKET = 'benefit-docs'

const MAX_BYTES = 15 * 1024 * 1024 // 15 МБ — сучасні телефони знімають важко

// Тип → розширення для збереження.
// HEIC/HEIF обов'язково: айфони знімають саме так за замовчуванням.
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'application/pdf': 'pdf',
}

// Запасний шлях: частина телефонів і месенджерів надсилає файл
// узагалі без типу або як application/octet-stream. Тоді дивимось
// на розширення — інакше людина з нормальним фото дістає відмову.
const EXT_OK: Record<string, string> = {
  jpg: 'jpg', jpeg: 'jpg', jpe: 'jpg',
  png: 'png',
  webp: 'webp',
  heic: 'heic', heif: 'heif',
  gif: 'gif',
  bmp: 'bmp',
  tif: 'tiff', tiff: 'tiff',
  pdf: 'pdf',
}

/** Повертає розширення для збереження або null, якщо формат не підходить. */
function resolveExt(file: File): string | null {
  const byMime = MIME_EXT[file.type?.toLowerCase() ?? '']
  if (byMime) return byMime

  const dot = file.name.lastIndexOf('.')
  if (dot === -1) return null
  const ext = file.name.slice(dot + 1).toLowerCase()
  return EXT_OK[ext] ?? null
}

// Категорії, доступні через ручну перевірку.
// ВПО і УБД сюди не входять — вони підтверджуються Дією за секунду.
const MANUAL_CATEGORIES = new Set(['disability'])

export async function POST(req: NextRequest) {
  try {
    // 1. Тільки для авторизованих
    const supaAuth = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supaAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })
    }

    // 2. Розбір форми
    const form = await req.formData()
    const category = String(form.get('category') ?? '')
    const file = form.get('document')

    if (!MANUAL_CATEGORIES.has(category)) {
      return NextResponse.json({ error: 'Невідома категорія' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Додайте фото або скан документа' }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Файл порожній' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Файл завеликий — до 15 МБ. Спробуйте зменшити якість фото.' },
        { status: 400 },
      )
    }

    const ext = resolveExt(file)
    if (!ext) {
      return NextResponse.json(
        { error: 'Підійде фото з телефона (JPG, PNG, HEIC) або PDF' },
        { status: 400 },
      )
    }

    const admin = getSupabaseAdmin()

    // 3. Чи немає вже заявки на розгляді
    const { data: existing } = await admin
      .from(TABLE)
      .select('review_status, document_path')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.review_status === 'pending') {
      return NextResponse.json(
        { error: 'Ваша заявка вже на розгляді. Ми повідомимо про результат.' },
        { status: 409 },
      )
    }

    // 4. Файл у приватне сховище.
    // Ім'я унікальне гарантовано: id користувача + час + випадкова частина.
    // Без випадкової частини два запити в одну мілісекунду дали б колізію,
    // а upsert:false відхилив би другий.
    const unique = crypto.randomUUID().slice(0, 8)
    const path = `${user.id}/${Date.now()}-${unique}.${ext}`
    const bytes = new Uint8Array(await file.arrayBuffer())

    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

    if (upErr) {
      console.error('benefit doc upload error:', upErr.message)
      return NextResponse.json({ error: 'Не вдалося завантажити файл' }, { status: 500 })
    }

    // Попередній файл більше не потрібен (повторна заявка після відмови)
    if (existing?.document_path) {
      await admin.storage.from(BUCKET).remove([existing.document_path])
    }

    // 5. Пільга діє одразу, статус — на перевірці
    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setFullYear(validUntil.getFullYear() + 1)

    const { error: dbErr } = await admin.from(TABLE).upsert(
      {
        user_id: user.id,
        category,
        review_status: 'pending',
        document_path: path,
        submitted_at: now.toISOString(),
        verified_at: null,
        valid_until: validUntil.toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        reject_reason: null,
      },
      { onConflict: 'user_id' },
    )

    if (dbErr) {
      // Прибираємо файл, щоб не лишався без запису
      await admin.storage.from(BUCKET).remove([path])
      console.error('benefit_status upsert error:', dbErr.message)
      return NextResponse.json({ error: 'Не вдалося зберегти заявку' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, status: 'pending', category })
  } catch (e) {
    console.error('benefit/manual error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Внутрішня помилка' }, { status: 500 })
  }
}
