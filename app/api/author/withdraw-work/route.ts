import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Відкликання твору з переліку Договору — виконання п. 2.11.
 *
 * Текст пункту: «Видавець розглядає долучений твір протягом 14 днів. Якщо
 * протягом 30 днів з дати долучення твір не опубліковано і рішення про
 * відмову Авторові не повідомлено, Автор має право відкликати твір з
 * переліку через Особистий кабінет.»
 *
 * Три умови пункту й що з ними тут:
 *
 *   1. «30 днів з дати долучення» — рахуємо від confirmed_at, а за його
 *      відсутності від added_at. Дата підтвердження Автором точніша: саме
 *      вона є пропозицією поширити Договір на твір (п. 2.3).
 *
 *   2. «не опубліковано» — перевіряємо статус у content. Опублікований твір
 *      цим шляхом не знімається: для нього діє п. 4.4 (після трьох років)
 *      або запит до редакції.
 *
 *   3. «рішення про відмову не повідомлено» — механізму відмови за п. 2.9 у
 *      системі НЕМАЄ: ні окремого статусу, ні повідомлення в кабінеті. Тому
 *      умова завжди істинна й тут не перевіряється. Щойно відмову зроблять —
 *      сюди треба додати перевірку, інакше автор зможе відкликати твір,
 *      якому вже відмовлено, і це розійдеться з пунктом.
 *
 * ВІДОМЕ ВІДХИЛЕННЯ ВІД ПУНКТУ: п. 2.11 не поширюється на архівні Твори
 * (п. 2.4-1), але ознаки архівності в contract_works немає — колонки просто
 * не існує. Тож відкликати можна й архівний неопублікований твір. Це
 * відхилення на КОРИСТЬ Автора: за п. 2.4-1 до публікації він і так вільно
 * розпоряджається такими творами. Коли зʼявиться ознака — додати умову.
 *
 * Що саме робиться: видаляється рядок у contract_works, тобто твір більше
 * не входить до переліку Додатка № 1. Сам текст у content НЕ чіпаємо: його
 * міг внести Видавець при оцифруванні архіву, і видалення знищило б чужу
 * роботу. Автор видаляє власну чернетку окремим шляхом (delete-draft).
 */

const DAYS = 30

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let workId = ''
  try {
    const body = (await req.json()) as { workId?: string }
    workId = (body.workId ?? '').trim()
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }
  if (!workId) return NextResponse.json({ ok: false, error: 'Не вказано твір' }, { status: 400 })

  try {
    // Рядок переліку разом із договором і статусом твору. Перевірка
    // належності — через author_id договору, а не через сам твір: у переліку
    // можуть бути твори, внесені Видавцем.
    const r = await dbQuery(
      `select w.id::text,
              w.title,
              coalesce(w.confirmed_at, w.added_at) as since,
              c.status::text        as contract_status,
              c.author_id::text     as author_id,
              t.status::text        as content_status
         from contract_works w
         join author_contracts c on c.id = w.contract_id
         left join content t     on t.id = w.content_id
        where w.id = $1
        limit 1`,
      [workId],
    )
    const row = r.rows[0] as
      | { id: string; title: string | null; since: string | null
          contract_status: string; author_id: string; content_status: string | null }
      | undefined

    if (!row) return NextResponse.json({ ok: false, error: 'Твір не знайдено' }, { status: 404 })
    if (row.author_id !== user.id) {
      return NextResponse.json({ ok: false, error: 'Це не ваш твір' }, { status: 403 })
    }

    if ((row.content_status ?? '') === 'published') {
      return NextResponse.json({
        ok: false,
        error: 'Твір уже опубліковано. Відкликати його через кабінет не можна — напишіть редакції.',
      }, { status: 400 })
    }

    if (!row.since) {
      return NextResponse.json({
        ok: false,
        error: 'У цього твору немає дати долучення, тож строк порахувати неможливо. Напишіть редакції.',
      }, { status: 400 })
    }

    const passed = Math.floor((Date.now() - new Date(row.since).getTime()) / 86_400_000)
    if (passed < DAYS) {
      const left = DAYS - passed
      return NextResponse.json({
        ok: false,
        error: `Відкликати твір можна через ${DAYS} днів після долучення (п. 2.11). Лишилося ${left} ${left === 1 ? 'день' : left < 5 ? 'дні' : 'днів'}.`,
      }, { status: 400 })
    }

    await dbQuery(`delete from contract_works where id = $1`, [workId])

    return NextResponse.json({ ok: true, title: row.title ?? '' })
  } catch (err) {
    console.error('[author/withdraw-work]', (err as Error)?.message)
    return NextResponse.json(
      { ok: false, error: 'Не вдалося відкликати твір. Спробуйте ще раз або напишіть редакції.' },
      { status: 500 },
    )
  }
}
