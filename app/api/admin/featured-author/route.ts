import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { featuredCandidates, featuredThisWeek, setFeatured, weekStart, currentFeaturedSlug } from '@/lib/featured-author'

/** Автор тижня: GET — поточний і кандидати; POST {user_id, slug, name} — поставити на цей тиждень (21.10.2026). */
function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Немає доступу' }, { status: 401 })
  try {
    const [week, current, candidates] = await Promise.all([featuredThisWeek(), currentFeaturedSlug(), featuredCandidates(15)])
    return NextResponse.json({ weekStart: weekStart(), week, current, candidates })
  } catch (e) { return NextResponse.json({ error: (e as Error)?.message ?? 'помилка' }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Немає доступу' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { user_id?: string; slug?: string; name?: string }
  if (!b.user_id || !b.slug) return NextResponse.json({ error: 'Оберіть автора' }, { status: 400 })
  try {
    await setFeatured(b.user_id, b.slug, String(b.name ?? ''), 'admin')
    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: (e as Error)?.message ?? 'помилка' }, { status: 500 }) }
}
