import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Admin-auth за тим самим патерном, що й решта admin-endpoint'ів.
function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

/**
 * Батч-генерація гачка «ДАЛІ БУДЕ» (next_teaser) «по одному»: фронтенд
 * викликає endpoint у циклі, доки done=true.
 *
 * НАВІЩО. Блок «ДАЛІ БУДЕ» під текстом серії (EpisodeCliffhanger) бере саме
 * next_teaser. Вимір 16.09.2026: поле заповнене лише в 3 серіях із 25 —
 * решта 22 обриваються нічим. Кліфгенгер — головний інструмент серіальної
 * прози, механізм зроблено, і він порожній на 88% серій. Зі 124 читачів
 * першої серії до другої дійшло 8.
 *
 * ЧИМ ВІДРІЗНЯЄТЬСЯ ВІД СУСІДНІХ ПОЛІВ:
 *  - recap        = СПОЙЛЕРНЕ резюме «що було раніше», про ПОПЕРЕДНЮ серію;
 *  - short_script = тизер ~70-90 слів для анонсу чи шорту, про ЦЮ серію;
 *  - hook         = одне речення на КАРТЦІ каталогу, про ЦЮ серію;
 *  - next_teaser  = гачок у кінці ЦІЄЇ серії, що веде в НАСТУПНУ.
 *
 * Тому, на відміну від hook-batch, модель тут дістає текст НАСТУПНОЇ серії:
 * гачок, написаний із поточної, обіцяв би не те, що читач знайде за кнопкою.
 *
 * Остання серія сезону пропускається: вести нема куди.
 * Уже наявні next_teaser НЕ чіпаються — запуск можна повторювати.
 */

type Row = {
  id: string
  title: string | null
  text: string | null
  corrected_text: string | null
  humanized_text: string | null
  published_version: string | null
  next_teaser: string | null
  season_number: number | null
  episode_number: number | null
}

/** Та сама логіка, що в lib/readingTime.ts: який текст справді опубліковано. */
function body(c: Row): string {
  const v = c.published_version ?? 'original'
  if ((v === 'humanized' || v === 'corrected_humanized') && c.humanized_text) return c.humanized_text
  if (v === 'corrected' && c.corrected_text) return c.corrected_text
  return c.text ?? ''
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  const supabase = getSupabaseAdmin()

  // Беремо ВЕСЬ сезонний ряд одним запитом: щоб знайти наступну серію, треба
  // бачити сусіда. Епізодів десятки, не тисячі — вибірка дешева.
  const { data: all, error: selErr } = await supabase
    .from('content')
    .select('id, title, text, corrected_text, humanized_text, published_version, next_teaser, season_number, episode_number')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }

  const rows = (all ?? []) as Row[]

  // Кандидат: немає гачка, є власний текст, і є наступна серія того ж сезону.
  const idx = rows.findIndex((c, i) => {
    const empty = !(c.next_teaser ?? '').trim()
    const next = rows[i + 1]
    const sameSeason = next && next.season_number === c.season_number
    return empty && body(c).trim().length > 0 && sameSeason && body(next).trim().length > 0
  })

  const total = rows.length
  const remainingBefore = rows.filter((c, i) => {
    const next = rows[i + 1]
    return !(c.next_teaser ?? '').trim() && next && next.season_number === c.season_number
  }).length

  if (idx === -1) {
    return NextResponse.json({ done: true, total, remaining: 0, processed: null })
  }

  const target = rows[idx]
  const next = rows[idx + 1]

  // Кінець поточної серії потрібен, щоб гачок звучав як продовження думки,
  // а не як окремий анонс. Початок наступної — щоб обіцяти те, що там справді є.
  const tail = body(target).trim().slice(-1200)
  const head = body(next).trim().slice(0, 2000)

  const prompt = `Ти — оповідач україномовного серіалу «Балабони» (тепла комедія характерів про життя українського села: дід Панас з його «інноваціями», баба Ганя, кум, онуки).

Напиши блок «ДАЛІ БУДЕ» — два-три речення в кінці серії, які ведуть читача в НАСТУПНУ серію.

ГОЛОВНЕ: це місток. Ти щойно дочитав серію — і хочеш дізнатися, що буде далі.

ФОРМАТ:
- 2-3 короткі речення, разом до ~45 слів.
- Починай від того, чим щойно скінчилася ця серія, і переводь у наступну.
- Проста жива мова з теплим сільським гумором, як у самому серіалі.
- Обірви на інтризі.

ЗАБОРОНЕНО:
- Розв'язка наступної серії — лише обіцянка, не відповідь.
- Заклики «читай далі», «не пропусти», «дізнайся» — гачок працює сам.
- Канцелярит, штампи «але раптом», «усе змінилося назавжди».
- Імена й події, яких немає в наданих текстах. Латиниця в назвах (пиши кирилицею: вайбер, тікток).

ДОБРИЙ ЗРАЗОК (із серії 2 цього ж серіалу):
«Тієї ночі Панас дивився на зорі й думав про супутники. А вранці…»

Поверни ТІЛЬКИ текст гачка українською, без лапок навколо нього, без пояснень і без заголовків.

Чим закінчилася серія «${target.title ?? ''}»:
"""
${tail}
"""

Про що наступна серія «${next.title ?? ''}»:
"""
${head}
"""`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash', generationConfig: { temperature: 0.8 } },
      { apiVersion: 'v1beta' },
    )
    const result = await model.generateContent(prompt)
    const teaser = result.response.text().trim().replace(/^["«»]+|["«»]+$/g, '').trim()

    if (!teaser) {
      return NextResponse.json({ error: 'Порожня відповідь AI', targetId: target.id }, { status: 502 })
    }

    const { error: updErr } = await supabase
      .from('content')
      .update({ next_teaser: teaser })
      .eq('id', target.id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message, targetId: target.id }, { status: 500 })
    }

    return NextResponse.json({
      done: false,
      total,
      remaining: Math.max(0, remainingBefore - 1),
      processed: {
        id: target.id,
        title: target.title,
        season: target.season_number,
        episode: target.episode_number,
        teaser,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg, targetId: target.id }, { status: 500 })
  }
}
