import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { toPlainText } from '@/lib/plain-text'
import { countWords } from '@/lib/contests'
import {
  APP_MIN_WORDS, APP_MAX_WORDS, APP_MAX_FILE_BYTES, EDITOR_EMAIL,
  stripFieldLabel, mailApplicationReceived,
} from '@/lib/author-applications'

/**
 * Заявка автора з сайту: /api/author-application
 *
 * GET  — стан для форми: чи увійшла людина, чи вже автор, остання заявка.
 * POST — подача пробної історії (файл .docx/.txt або вставлений текст).
 *
 * Подавати може лише той, хто увійшов: так пошта в заявці справжня
 * (підтверджена входом), і після «Прийняти» кабінет відкривається саме
 * на цьому акаунті — без ручного заведення і без ризику створити другий
 * акаунт на «ту саму» gmail-адресу з крапками.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AppRow = {
  id: string
  title: string
  words: number
  status: 'new' | 'accepted' | 'rejected'
  admin_note: string | null
  created_at: string
}

async function isActiveAuthor(userId: string): Promise<boolean> {
  const r = await dbQuery(
    `select 1 from author_profiles where user_id = $1 and is_active = true limit 1`,
    [userId],
  )
  return r.rows.length > 0
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: true, authorized: false })

  try {
    const isAuthor = await isActiveAuthor(user.id)
    const r = await dbQuery(
      `select id::text, title, words, status, admin_note, created_at
         from author_applications
        where user_id = $1
        order by created_at desc
        limit 1`,
      [user.id],
    )
    return NextResponse.json({
      ok: true,
      authorized: true,
      email: user.email ?? '',
      isAuthor,
      application: (r.rows[0] as AppRow | undefined) ?? null,
    })
  } catch (err) {
    console.error('[author-application] get', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося прочитати стан заявки' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Спершу увійдіть на сайт' }, { status: 401 })
  }
  const email = String(user.email ?? '').trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ ok: false, error: 'В акаунті немає пошти. Увійдіть через Google або за адресою пошти.' }, { status: 400 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
  }

  const fullName = stripFieldLabel(String(form.get('fullName') ?? '')).slice(0, 120)
  const penName = stripFieldLabel(String(form.get('penName') ?? '')).slice(0, 120)
  const phone = stripFieldLabel(String(form.get('phone') ?? '')).slice(0, 40)
  const title = String(form.get('title') ?? '').trim().slice(0, 200)
  const genre = String(form.get('genre') ?? '').trim().slice(0, 100)
  const pasted = String(form.get('text') ?? '')
  const consentAuthor = form.get('consentAuthor') === 'yes'
  const consentPublish = form.get('consentPublish') === 'yes'
  const file = form.get('file')

  if (fullName.length < 5 || !fullName.includes(' ')) {
    return NextResponse.json({ ok: false, error: 'Вкажіть прізвище та імʼя повністю' }, { status: 400 })
  }
  if (phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ ok: false, error: 'Вкажіть номер телефону повністю, наприклад 067 123 45 67' }, { status: 400 })
  }
  if (!title) {
    return NextResponse.json({ ok: false, error: 'Вкажіть назву історії' }, { status: 400 })
  }
  if (!consentAuthor || !consentPublish) {
    return NextResponse.json({ ok: false, error: 'Поставте обидві позначки згоди внизу форми' }, { status: 400 })
  }

  // --- Текст: файл або вставлений ------------------------------------------
  let body = ''
  let filename: string | null = null
  if (file instanceof File && file.size > 0) {
    if (file.size > APP_MAX_FILE_BYTES) {
      return NextResponse.json({ ok: false, error: 'Файл більший за 2 МБ' }, { status: 400 })
    }
    const name = file.name.toLowerCase()
    if (!name.endsWith('.docx') && !name.endsWith('.txt')) {
      return NextResponse.json({ ok: false, error: 'Приймаємо файли .docx або .txt. Або вставте текст у поле.' }, { status: 400 })
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      body = name.endsWith('.docx')
        ? toPlainText((await mammoth.extractRawText({ buffer })).value)
        : toPlainText(buffer.toString('utf-8'))
    } catch {
      return NextResponse.json({ ok: false, error: 'Не вдалося прочитати файл. Збережіть його у .docx або вставте текст у поле.' }, { status: 400 })
    }
    filename = file.name.slice(0, 200)
  } else {
    body = toPlainText(pasted)
  }

  const words = countWords(body)
  if (words === 0) {
    return NextResponse.json({ ok: false, error: 'Прикріпіть файл з історією або вставте текст' }, { status: 400 })
  }
  if (words < APP_MIN_WORDS || words > APP_MAX_WORDS) {
    return NextResponse.json(
      { ok: false, error: `В історії ${words} слів, а приймаємо від ${APP_MIN_WORDS} до ${APP_MAX_WORDS}. Нічого не збережено.` },
      { status: 400 },
    )
  }

  try {
    if (await isActiveAuthor(user.id)) {
      return NextResponse.json({ ok: false, error: 'Ви вже автор Балабонів — нові історії додавайте в кабінеті.' }, { status: 400 })
    }
    const pending = await dbQuery(
      `select 1 from author_applications where user_id = $1 and status = 'new' limit 1`,
      [user.id],
    )
    if (pending.rows.length > 0) {
      return NextResponse.json({ ok: false, error: 'Ваша попередня заявка ще на розгляді. Ми відповімо на пошту.' }, { status: 400 })
    }

    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
    const ua = (req.headers.get('user-agent') ?? '').slice(0, 400) || null

    const ins = await dbQuery(
      `insert into author_applications
         (user_id, email, full_name, pen_name, phone, title, genre, body, words, filename, consent_ip, consent_ua)
       values ($1,$2,$3,nullif($4,''),$5,$6,nullif($7,''),$8,$9,$10,$11,$12)
       returning id::text`,
      [user.id, email, fullName, penName, phone, title, genre, body, words, filename, ip, ua],
    )
    const id = (ins.rows[0] as { id: string }).id

    // Лист не пішов — заявка вже в базі, це не привід показувати помилку.
    await mailApplicationReceived({ id, fullName, penName, email, phone, title, genre, words })

    return NextResponse.json({ ok: true, id, words })
  } catch (err) {
    console.error('[author-application] post', (err as Error)?.message)
    return NextResponse.json(
      { ok: false, error: `Не вдалося зберегти заявку. Спробуйте ще раз або надішліть історію на ${EDITOR_EMAIL}` },
      { status: 500 },
    )
  }
}
