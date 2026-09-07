import { getSupabaseAdmin } from '@/lib/supabase-server'
import { toExcerpt } from '@/lib/plain-text'
import { pickPublishedText } from '@/lib/published-text'

/**
 * Дані головної, зібрані на сервері.
 *
 * Головна була клієнтською: серії й історії підвантажувалися fetch'ем уже в
 * браузері, тому в HTML, який отримує Google, стояла порожня оболонка — ні
 * назв, ні авторів, ні тизерів. Тут ті самі запити виконуються на сервері,
 * а сторінка віддає готовий текст.
 *
 * Логіка ротації спільна з /api/stories — вона імпортує rotateDaily звідси,
 * щоб набір на сервері й через роут не розходився.
 */

export type HomeStory = {
  id: string
  title: string
  author: string
  coverUrl: string
  coverPosition?: string
  tags: string[]
  hasAudio: boolean
  teaser: string
  url: string
  genre?: string
  duration_minutes?: number
  category?: string
  isAdult?: boolean
}

export type HomeSeries = {
  id: string
  number: number
  season: number
  title: string
  coverUrl: string
  hasAudio: boolean
  url: string
  description?: string
  teaser?: string
  durationMinutes?: number
}

type Row = { id: string; author_name: string | null; approved_at: string | null }

/** Крок ротації вітрини. Мусить збігатися з s-maxage у /api/stories. */
export const ROTATION_STEP_MS = 3 * 60 * 60 * 1000

/**
 * Ротація вітрини без випадковості.
 *
 * 1. Лишаємо по одному твору на автора — інакше три поспіль від однієї людини.
 * 2. Сортуємо стабільно: свіжіші вперед, id як запасний ключ. approved_at
 *    буває null, тому порівняння через рядок, а не через Date.
 * 3. Твори останніх 7 днів завжди стоять першими — розділ називається
 *    «Свіжі історії» і не повинен ховати новинку через ротацію.
 * 4. Решту крутимо вікном: номер тригодинного відрізка × limit зі згортанням
 *    через кінець.
 */
export function rotateDaily<T extends Row>(rows: T[], limit: number): T[] {
  const seen = new Set<string>()
  const unique: T[] = []
  for (const r of rows) {
    const key = (r.author_name ?? r.id).trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(r)
  }

  unique.sort((a, b) => {
    const av = a.approved_at ?? ''
    const bv = b.approved_at ?? ''
    if (av !== bv) return av < bv ? 1 : -1
    return a.id < b.id ? -1 : 1
  })

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const fresh = unique.filter(r => r.approved_at !== null && Date.parse(r.approved_at) >= weekAgo)
  const rest  = unique.filter(r => !(r.approved_at !== null && Date.parse(r.approved_at) >= weekAgo))

  const out = fresh.slice(0, limit)
  const need = limit - out.length
  if (need <= 0 || rest.length === 0) return out

  const slot = Math.floor(Date.now() / ROTATION_STEP_MS)
  const start = ((slot * limit) % rest.length + rest.length) % rest.length
  for (let i = 0; i < need; i++) {
    out.push(rest[(start + i) % rest.length])
  }
  return out
}

export function buildTeaser(text: string): string {
  const stripped = toExcerpt(text, 100000)
  if (stripped.length <= 200) return stripped
  const cut = stripped.slice(0, 200)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut) + '…'
}

/** Свіжі історії для головної: без казок, з ротацією, по одному твору на автора. */
export async function getFreshStories(limit = 6): Promise<HomeStory[]> {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('content')
      .select('id, slug, title, author_name, genre, text, cover_url, cover_position, published_version, corrected_text, humanized_text, approved_at, duration_minutes, category, is_adult')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      // NULL != 'Казка' у SQL дає NULL, тому .neq() мовчки викидає історії
      // з порожнім жанром. Явно лишаємо і їх.
      .or('genre.is.null,genre.neq.Казка')
      .order('approved_at', { ascending: false, nullsFirst: false })
      .limit(500)

    if (error) throw error

    return rotateDaily(data ?? [], limit).map(s => ({
      id:               s.id,
      title:            s.title,
      author:           s.author_name,
      coverUrl:         s.cover_url ?? '/og-image.jpg',
      coverPosition:    s.cover_position ?? 'center',
      tags:             [s.genre],
      hasAudio:         false,
      teaser:           buildTeaser(pickPublishedText(s)),
      url:              `/stories/${s.slug ?? s.id}`,
      genre:            s.genre ?? undefined,
      duration_minutes: s.duration_minutes ?? undefined,
      category:         s.category ?? undefined,
      isAdult:          s.is_adult ?? false,
    }))
  } catch {
    // Порожній масив ховає секцію — сторінка малюється без неї.
    return []
  }
}

/** Якщо тривалість не задана в базі — рахуємо орієнтовний час читання (~150 слів/хв). */
function estimateMinutes(text?: string | null): number | undefined {
  if (!text) return undefined
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return words ? Math.max(1, Math.round(words / 150)) : undefined
}

/** Перші серії «Балабонів» для стрічки на головній. */
export async function getHomeSeries(limit = 3): Promise<HomeSeries[]> {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('content')
      .select('slug, episode_number, season_number, title, cover_url, audio_status, description, short_script, duration_minutes, text, hook')
      .eq('type', 'balabony')
      .eq('status', 'published')
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true })
      .limit(limit)

    if (error) throw error

    return (data ?? []).map(r => ({
      id:       r.slug,
      number:   r.episode_number,
      season:   r.season_number,
      title:    r.title,
      coverUrl: r.cover_url ?? '/og-image.jpg',
      hasAudio: r.audio_status === 'ready',
      url:      `/episodes/${r.slug}`,
      description: r.description ?? undefined,
      // Для Балабонів description — переказ зі спойлерами, у тизер його не пускаємо.
      teaser:   r.hook ?? r.short_script ?? undefined,
      durationMinutes: r.duration_minutes ?? estimateMinutes(r.text),
    }))
  } catch {
    return []
  }
}
