import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { slugify } from '@/lib/slugify'
import { mailApplicationAccepted, mailApplicationRejected } from '@/lib/author-applications'

/**
 * Заявки авторів для адмінки: /api/admin/author-applications
 *
 * GET            — перелік заявок (без тексту).
 * GET ?id=<id>   — одна заявка з текстом історії.
 * POST {id, action: 'accept' | 'reject', note?}
 *
 * «Прийняти» робить за один рух те, що раніше робилося руками:
 *   1. профіль автора (author_profiles) на ТОМУ Ж акаунті, з якого подано
 *      заявку — людина вже увійшла, тож другого акаунта не буде;
 *   2. запис згоди (author_consents, канал 'form') з датою подачі;
 *   3. пробна історія → чернетка в content (далі звичайна редактура);
 *   4. лист «кабінет відкрито» з інструкцією входу через /login.
 * «Відхилити» — статус і ввічливий лист, з коментарем, якщо його написали.
 */

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

type Row = {
  id: string
  user_id: string
  email: string
  full_name: string
  pen_name: string | null
  phone: string
  title: string
  genre: string | null
  words: number
  filename: string | null
  status: 'new' | 'accepted' | 'rejected'
  admin_note: string | null
  content_id: string | null
  decided_at: string | null
  created_at: string
  consent_ip: string | null
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  try {
    if (id) {
      const r = await dbQuery(`select id::text, body from author_applications where id = $1`, [id])
      if (!r.rowCount) return NextResponse.json({ ok: false, error: 'Заявку не знайдено' }, { status: 404 })
      return NextResponse.json({ ok: true, body: (r.rows[0] as { body: string }).body })
    }
    const r = await dbQuery(
      `select id::text, user_id::text, email, full_name, pen_name, phone, title, genre, words,
              filename, status, admin_note, content_id::text, decided_at, created_at, consent_ip
         from author_applications
        order by (status = 'new') desc, created_at desc
        limit 300`,
    )
    return NextResponse.json({ ok: true, applications: r.rows as Row[] })
  } catch (err) {
    console.error('[admin/author-applications GET]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'db error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let id = '', action = '', note = ''
  try {
    const b = await req.json()
    id = String(b?.id ?? '')
    action = String(b?.action ?? '')
    note = String(b?.note ?? '').trim().slice(0, 2000)
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }
  if (!id || !['accept', 'reject'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'Потрібні id і дія' }, { status: 400 })
  }

  try {
    const f = await dbQuery(
      `select id::text, user_id::text, email, full_name, pen_name, title, genre, body, status,
              created_at, consent_ip
         from author_applications where id = $1`,
      [id],
    )
    if (!f.rowCount) return NextResponse.json({ ok: false, error: 'Заявку не знайдено' }, { status: 404 })
    const a = f.rows[0] as {
      id: string; user_id: string; email: string; full_name: string; pen_name: string | null
      title: string; genre: string | null; body: string; status: string; created_at: string
      consent_ip: string | null
    }
    if (a.status !== 'new') {
      return NextResponse.json({ ok: false, error: 'Цю заявку вже розглянуто' }, { status: 400 })
    }

    if (action === 'reject') {
      await dbQuery(
        `update author_applications set status = 'rejected', admin_note = nullif($2,''), decided_at = now() where id = $1`,
        [id, note],
      )
      const mailed = await mailApplicationRejected({ fullName: a.full_name, email: a.email, title: a.title, note })
      return NextResponse.json({ ok: true, status: 'rejected', mailed })
    }

    // ── Прийняти ─────────────────────────────────────────────────────────
    // 1. Профіль автора. Повторний запуск нічого не псує.
    await dbQuery(
      `insert into author_profiles
         (user_id, display_name, email, full_name, pen_name, is_fop, revenue_share, is_active)
       values ($1, $2, $3, $2, $4, false, 0.4, true)
       on conflict (user_id) do update
          set email     = excluded.email,
              pen_name  = coalesce(author_profiles.pen_name, excluded.pen_name),
              is_active = true`,
      [a.user_id, a.full_name, a.email, a.pen_name],
    )

    // 2. Згода на публікацію — з датою подачі заявки, коли людина поставила позначки.
    await dbQuery(
      `insert into author_consents
         (author_name, user_id, scope, status, channel, happened_at, note)
       values ($1, $2, 'balabony', 'given', 'form', $3, $4)`,
      [a.full_name, a.user_id, a.created_at, `заявка автора #${a.id} з сайту${a.consent_ip ? `, IP ${a.consent_ip}` : ''}`],
    )

    // 3. Пробна історія → чернетка. Вільний slug, як у /api/author/new-work.
    const base = slugify(a.title)
    let slug = base
    for (let i = 0; i < 12; i++) {
      const busy = await dbQuery(`select id from content where slug = $1 limit 1`, [slug])
      if (!busy.rowCount) break
      slug = `${base}-${i + 2}`
    }
    const authorName = a.pen_name || a.full_name
    const ins = await dbQuery(
      `insert into content
         (type, status, audio_status, slug, title, text, author_id, author_name, genre,
          is_free, is_adult, is_premium, images, writer_note)
       values ('story', 'draft', 'pending', $1, $2, $3, $4, $5, $6,
               false, false, false, '[]'::jsonb, $7)
       returning id::text`,
      [slug, a.title, a.body, a.user_id, authorName, a.genre, `пробна історія, заявка автора #${a.id}`],
    )
    const contentId = (ins.rows[0] as { id: string }).id

    await dbQuery(
      `update author_applications
          set status = 'accepted', admin_note = nullif($2,''), content_id = $3, decided_at = now()
        where id = $1`,
      [id, note, contentId],
    )

    const mailed = await mailApplicationAccepted({ fullName: a.full_name, email: a.email, title: a.title })
    return NextResponse.json({ ok: true, status: 'accepted', contentId, mailed })
  } catch (err) {
    console.error('[admin/author-applications POST]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: `Не вдалося виконати дію: ${(err as Error)?.message ?? ''}` }, { status: 500 })
  }
}
