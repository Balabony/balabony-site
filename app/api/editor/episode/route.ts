import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { getEditor } from '@/lib/editor-auth'
import { countWords } from '@/lib/contests'

/**
 * Правка тексту конкурсної серії редактором (рішення Богдана 13.09.2026).
 *
 * ЧОМУ КОЖНА ПРАВКА ПИШЕТЬСЯ ЦІЛКОМ, А НЕ ДІФОМ
 * Конкурс із грошовим призом означає, що колись доведеться відповідати на
 * питання «хто змінив цей текст». Діф відповідає на нього тільки тоді, коли
 * цілий ланцюг збережений без жодної прогалини; повний текст «до» і «після»
 * відповідає сам по собі. Місце дешевше за суперечку.
 *
 * ПРАВКА ЗБЕРІГАЄТЬСЯ ОДРАЗУ, без погодження засновником — так вирішено
 * 13.09.2026. Обмеження одне: редактор може правити лише ті роботи, які йому
 * призначені (contest_assignments), і не бачить чужих.
 *
 * ТЕКСТ ОНОВЛЮЄТЬСЯ У ДВОХ МІСЦЯХ.
 * `contest_episodes.body` — джерело для редактора й для майбутньої публікації.
 * `content.text` — те, що бачить читач, якщо серію вже прийнято (приймання
 * створює рядок у content і кладе його id у contest_episodes.content_id).
 * Оновлювати треба обидва: інакше редактор бачить одне, читач інше, а
 * дочитування рахуються по тому тексту, якого редактор не правив.
 */

export async function POST(req: Request) {
  const editor = await getEditor()
  if (!editor) {
    return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const episodeId = String(body?.episodeId ?? '')
  const text      = typeof body?.text === 'string' ? body.text : ''
  const note      = typeof body?.note === 'string' ? body.note.slice(0, 2000) : ''

  if (!/^\d+$/.test(episodeId)) {
    return NextResponse.json({ ok: false, error: 'Некоректна серія' }, { status: 400 })
  }
  if (!text.trim()) {
    return NextResponse.json({ ok: false, error: 'Текст не може бути порожнім' }, { status: 400 })
  }

  try {
    // Серія + перевірка призначення одним запитом: редактор, якому ця робота
    // не призначена, не має навіть дізнатися, що така серія існує.
    const found = await dbQuery(
      `select ep.id::text, ep.entry_id::text, ep.ord, ep.body, ep.words,
              ep.content_id::text
         from contest_episodes ep
         join contest_assignments a on a.entry_id = ep.entry_id
        where ep.id = $1 and a.editor_id = $2
        limit 1`,
      [episodeId, editor.id],
    )
    if (!found.rowCount) {
      return NextResponse.json({ ok: false, error: 'Серію не знайдено' }, { status: 404 })
    }

    const ep = found.rows[0] as {
      id: string; entry_id: string; ord: number
      body: string; words: number; content_id: string | null
    }

    // Натиснули «Зберегти», нічого не змінивши. Порожній рядок в історії
    // правок гірший за його відсутність: він створює враження втручання.
    if (ep.body === text) {
      return NextResponse.json({ ok: true, changed: false, words: ep.words })
    }

    const wordsAfter = countWords(text)

    await dbQuery(
      `insert into episode_revisions
         (episode_id, editor_id, text_before, text_after,
          words_before, words_after, note)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [ep.id, editor.id, ep.body, text, ep.words, wordsAfter, note],
    )

    await dbQuery(
      `update contest_episodes set body = $2, words = $3 where id = $1`,
      [ep.id, text, wordsAfter],
    )

    if (ep.content_id) {
      await dbQuery(
        `update content set text = $2, updated_at = now() where id = $1`,
        [ep.content_id, text],
      )
    }

    const n = await dbQuery(
      `select count(*)::int as n from episode_revisions where episode_id = $1`,
      [ep.id],
    )

    return NextResponse.json({
      ok: true,
      changed: true,
      words: wordsAfter,
      revisions: (n.rows[0] as { n: number }).n,
      liveUpdated: !!ep.content_id,
    })
  } catch (err) {
    console.error('[editor/episode]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти' }, { status: 500 })
  }
}
