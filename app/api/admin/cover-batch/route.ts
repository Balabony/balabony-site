import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Admin-auth за тим самим патерном, що й решта admin-endpoint'ів.
function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// Генерація обкладинки триває 30-90 с — тому стеля така сама, як у самого
// /api/generate-cover, інакше Vercel обірве виклик на півдорозі.
export const maxDuration = 300

// =============================================================================
// БАТЧ-ПЕРЕГЕНЕРАЦІЯ ОБКЛАДИНОК «БАЛАБОНИ»
// -----------------------------------------------------------------------------
// Фронтенд викликає цей endpoint у циклі, доки done=true. Кожен виклик бере
// ОДНУ серію і генерує їй обкладинку — так нема Vercel-timeout і є прогрес.
//
// ЩО САМЕ БЕРЕТЬСЯ (12.08.2026): тільки серії з cover_meta IS NULL — тобто ті
// 34 зі 102, чиї обкладинки зроблені ПОВЗ нинішню систему (прямим промптом,
// через що обличчя Панаса на них випадкове). Решта 68 уже згенеровані з
// еталонних поз і мають узгоджене обличчя — їх批 не чіпає взагалі.
// Після успішної генерації cover_meta заповнюється, тож серія природно
// вибуває з вибірки й повторно не обробляється.
//
// ПЕРСОНАЖ: 'auto' — /api/generate-cover сам визначає героя за текстом
// (detectProtagonist). Так «Ганин страйк» піде на Ганю без ручного втручання.
//
// ЗБОЇ НЕ ЗУПИНЯЮТЬ ПРОГІН: якщо генерація впала (Replicate 502, таймаут),
// slug додається до списку failed на фронті й цикл іде далі — інакше одна
// невдала серія блокувала б решту (урок із батчу гачків «Тиші»).
// =============================================================================

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let skipSlugs: string[] = []
  try {
    const body = await req.json() as { skipSlugs?: string[] }
    if (Array.isArray(body?.skipSlugs)) skipSlugs = body.skipSlugs.filter(s => typeof s === 'string')
  } catch {
    // тіло не обов'язкове — перший виклик іде без нього
  }

  const supabase = getSupabaseAdmin()

  // Скільки всього серій треба обробити — для прогресу на фронті.
  const { count: total } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'balabony')
    .eq('status', 'published')
    .is('cover_meta', null)

  // Наступна серія без cover_meta, окрім тих, що вже впали в цьому прогоні.
  let query = supabase
    .from('content')
    .select('slug, title, season_number, episode_number')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .is('cover_meta', null)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })
    .limit(1)

  if (skipSlugs.length > 0) {
    query = query.not('slug', 'in', `(${skipSlugs.map(s => `"${s}"`).join(',')})`)
  }

  const { data: rows, error } = await query
  if (error) {
    return NextResponse.json({ error: `DB: ${error.message}` }, { status: 500 })
  }

  const row = rows?.[0]
  if (!row) {
    return NextResponse.json({ done: true, total: total ?? 0, remaining: 0 })
  }

  // Викликаємо наявний генератор — не дублюємо його логіку (пози, локації,
  // золота рамка, запис cover_url/cover_meta вже реалізовані там).
  const origin = req.nextUrl.origin
  try {
    const res = await fetch(`${origin}/api/generate-cover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // прокидаємо admin-куку, бо generate-cover теж під авторизацією
        Cookie: req.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({
        seriesId: row.slug,
        title: row.title,
        description: '',
        character: 'auto',
      }),
    })

    const data = await res.json() as { url?: string; error?: string }

    if (!res.ok || !data.url) {
      return NextResponse.json({
        done: false,
        total: total ?? 0,
        failedSlug: row.slug,
        processed: {
          slug: row.slug,
          title: row.title,
          season: row.season_number,
          episode: row.episode_number,
        },
        error: data.error ?? `HTTP ${res.status}`,
      })
    }

    return NextResponse.json({
      done: false,
      total: total ?? 0,
      processed: {
        slug: row.slug,
        title: row.title,
        season: row.season_number,
        episode: row.episode_number,
        url: data.url,
      },
    })
  } catch (e) {
    return NextResponse.json({
      done: false,
      total: total ?? 0,
      failedSlug: row.slug,
      processed: {
        slug: row.slug,
        title: row.title,
        season: row.season_number,
        episode: row.episode_number,
      },
      error: e instanceof Error ? e.message : 'невідома помилка',
    })
  }
}
