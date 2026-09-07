import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Числа для рядка фактів під гаслом: /api/stats
 *
 * Рахуємо живим запитом, а не вписуємо в розмітку: цифра, вбита в код,
 * застаріває за тиждень і починає брехати читачеві.
 *
 * Авторів рахуємо за підписом (author_name), а не за профілями. Більшість
 * творів прийшла з газет і належить людям, які кабінету ще не заводили;
 * рахувати профілі означало б применшити вчетверо. Підпис — це те, що
 * читач бачить під текстом, і саме його ми й називаємо автором.
 *
 * Беремо лише те, що справді видно на сайті: approved або published —
 * той самий набір статусів, що й на публічних сторінках.
 */

const LIVE = ['approved', 'published']
const PAGE = 1000

export const revalidate = 3600

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    let works = 0
    const names = new Set<string>()
    let fresh = 0

    const since = new Date(Date.now() - 30 * 86400000).toISOString()

    // Сторінками: Supabase мовчки віддає максимум 1000 рядків, і без цього
    // всі числа завмерли б на тисячі.
    for (let from = 0; from < 100_000; from += PAGE) {
      const { data, error } = await supabase
        .from('content')
        .select('author_name, created_at')
        .in('status', LIVE)
        .range(from, from + PAGE - 1)

      if (error || !data) break

      for (const r of data as { author_name: string | null; created_at: string | null }[]) {
        works++
        const n = (r.author_name ?? '').trim()
        if (n) names.add(n.toLowerCase())
        if (r.created_at && r.created_at >= since) fresh++
      }

      if (data.length < PAGE) break
    }

    if (works === 0) return NextResponse.json({ works: 0, authors: 0, fresh: 0 })

    return NextResponse.json(
      { works, authors: names.size, fresh },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    )
  } catch {
    return NextResponse.json({ works: 0, authors: 0, fresh: 0 }, { status: 500 })
  }
}
