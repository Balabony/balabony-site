import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Редакційні правки конкурсних серій — для автора.
 *
 * ЗВІДКИ ВЗЯЛОСЯ. Авторський договір, п. 3.2-2: опрацьована редакція твору
 * стає доступною авторові в Особистому кабінеті ДО публікації, і якщо він
 * протягом 14 днів не заперечив і не надіслав власної редакції, вважається,
 * що він погодився. Редактор може правити текст із 14.09.2026; без цього
 * роуту строк не було від чого рахувати, а обіцянка в договорі лишалася
 * невиконаною.
 *
 * СТРОК РАХУЄМО ВІД created_at, а не від того, коли автор відкрив кабінет.
 * Договір каже «з дати, коли редакція стала доступною» — доступною вона
 * стає в мить збереження. Інакше автор, який не заходить, тримав би
 * публікацію нескінченно.
 *
 * `author_seen_at` пишемо при першому перегляді: він нічого не вирішує, але
 * у спірній розмові показує, що автор правку бачив.
 */

const DAYS = 14

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, rows: [] }, { status: 401 })

  try {
    const res = await dbQuery(
      `select r.id::text,
              r.created_at,
              r.note,
              r.text_after,
              r.words_before,
              r.words_after,
              r.author_seen_at,
              r.author_reply,
              r.author_replied_at,
              ep.ord            as episode_ord,
              e.title           as entry_title,
              e.contest         as contest
         from episode_revisions r
         join contest_episodes ep on ep.id = r.episode_id
         join contest_entries  e  on e.id = ep.entry_id
        where e.author_id = $1
        order by r.created_at desc
        limit 50`,
      [user.id],
    )

    // Позначаємо переглянутими ті, що автор щойно побачив.
    await dbQuery(
      `update episode_revisions r
          set author_seen_at = now()
         from contest_episodes ep
         join contest_entries e on e.id = ep.entry_id
        where ep.id = r.episode_id
          and e.author_id = $1
          and r.author_seen_at is null`,
      [user.id],
    ).catch(() => {})

    const rows = res.rows.map((raw) => {
      const r = raw as Record<string, unknown>
      const created = new Date(String(r.created_at))
      const deadline = new Date(created.getTime() + DAYS * 24 * 60 * 60 * 1000)
      const left = Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      return {
        id: String(r.id),
        createdAt: String(r.created_at),
        deadline: deadline.toISOString(),
        daysLeft: left,
        note: String(r.note ?? ''),
        text: String(r.text_after ?? ''),
        wordsBefore: Number(r.words_before) || 0,
        wordsAfter: Number(r.words_after) || 0,
        episodeOrd: Number(r.episode_ord) || 1,
        entryTitle: String(r.entry_title ?? ''),
        contest: String(r.contest ?? ''),
        reply: r.author_reply ? String(r.author_reply) : null,
        repliedAt: r.author_replied_at ? String(r.author_replied_at) : null,
      }
    })

    return NextResponse.json({ ok: true, rows })
  } catch (err) {
    console.error('[author/revisions GET]', (err as Error)?.message)
    return NextResponse.json({ ok: false, rows: [] })
  }
}

/**
 * Відповідь автора: згода або власна редакція.
 *
 * Обидва варіанти пишемо в те саме поле — важлива не форма, а факт і дата.
 * Текст автора НЕ підмінює текст серії автоматично: за договором його
 * розглядає видавець. Мовчазна заміна означала б, що будь-хто, хто отримав
 * доступ до кабінету, міняє конкурсний текст після редактури.
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const id = String(body?.id ?? '')
  const agree = body?.agree === true
  const reply = typeof body?.reply === 'string' ? body.reply.trim().slice(0, 20000) : ''

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
  }
  if (!agree && !reply) {
    return NextResponse.json({ ok: false, error: 'Напишіть заперечення або погодьтеся' }, { status: 400 })
  }

  const text = agree ? 'Автор погодився з редакційними правками.' : reply

  try {
    const res = await dbQuery(
      `update episode_revisions r
          set author_reply = $2, author_replied_at = now()
         from contest_episodes ep
         join contest_entries e on e.id = ep.entry_id
        where r.id = $1
          and ep.id = r.episode_id
          and e.author_id = $3
          and r.author_replied_at is null
        returning r.id::text`,
      [id, text, user.id],
    )
    if (!res.rowCount) {
      return NextResponse.json({ ok: false, error: 'Правку не знайдено або відповідь уже надіслано' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[author/revisions POST]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти' }, { status: 500 })
  }
}
