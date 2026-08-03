import { NextResponse } from 'next/server'
import { getOrCreateAnonUserId } from '@/lib/anon-user'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Облік прочитань творів авторів (article_reads) — база для винагороди
 * за договором, п. 1.5 і 5.2.
 *
 * Навіщо окремо від /api/reads: той пише в user_episode_reads і рахує СЕРІЇ
 * («Балабони», «Тиша») для балів читача. Тут інша задача — гроші автора,
 * тому потрібна прив'язка до content_id і чесний поріг «дочитав».
 *
 * ОДИН РАЗ НА ДОБУ, а не один раз назавжди. Договір дозволяє зараховувати
 * прочитання того самого твору тим самим читачем щодня. Раніше унікальність
 * стояла на парі (user_id, content_id), тож постійний читач давав авторові
 * рівно одне прочитання за все життя — для серіалів і улюблених історій це
 * була систематична недоплата. Тепер у ключі є ще й дата.
 *
 * Дата — київська: доба має закінчуватися опівночі за Києвом, а не за UTC,
 * інакше вечірнє читання попадало б у наступний день.
 *
 * article_slug / article_title дублюють content навмисно: якщо твір колись
 * приберуть, у звіті лишиться видно, за що саме нараховувалось.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Поточна дата за Києвом у форматі YYYY-MM-DD. */
function kyivToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

export async function POST(req: Request) {
  try {
    const userId = await getOrCreateAnonUserId()
    const body = await req.json().catch(() => ({}))

    const contentId = typeof body?.contentId === 'string' ? body.contentId : ''
    if (!UUID_RE.test(contentId)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const slug =
      typeof body?.slug === 'string' ? body.slug.slice(0, 200) : null
    const title =
      typeof body?.title === 'string' ? body.title.slice(0, 300) : null

    const event = body?.event === 'read' ? 'read' : 'open'

    const rawDwell = Number(body?.dwellSeconds)
    // Стеля 4 години: захист від забутих вкладок, що накручують час.
    const dwell =
      Number.isFinite(rawDwell) && rawDwell > 0
        ? Math.min(Math.round(rawDwell), 14400)
        : null

    // Скільки тексту побачив читач. Клієнт шле фактичну частку; нижче 70%
    // подія «read» не надсилається взагалі, але межу дублюємо і тут.
    const rawPercent = Number(body?.percent)
    const percent =
      Number.isFinite(rawPercent) ? Math.max(0, Math.min(100, Math.round(rawPercent))) : 0

    const readDate = kyivToday()
    const db = getSupabaseAdmin()

    if (event === 'open') {
      await db.from('article_reads').upsert(
        {
          user_id:         userId,
          content_id:      contentId,
          read_date:       readDate,
          article_slug:    slug,
          article_title:   title,
          completed:       false,
          read_percentage: 0,
        },
        { onConflict: 'user_id,content_id,read_date', ignoreDuplicates: true },
      )
      return NextResponse.json({ ok: true })
    }

    // Нижче договірного порогу прочитанням не вважаємо.
    if (percent < 70) {
      return NextResponse.json({ ok: true, counted: false })
    }

    // read: закриваємо рядок за сьогодні, якщо він ще не закритий
    const { data: updated } = await db
      .from('article_reads')
      .update({
        read_at:            new Date().toISOString(),
        time_spent_seconds: dwell,
        completed:          true,
        read_percentage:    percent,
      })
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('read_date', readDate)
      .is('read_at', null)
      .select('id')

    // Рядка не було (наприклад, open не дійшов через мережу) — створюємо
    // одразу закритим, щоб прочитання не загубилось.
    if (!updated || updated.length === 0) {
      await db.from('article_reads').upsert(
        {
          user_id:            userId,
          content_id:         contentId,
          read_date:          readDate,
          article_slug:       slug,
          article_title:      title,
          read_at:            new Date().toISOString(),
          time_spent_seconds: dwell,
          completed:          true,
          read_percentage:    percent,
        },
        { onConflict: 'user_id,content_id,read_date', ignoreDuplicates: true },
      )
    }

    return NextResponse.json({ ok: true, counted: true })
  } catch {
    // Облік не повинен ламати читання: помилку ковтаємо мовчки.
    return NextResponse.json({ ok: false })
  }
}
