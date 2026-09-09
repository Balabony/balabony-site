import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { slugify } from '@/lib/slugify'
import { normalizeGenre } from '@/lib/genres'

/**
 * Автор додає власний твір: /api/author/new-work
 *
 * Навіщо. До 09.09.2026 автор міг у кабінеті редагувати вже наявний твір,
 * додати до нього обкладинку й опублікувати чернетку — але НЕ міг завести
 * новий. Твори заводила редакція через адмінку, а автори надсилали тексти
 * поштою. На питання «чи можна додати свої старі історії» чесної відповіді
 * не було.
 *
 * Твір створюється зі статусом 'draft'. Це не модерація: у кабінеті вже є
 * кнопка «Опублікувати», і автор натискає її сам, коли долив обкладинку й
 * перечитав текст. Чернетка потрібна саме для цієї паузи.
 *
 * Обкладинку тут НЕ приймаємо. Для неї в кабінеті вже працює
 * AuthorCoverUpload, прив'язаний до наявного твору — тягти завантаження
 * файлу в цей роут означало б другу реалізацію того самого.
 */

export const runtime = 'nodejs'

const TITLE_MIN = 3
const TITLE_MAX = 200
const TEXT_MIN = 200
const TEXT_MAX = 200_000
/** Скільки творів автор може завести за добу. Захист від випадкового циклу
 *  чи вставки всього архіву одним махом, а не недовіра до автора. */
const PER_DAY = 20

type Body = {
  title?: string
  text?: string
  genre?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Потрібно увійти в кабінет' }, { status: 401 })
  }

  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
  }

  const title = String(b.title ?? '').trim()
  const text = String(b.text ?? '').trim()
  const genre = normalizeGenre(String(b.genre ?? '').trim())

  if (title.length < TITLE_MIN) {
    return NextResponse.json({ ok: false, error: 'Вкажіть назву твору' }, { status: 400 })
  }
  if (title.length > TITLE_MAX) {
    return NextResponse.json(
      { ok: false, error: `Назва задовга — максимум ${TITLE_MAX} знаків` },
      { status: 400 },
    )
  }
  if (text.length < TEXT_MIN) {
    return NextResponse.json(
      { ok: false, error: `Текст закороткий — щонайменше ${TEXT_MIN} знаків` },
      { status: 400 },
    )
  }
  if (text.length > TEXT_MAX) {
    return NextResponse.json(
      { ok: false, error: 'Текст завеликий для однієї історії. Поділіть його на частини.' },
      { status: 400 },
    )
  }
  if (!genre) {
    return NextResponse.json({ ok: false, error: 'Виберіть жанр' }, { status: 400 })
  }

  try {
    // --- Ім'я автора ------------------------------------------------------
    // Пишемо в author_name текстом, бо на цьому полі тримається половина
    // сайту (сторінки авторів, черга озвучення, перевірка згоди).
    let authorName = ''
    const prof = await dbQuery(
      `select coalesce(display_name, '') as display_name
         from author_profiles where user_id = $1 limit 1`,
      [user.id],
    )
    authorName = String((prof.rows[0] as { display_name?: string } | undefined)?.display_name ?? '').trim()
    if (!authorName) {
      return NextResponse.json(
        { ok: false, error: 'Спершу заповніть ім’я в кабінеті — воно стоятиме під твором' },
        { status: 400 },
      )
    }

    // --- Скільки вже завів сьогодні --------------------------------------
    const cnt = await dbQuery(
      `select count(*)::int as n from content
        where author_id = $1 and created_at > now() - interval '1 day'`,
      [user.id],
    )
    if (((cnt.rows[0] as { n: number })?.n ?? 0) >= PER_DAY) {
      return NextResponse.json(
        { ok: false, error: `За добу можна додати не більше ${PER_DAY} творів. Решту — завтра.` },
        { status: 429 },
      )
    }

    // --- Той самий заголовок у цього ж автора -----------------------------
    // Не забороняємо, а попереджаємо: два твори з однаковою назвою в одного
    // автора майже завжди означають випадкове подвійне надсилання.
    const same = await dbQuery(
      `select id from content where author_id = $1 and lower(title) = lower($2) limit 1`,
      [user.id, title],
    )
    if (same.rowCount && same.rowCount > 0) {
      return NextResponse.json(
        { ok: false, error: 'Твір із такою назвою у вас уже є. Перевірте перелік творів у кабінеті.' },
        { status: 409 },
      )
    }

    // --- Вільна адреса ----------------------------------------------------
    const base = slugify(title)
    let slug = base
    for (let i = 0; i < 12; i++) {
      const busy = await dbQuery(`select id from content where slug = $1 limit 1`, [slug])
      if (!busy.rowCount) break
      slug = `${base}-${i + 2}`
    }

    const ins = await dbQuery(
      `insert into content
         (type, status, audio_status, slug, title, text, author_id, author_name, genre,
          is_free, is_adult, is_premium, images, writer_note)
       values ('story', 'draft', 'pending', $1, $2, $3, $4, $5, $6,
               false, false, false, '[]'::jsonb, $7)
       returning id::text`,
      [slug, title, text, user.id, authorName, genre, 'додано автором у кабінеті'],
    )

    return NextResponse.json({
      ok: true,
      id: (ins.rows[0] as { id: string }).id,
      slug,
    })
  } catch (err) {
    console.error('[author/new-work]', (err as Error)?.message)
    return NextResponse.json(
      { ok: false, error: 'Не вдалося зберегти твір. Спробуйте ще раз або напишіть на nazar@balabony.com' },
      { status: 500 },
    )
  }
}
