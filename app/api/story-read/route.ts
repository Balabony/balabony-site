import { NextResponse } from 'next/server'
import { getOrCreateAnonUserId } from '@/lib/anon-user'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Облік прочитань творів авторів (article_reads).
 *
 * Навіщо окремо від /api/reads: той пише в user_episode_reads і рахує СЕРІЇ
 * («Балабони», «Тиша») для балів читача. Тут інша задача — база для
 * винагороди автора за договором (п. 1.5, 5.2), тому потрібна прив'язка до
 * content_id і чесний поріг «дочитав», а не «відкрив».
 *
 * Дві події на один рядок:
 *   open — створюється рядок (opened_at). Одне відкриття на людину й твір.
 *   read — проставляється read_at + completed, ЛИШЕ якщо read_at ще порожній.
 *          Повторне перечитування не додає авторові другого прочитання.
 *
 * Унікальність (user_id, content_id) — на рівні БД, не коду: клієнт може
 * надіслати що завгодно, база все одно не пустить дубль.
 *
 * article_slug / article_title дублюють content навмисно: якщо твір колись
 * приберуть, у звіті лишиться видно, за що саме нараховувалось.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

    const db = getSupabaseAdmin()

    if (event === 'open') {
      await db.from('article_reads').upsert(
        {
          user_id:       userId,
          content_id:    contentId,
          article_slug:  slug,
          article_title: title,
          completed:     false,
          read_percentage: 0,
        },
        { onConflict: 'user_id,content_id', ignoreDuplicates: true },
      )
      return NextResponse.json({ ok: true })
    }

    // read: закриваємо лише ще не закритий рядок
    const { data: updated } = await db
      .from('article_reads')
      .update({
        read_at:            new Date().toISOString(),
        time_spent_seconds: dwell,
        completed:          true,
        read_percentage:    100,
      })
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .is('read_at', null)
      .select('id')

    // Рядка не було (наприклад, open не дійшов через мережу) — створюємо
    // одразу закритим, щоб прочитання не загубилось.
    if (!updated || updated.length === 0) {
      await db.from('article_reads').upsert(
        {
          user_id:            userId,
          content_id:         contentId,
          article_slug:       slug,
          article_title:      title,
          read_at:            new Date().toISOString(),
          time_spent_seconds: dwell,
          completed:          true,
          read_percentage:    100,
        },
        { onConflict: 'user_id,content_id', ignoreDuplicates: true },
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    // Облік не повинен ламати читання: помилку ковтаємо мовчки.
    return NextResponse.json({ ok: false })
  }
}
