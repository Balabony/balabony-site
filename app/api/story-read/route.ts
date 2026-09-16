import { NextResponse } from 'next/server'
import { resolveReaderId } from '@/lib/reader-id'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'

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

/**
 * Чи йде це прочитання в розрахунок винагороди.
 *
 * За договором не враховуються (ні у показниках автора, ні в загальній
 * кількості) два випадки:
 *   п. 3.4    — промо-покази: твір відкрито безкоштовно з рекламною метою;
 *   п. 3.4-1  — соціальний доступ: читач пільгової категорії.
 *
 * Позначку ставимо В МОМЕНТ читання і зберігаємо в рядку. Перераховувати
 * потім не можна: і статус читача, і безкоштовність твору з часом
 * змінюються, а нарахування за минулий місяць має лишитися таким, яким було.
 */
async function isPayable(contentId: string, promo: boolean): Promise<boolean> {
  const db = getSupabaseAdmin()

  // Промо, оголошене сторінкою. Для серій безкоштовність визначається не
  // колонкою is_free, а місцем серії в сезоні: перші дві відкриті всім
  // саме з рекламною метою. Сторінка знає це правило, база — ні.
  if (promo) return false

  // Промо: твір відкрито безкоштовно
  const { data: content } = await db
    .from('content')
    .select('is_free')
    .eq('id', contentId)
    .maybeSingle()
  if (content?.is_free === true) return false

  // Соціальний доступ: чинний пільговий статус у залогіненого читача.
  // Анонімний відвідувач пільги мати не може — вона підтверджується в кабінеті.
  try {
    const auth = await createSupabaseServerClient()
    const { data: { user } } = await auth.auth.getUser()
    if (user) {
      const { data: benefit } = await db
        .from('benefit_status')
        .select('valid_until')
        .eq('user_id', user.id)
        .maybeSingle()
      if (benefit) {
        const until = benefit.valid_until ? new Date(benefit.valid_until) : null
        if (!until || until.getTime() >= Date.now()) return false
      }
    }
  } catch {
    // Не вдалося з'ясувати статус — рахуємо як звичайне прочитання.
    // Помилятися на користь автора чесніше, ніж мовчки його обділити.
  }

  return true
}

/** Поточна дата за Києвом у форматі YYYY-MM-DD. */
function kyivToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

export async function POST(req: Request) {
  try {
    const userId = await resolveReaderId()
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

    // Ідентифікатор сесії і згода на аналітику приходять із того самого
    // запиту — див. коментар біля запису story_events нижче.
    const sessionId =
      typeof body?.sessionId === 'string' ? body.sessionId.slice(0, 100) : null
    const analytics = body?.analytics === true

    // Позначку промо ставить сторінка. Відсутня — вважаємо звичайним твором.
    const promo = body?.promo === true

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
          // Проставляємо явно, хоч замовчування в колонці теж false.
          // До 16.09.2026 замовчування було true, і 486 рядків про ВІДКРИТТЯ
          // лежали позначені як такі, що йдуть у виплату — при 141 дочитаному.
          // Поле, від якого залежать гроші, не має покладатися на налаштування
          // бази: одна зміна там — і помилка повертається мовчки.
          counts_for_payout: false,
        },
        { onConflict: 'user_id,content_id,read_date', ignoreDuplicates: true },
      )
      return NextResponse.json({ ok: true })
    }

    // Нижче договірного порогу прочитанням не вважаємо.
    if (percent < 70) {
      return NextResponse.json({ ok: true, counted: false })
    }

    const payable = await isPayable(contentId, promo)

    // read: закриваємо рядок за сьогодні, якщо він ще не закритий
    const { data: updated } = await db
      .from('article_reads')
      .update({
        read_at:            new Date().toISOString(),
        time_spent_seconds: dwell,
        completed:          true,
        read_percentage:    percent,
        counts_for_payout:  payable,
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
          counts_for_payout:  payable,
        },
        { onConflict: 'user_id,content_id,read_date', ignoreDuplicates: true },
      )
    }

    // Подія для аналітики пишеться ТУТ, а не окремим запитом з браузера.
    //
    // Було: клієнт паралельно бив у /api/story-read і /api/analytics/track.
    // Обидва запити з keepalive, але доставку він не гарантує: читач дочитує
    // й одразу закриває вкладку, один долітає, другий ні. Вимір 16.09.2026:
    // у story_events виявилося 71 подію 'read', якій у article_reads немає
    // пари навіть за той самий день. Основна маса (62) — червень-липень,
    // стара історія, але 9 припали на серпень-вересень, тобто розходження
    // тривало. Тепер або записуються обидві таблиці, або жодна.
    //
    // Згоду перевіряємо, бо Політика cookies обіцяє: до згоди аналітичні дані
    // не збираються. Прапорець шле клієнт — там, де читається cookie згоди.
    //
    // Подію 'open' сюди НЕ переносимо: через /api/analytics/track вона ще
    // оновлює content.views_count, і це окремий шлях.
    if (analytics) {
      try {
        await db.from('story_events').insert({
          story_id:         contentId,
          story_title:      title,
          event_type:       'read',
          duration_seconds: dwell,
          session_id:       sessionId,
          content_id:       contentId,
        })
      } catch (e) {
        // Аналітика не має ламати зарахування прочитання.
        console.error('[story-read] story_events', (e as Error)?.message)
      }
    }

    return NextResponse.json({ ok: true, counted: true, payable })
  } catch {
    // Облік не повинен ламати читання: помилку ковтаємо мовчки.
    return NextResponse.json({ ok: false })
  }
}
