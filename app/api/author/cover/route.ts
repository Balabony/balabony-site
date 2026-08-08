import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Заміна обкладинки твору самим автором: /api/author/cover
 *
 * Ключова відмінність від адмінського /api/admin/cover-upload — тут немає
 * пароля адміна. Тому право на конкретний твір перевіряється щоразу:
 * автор змінює обкладинку лише там, де content.author_id збігається з його
 * user_id. Без цієї перевірки будь-хто з кабінетом підмінив би картинку
 * чужому твору, знаючи тільки його id.
 *
 * Приймаємо файл, а не посилання: посилання на чуже зображення — найкоротший
 * шлях до претензії про порушення авторських прав на платформі, яка сама
 * живе з авторського права.
 *
 * Хто і коли завантажив — пишемо в базу. Це не бюрократія: коли прийде скарга
 * на картинку, треба знати, хто її поставив і чи підтверджував права.
 */

const MAX_BYTES = 8 * 1024 * 1024
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIDE = 1600

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })
    }

    const form = await req.formData()
    const contentId = form.get('content_id')
    const file = form.get('file')
    const rights = String(form.get('rights_confirmed') ?? '')

    if (!contentId || typeof contentId !== 'string') {
      return NextResponse.json({ error: 'Не вказано твір' }, { status: 400 })
    }

    if (rights !== 'yes') {
      return NextResponse.json(
        { error: 'Підтвердіть, що маєте право на це зображення' },
        { status: 400 },
      )
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Виберіть файл зображення' }, { status: 400 })
    }

    const blob = file as File
    if (!OK_TYPES.includes(blob.type)) {
      return NextResponse.json({ error: 'Лише JPG, PNG або WebP' }, { status: 400 })
    }
    if (blob.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Файл більший за 8 МБ' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Твір існує і належить саме цьому авторові — інакше далі не йдемо.
    const { data: row, error: rowErr } = await admin
      .from('content')
      .select('id, author_id')
      .eq('id', contentId)
      .maybeSingle()

    if (rowErr || !row) {
      return NextResponse.json({ error: 'Твір не знайдено' }, { status: 404 })
    }
    if ((row as { author_id: string | null }).author_id !== user.id) {
      return NextResponse.json({ error: 'Це не ваш твір' }, { status: 403 })
    }

    // Зменшуємо до розумного розміру: обкладинка на сайті ніколи не
    // показується більшою, а восьмиміегабайтне фото з телефона гальмує
    // сторінку в тих, хто читає з мобільного інтернету.
    const source = Buffer.from(await blob.arrayBuffer())
    let output: Buffer
    try {
      output = await sharp(source)
        .rotate()
        .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 86 })
        .toBuffer()
    } catch {
      return NextResponse.json({ error: 'Не вдалося обробити зображення' }, { status: 400 })
    }

    const fileName = `author/${contentId}-${Date.now()}.jpg`

    const { error: upErr } = await admin.storage
      .from('covers')
      .upload(fileName, output, { contentType: 'image/jpeg', upsert: true })

    if (upErr) {
      return NextResponse.json({ error: `Сховище: ${upErr.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('covers').getPublicUrl(fileName)

    const { error: updErr } = await admin
      .from('content')
      .update({
        cover_url: publicUrl,
        cover_position: 'center',
        cover_uploaded_by: user.id,
        cover_uploaded_at: new Date().toISOString(),
        cover_rights_confirmed: true,
      })
      .eq('id', contentId)

    if (updErr) {
      return NextResponse.json({ error: `База: ${updErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, cover_url: publicUrl })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Не вдалося замінити обкладинку' },
      { status: 500 },
    )
  }
}
