import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { CONTESTS } from '@/lib/contests'
import { countedReadsByEntry } from '@/lib/contest-reads'
import { acceptEntry, acceptPending } from '@/lib/contest-accept'
import { schedulePending, unscheduleEntry } from '@/lib/contest-schedule'

/**
 * Конкурсні заявки для адмінки: перегляд, приймання, відхилення.
 *
 * ЩО БУЛО ДО 12.09.2026. Таблиці `contest_entries` і `contest_episodes`
 * заповнювалися формою подачі — і не читалися ЖОДНИМ іншим файлом у
 * проєкті. Тобто надіслане нікуди не потрапляло: ні перегляду, ні
 * приймання, ні шляху, яким текст став би твором на сайті. А читачі
 * читають тільки `content`, і дочитування пишуться на `content_id`.
 * Отже конкурсний твір фізично не можна було прочитати, і рахувати
 * дочитування не було чого.
 *
 * ЩО РОБИТЬ ПРИЙМАННЯ. Для кожної серії заявки, у якої ще немає
 * `content_id`, створює рядок у `content`:
 *   type   = 'story'  — навмисно, а не новий тип. Каталог, жанри,
 *            сторінка твору і «Що читають» жорстко фільтрують
 *            type = 'story'; з новим типом твір зник би з усіх списків,
 *            його ніхто не відкрив би, і дочитувань було б нуль.
 *   is_free = true    — в умовах записано, що конкурсні твори не
 *            блокуються пейволом. Раніше тут стояло false, і роботи
 *            потрапляли б під замок усупереч обіцяному.
 *   status = 'draft'  — приймання не є публікацією. Далі текст іде
 *            звичайною чергою редактури, як усі інші твори.
 *   season_number / episode_number — номер серії в межах заявки, щоб
 *            серіал збирався в одне ціле на /serialy/[slug].
 *
 * Конкурсність — це не тип і не позначка в `content`, а зв'язок
 * `contest_episodes.content_id`. Звідти ж будується підрахунок
 * дочитувань по конкурсному твору.
 *
 * ІДЕМПОТЕНТНІСТЬ. Повторне приймання не створює других копій: серії з
 * уже заповненим `content_id` пропускаються.
 */

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

type EntryRow = {
  id: string
  author_id: string
  author_name: string
  email: string
  contest: string
  title: string
  annotation: string
  genre: string
  status: string
  created_at: string
  episodes: number
  words: number
  published: number
  /** Зараховані дочитування — рахуються окремо, див. lib/contest-reads.ts */
  counted?: number
}

/** GET — перелік заявок. ?entry=<id> додає тексти серій цієї заявки. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const entryId = req.nextUrl.searchParams.get('entry')

  try {
    // 14.10.2026: заявки приймаються самі — і нові, і досилані серії.
    try { await acceptPending() } catch (e) { console.error('[admin/konkursy] acceptPending', (e as Error)?.message) }
    try { await schedulePending() } catch (e) { console.error('[admin/konkursy] schedulePending', (e as Error)?.message) }

    const list = await dbQuery(
      `select e.id::text, e.author_id::text, e.author_name, e.email, e.contest,
              e.title, e.annotation, e.genre, e.status, e.created_at,
              count(ep.id)::int                                        as episodes,
              coalesce(sum(ep.words), 0)::int                          as words,
              count(ep.content_id)::int                                as published
         from contest_entries e
         left join contest_episodes ep on ep.entry_id = e.id
        group by e.id
        order by e.created_at desc`,
    )

    let episodes: unknown[] = []
    if (entryId) {
      const eps = await dbQuery(
        `select ep.id::text, ep.ord, ep.words, ep.filename, ep.body,
                ep.content_id::text,
                c.slug, c.status as content_status, c.publish_at
           from contest_episodes ep
           left join content c on c.id = ep.content_id
          where ep.entry_id = $1
          order by ep.ord`,
        [entryId],
      )
      episodes = eps.rows
    }

    const rows = list.rows as EntryRow[]

    // Зараховані дочитування. Окремим запитом, бо три фільтри з правил
    // не вкладаються в той самий group by без дублювання рядків.
    const counts = await countedReadsByEntry()
    for (const r of rows) r.counted = counts.get(r.id) ?? 0

    // Зведення по конкурсах — щоб не рахувати очима в списку.
    const stats = CONTESTS.map(c => {
      const mine = rows.filter(r => r.contest === c.id)
      return {
        id:        c.id,
        name:      c.name,
        episodesNeed: c.episodes,
        threshold: c.threshold,
        opensAt:   c.opensAt,
        closesAt:  c.closesAt,
        stages:    c.stages,
        entries:   mine.length,
        accepted:  mine.filter(r => r.status === 'accepted').length,
        rejected:  mine.filter(r => r.status === 'rejected').length,
        fresh:     mine.filter(r => r.status === 'new').length,
        episodes:  mine.reduce((s, r) => s + r.episodes, 0),
        published: mine.reduce((s, r) => s + r.published, 0),
      }
    })

    return NextResponse.json({ ok: true, entries: rows, episodes, stats })
  } catch (err) {
    console.error('[admin/konkursy GET]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'db error' }, { status: 500 })
  }
}

/** POST — дія над заявкою: accept | reject | reset. */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const entryId = String(body?.entryId ?? '')
    const action = String(body?.action ?? '')

    if (!entryId) {
      return NextResponse.json({ ok: false, error: 'entryId обовʼязковий' }, { status: 400 })
    }
    if (!['accept', 'reject', 'reset'].includes(action)) {
      return NextResponse.json({ ok: false, error: 'Невідома дія' }, { status: 400 })
    }

    const found = await dbQuery(`select 1 from contest_entries where id = $1`, [entryId])
    if (!found.rowCount) {
      return NextResponse.json({ ok: false, error: 'Заявку не знайдено' }, { status: 404 })
    }

    if (action !== 'accept') {
      const status = action === 'reject' ? 'rejected' : 'new'
      await dbQuery(
        `update contest_entries set status = $2, updated_at = now() where id = $1`,
        [entryId, status],
      )
      // 14.10.2026: відхилена робота знімається з розкладу публікацій.
      if (action === 'reject') await unscheduleEntry(entryId)
      return NextResponse.json({ ok: true, status, created: 0 })
    }

    const created = await acceptEntry(entryId)
    return NextResponse.json({ ok: true, status: 'accepted', created })
  } catch (err) {
    console.error('[admin/konkursy POST]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося виконати дію' }, { status: 500 })
  }
}
