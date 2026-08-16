// app/api/admin/notify-followers/route.ts
//
// Сповіщення підписників автора про нову серію.
//
// Підписка на автора вже працює (author_follows + FollowAuthorButton), але
// з неї нічого не випливало: читач натискав «стежити» і більше про автора
// не чув. Цей роут замикає ланцюг.
//
// Чому кнопка, а не автоматика при публікації: до запуску контент
// заливається пачками по десять-двадцять творів, і автоматична розсилка
// висипала б людині десяток листів за вечір. Редакція вирішує сама, про
// що сповіщати.
//
// Повторно один твір не розсилається: кожна відправка пишеться в
// notification_log, і роут спершу перевіряє його.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { dbQuery } from '@/lib/db'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const SITE = 'https://balabony.com'
const GOLD = '#ef9f27'

function checkAuth(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

type Target = { email: string; followerId: string }

/** Публічна адреса твору. Типи лежать на різних маршрутах. */
function readUrl(type: string, slug: string | null): string {
  if (!slug) return SITE
  if (type === 'episode') return `${SITE}/episodes/${slug}`
  if (type === 'tysha') return `${SITE}/tysha/${slug}`
  return `${SITE}/stories/${slug}`
}

function letter(opts: {
  authorName: string
  title: string
  url: string
  teaser: string | null
}): string {
  const { authorName, title, url, teaser } = opts
  return `<!DOCTYPE html>
<html lang="uk">
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px;max-width:640px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:16px;padding:28px;border:1px solid rgba(239,159,39,0.3);">
    <div style="font-size:22px;font-weight:700;color:${GOLD};margin-bottom:24px;">Balabony</div>

    <p style="color:#c8d4e8;margin:0 0 6px;">Автор, за яким ви стежите, опублікував нове.</p>

    <div style="font-size:20px;font-weight:700;color:#f5f0e8;margin:18px 0 4px;">${title}</div>
    <div style="font-size:14px;color:#8899bb;margin-bottom:20px;">${authorName}</div>

    ${teaser ? `<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px;
      border:1px solid rgba(255,255,255,0.08);margin-bottom:24px;font-size:15px;
      color:#c8d4e8;line-height:1.7;">${teaser}</div>` : ''}

    <a href="${url}" style="display:block;text-align:center;background:${GOLD};color:#0e1a2b;
      padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;">
      Читати
    </a>

    <p style="color:#6b7c99;font-size:12px;margin:24px 0 0;line-height:1.6;">
      Ви отримали цей лист, бо стежите за автором на Балабонах.
      Керувати підписками — <a href="${SITE}/moi-avtory" style="color:#8899bb;">мої автори</a>.
    </p>
  </div>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const contentId = String(url.searchParams.get('contentId') ?? '').trim()

  // Без contentId — список кандидатів: опубліковане, з автором, у якого
  // є підписники, і чого ще не розсилали.
  if (!contentId) {
    try {
      const { rows } = await dbQuery(
        `select c.id, c.title, c.type, c.slug, c.created_at,
                coalesce(p.pen_name, p.display_name, 'Автор') as author_name,
                (select count(*)::int from author_follows f
                  where f.author_user_id = c.author_id) as followers,
                (select sent_at from notification_log n
                  where n.content_id = c.id)            as sent_at
           from content c
           join author_profiles p on p.user_id = c.author_id
          where c.status <> 'draft'
            and exists (select 1 from author_follows f
                         where f.author_user_id = c.author_id)
          order by c.created_at desc
          limit 60`,
      )
      return NextResponse.json({ items: rows })
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Помилка' },
        { status: 500 },
      )
    }
  }

  try {
    const { rows } = await dbQuery(
      `select c.id, c.title, c.slug, c.status, c.author_id,
              coalesce(p.pen_name, p.display_name, 'Автор') as author_name,
              (select count(*)::int from author_follows f
                where f.author_user_id = c.author_id)        as followers,
              (select sent_at from notification_log n
                where n.content_id = c.id)                   as already_sent
         from content c
         left join author_profiles p on p.user_id = c.author_id
        where c.id = $1::uuid`,
      [contentId],
    )
    if (!rows.length) {
      return NextResponse.json({ error: 'Твір не знайдено' }, { status: 404 })
    }
    return NextResponse.json(rows[0])
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Помилка' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let contentId = ''
  try {
    const body = await req.json()
    contentId = String(body?.contentId ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Порожній запит' }, { status: 400 })
  }
  if (!contentId) {
    return NextResponse.json({ error: 'contentId обовʼязковий' }, { status: 400 })
  }

  const key = process.env.RESEND_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'RESEND_API_KEY не налаштований' }, { status: 500 })
  }

  try {
    // 1. Твір і автор
    const { rows: found } = await dbQuery(
      `select c.id, c.title, c.slug, c.status, c.author_id, c.hook, c.type,
              coalesce(p.pen_name, p.display_name, 'Автор') as author_name
         from content c
         left join author_profiles p on p.user_id = c.author_id
        where c.id = $1::uuid`,
      [contentId],
    )
    if (!found.length) {
      return NextResponse.json({ error: 'Твір не знайдено' }, { status: 404 })
    }
    const item = found[0] as {
      id: string; title: string; slug: string | null; status: string; type: string
      author_id: string | null; hook: string | null; author_name: string
    }

    if (!item.author_id) {
      return NextResponse.json(
        { error: 'У твору немає автора — спершу прив’яжіть його в /admin/link-authors' },
        { status: 400 },
      )
    }
    if (item.status === 'draft') {
      return NextResponse.json(
        { error: 'Твір ще чернетка. Читач перейде за посиланням і нічого не побачить.' },
        { status: 400 },
      )
    }

    // Повторно не розсилаємо: людина не має отримати той самий лист двічі
    const { rows: sent } = await dbQuery(
      `select sent_at, recipients from notification_log where content_id = $1::uuid`,
      [contentId],
    )
    if (sent.length) {
      return NextResponse.json(
        { error: `Уже розіслано ${new Date(sent[0].sent_at).toLocaleString('uk-UA')}, ${sent[0].recipients} листів` },
        { status: 409 },
      )
    }

    // 2. Підписники з поштою
    const { rows: raw } = await dbQuery(
      `select f.follower_id, u.email
         from author_follows f
         join auth.users u on u.id = f.follower_id
        where f.author_user_id = $1::uuid
          and u.email is not null`,
      [item.author_id],
    )
    const targets: Target[] = raw
      .map((r: { follower_id: string; email: string }) => ({
        followerId: r.follower_id,
        email: String(r.email).trim(),
      }))
      .filter((t: Target) => t.email.includes('@'))

    if (!targets.length) {
      return NextResponse.json({ sent: 0, failed: 0, note: 'У автора ще немає підписників' })
    }

    // 3. Розсилка
    const resend = new Resend(key)
    const from = process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com'
    // Маршрут залежить від типу: серії, «Тиша» й окремі історії живуть
    // на різних гілках, спільного /read/ у проді немає.
    const url = readUrl(item.type, item.slug)
    const html = letter({
      authorName: item.author_name,
      title: item.title,
      url,
      teaser: item.hook,
    })

    let ok = 0
    const failed: string[] = []
    for (const t of targets) {
      try {
        await resend.emails.send({
          from,
          to: t.email,
          subject: `${item.author_name} — «${item.title}»`,
          html,
        })
        ok++
      } catch {
        failed.push(t.email)
      }
      // Resend тримає обмеження на частоту; пауза дешевша за відмову
      await new Promise((r) => setTimeout(r, 120))
    }

    if (ok > 0) {
      await dbQuery(
        `insert into notification_log (content_id, author_id, recipients)
         values ($1::uuid, $2::uuid, $3)
         on conflict (content_id) do nothing`,
        [contentId, item.author_id, ok],
      )
    }

    return NextResponse.json({ sent: ok, failed: failed.length, failedList: failed.slice(0, 10) })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Помилка розсилки' },
      { status: 500 },
    )
  }
}
