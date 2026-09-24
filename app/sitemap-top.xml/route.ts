import { getMostFinished } from '@/lib/most-finished'
import { workPath } from '@/lib/rss'

/**
 * /sitemap-top.xml — окрема карта сайту з сотнею найкращих творів (24.09.2026).
 *
 * Основна /sitemap.xml містить усе (~1 100 адрес), і Google сам вирішує,
 * що з цього сканувати. Ця карта — наш сигнал «почни звідси». Її додають
 * в Search Console окремо, і там з'являється окремий звіт: скільки саме
 * з найкращих творів уже в пошуку. Та сама адреса в двох картах — це
 * нормально, Google їх не плутає.
 *
 * lastmod — лише справжня дата (approved_at або created_at). Дата
 * генерації тут була б брехнею, і Google перестав би їй вірити.
 */

export const revalidate = 3600

const BASE_URL = 'https://balabony.com'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET() {
  const items = await getMostFinished(100)
  const rows = items
    .map((it) => {
      const loc = `${BASE_URL}${workPath(it.type, it.slug)}`
      const lastmod = it.stamp ? `\n    <lastmod>${new Date(it.stamp).toISOString()}</lastmod>` : ''
      return `  <url>\n    <loc>${esc(loc)}</loc>${lastmod}\n  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
