import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Відкладена публікація: scheduled → published, коли настала дата.
 *
 * НАВІЩО. У схемі `content` давно є `publish_at` і статус `scheduled`,
 * адмінка /admin/rozklad уміє ставити дати — але ніщо не переводило твір
 * у `published`, коли дата минала. Усі сторінки читають лише
 * `status = 'published'` і на `publish_at` не дивляться. Тобто запланований
 * твір не з'являвся ніколи: лежав у базі із заповненою датою, поки хтось
 * не перемкне статус руками.
 *
 * Виявилося 12.09.2026, коли готували серіальний конкурс: десять серій
 * мають виходити щотижня від 25 листопада, і без цього роуту вони просто
 * не вийшли б.
 *
 * ЧОМУ CRON, А НЕ ФІЛЬТР НА СТОРІНКАХ. Другий шлях — скрізь показувати
 * `scheduled` з `publish_at <= now()`. Але фільтр статусу стоїть у півтора
 * десятка місць: каталог, жанри, сторінка твору, серії, автор, «Що читають»,
 * карта сайту. Одне пропущене місце дає твір, який видно в списку й не
 * видно на власній сторінці. Тут рішення ухвалюється в одній точці, а
 * решта коду лишається як є.
 *
 * БЕЗПЕЧНІСТЬ. Роут нічого не створює й не видаляє — лише міняє статус у
 * рядків, яким уже поставили дату в минулому. Повторний запуск нічого не
 * дублює: другого разу таких рядків уже немає.
 *
 * Дата публікації (`published_at`) ставиться лише якщо вона порожня —
 * інакше при перезапуску загубилося б, коли твір вийшов насправді.
 *
 * ЗАПУСК. Vercel Cron щогодини, див. vercel.json. Вручну — тим самим
 * заголовком Authorization або з-під cookie адмінки, як у дайджесті
 * листування.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true
  const pass = process.env.ADMIN_PASSWORD
  if (pass && req.cookies.get('admin_session')?.value === pass) return true
  return false
}

type Published = { slug: string; title: string; publish_at: string }

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const res = await dbQuery(
      `update content
          set status       = 'published',
              published_at = coalesce(published_at, publish_at, now()),
              updated_at   = now()
        where status = 'scheduled'
          and publish_at is not null
          and publish_at <= now()
        returning slug, title, publish_at`,
    )

    const rows = res.rows as Published[]

    if (rows.length) {
      console.log(
        `[cron/publish-scheduled] опубліковано ${rows.length}: ` +
        rows.map(r => r.slug).join(', '),
      )
    }

    return NextResponse.json({
      ok: true,
      published: rows.length,
      items: rows.map(r => ({ slug: r.slug, title: r.title })),
    })
  } catch (err) {
    console.error('[cron/publish-scheduled]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'db error' }, { status: 500 })
  }
}
