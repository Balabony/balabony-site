import { NextResponse } from 'next/server'
import { getStripAuthors } from '@/lib/home-data'

/**
 * Автори для рядка «Наші автори» на головній.
 *
 * Показуємо тільки тих, хто:
 *   — активний (is_active),
 *   — не сховався перемикачем hide_from_directory,
 *   — має щонайменше один опублікований твір: порожня сторінка автора гірша
 *     за його відсутність у стрічці,
 *   — має фотографію.
 *
 * Вимога фото — свідома. Рядок із золотих кружечків з ініціалами виглядає
 * порожньо і нічого не додає читачеві. Заразом це стимул: автор бачить, що
 * фото справді виводить його на головну, і надсилає його.
 *
 * Порядок — щоденна ротація тим самим механізмом, що у «Свіжих історіях»:
 * номер доби зсуває вікно. Детерміновано, тому всі відвідувачі за добу
 * бачать однакове і кеш на межі мережі працює.
 *
 * Роут існує окремо від сторінки, бо app/page.tsx — клієнтський компонент:
 * серверний доступ до бази в ньому неможливий.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = parseInt(searchParams.get('limit') ?? '', 10)
  const limit = Number.isFinite(parsed) ? Math.max(1, Math.min(50, parsed)) : 8

  const authors = await getStripAuthors(limit)

  return NextResponse.json(authors, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  })
}
