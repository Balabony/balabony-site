import { getSupabaseAdmin } from '@/lib/supabase-server'
import { toExcerpt } from '@/lib/plain-text'
import { pickPublishedText } from '@/lib/published-text'
import { readingMinutes } from '@/lib/readingTime'
import { GENRES } from '@/lib/genres'
import { authorSlug } from '@/lib/author-slug'

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

/**
 * Крок ротації вітрини — 12 годин, тобто набір змінюється двічі на добу.
 * Межі відрізків рахуються від епохи, тож зміна припадає на 00:00 і 12:00 UTC
 * (03:00 і 15:00 за київським часом).
 *
 * Кеш (s-maxage у /api/stories, revalidate на головній) лишається 3 години —
 * він має бути НЕ БІЛЬШИЙ за крок ротації, інакше зміна не буде видна вчасно.
 * Коротший кеш також дає новому твору потрапити на сайт швидше.
 */
export const ROTATION_STEP_MS = 12 * 60 * 60 * 1000

/**
 * Скільки перших карток закріплено за найновішими творами.
 * 0 = крутяться всі, без винятків (рішення Богдана 08.09.2026).
 */
export const PINNED_FRESH = 0

/**
 * Ротація вітрини без випадковості.
 *
 * 1. Лишаємо по одному твору на автора — інакше три поспіль від однієї людини.
 * 2. Сортуємо стабільно: свіжіші вперед, id як запасний ключ. approved_at
 *    буває null, тому порівняння через рядок, а не через Date.
 * 3. Перші PINNED_FRESH карток закріплені за найновішими творами. Зараз 0 —
 *    крутяться всі.
 * 4. Крутимо вікном: номер дванадцятигодинного відрізка зі згортанням через
 *    кінець. У пулі — ВЕСЬ масив, і свіже, і давнє.
 *
 * Так було до 08.09.2026: першими ставили всі твори за останні 7 днів, і якщо
 * їх набиралося шість, ротація не спрацьовувала взагалі — головна замерзала
 * на тиждень. Богдан це побачив: дві історії стояли кілька днів поспіль.
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

  const out  = fresh.slice(0, PINNED_FRESH)
  const pool = [...fresh.slice(PINNED_FRESH), ...rest]

  const need = limit - out.length
  if (need <= 0 || pool.length === 0) return out.slice(0, limit)

  const slot  = Math.floor(Date.now() / ROTATION_STEP_MS)
  const start = ((slot * need) % pool.length + pool.length) % pool.length
  for (let i = 0; i < need && i < pool.length; i++) {
    out.push(pool[(start + i) % pool.length])
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

/** Якщо тривалість не задана в базі — рахуємо орієнтовний час читання (~150 слів/хв). */
function estimateMinutes(text?: string | null): number | undefined {
  if (!text) return undefined
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return words ? Math.max(1, Math.round(words / 150)) : undefined
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Рядок content → картка історії. Спільний формат для вітрини й казок. */
export function mapStory(s: any): HomeStory {
  return {
    id:               s.id,
    title:            s.title,
    author:           s.author_name,
    coverUrl:         s.cover_url ?? '/og-image.jpg',
    coverPosition:    s.cover_position ?? 'center',
    tags:             [s.genre].filter(Boolean),
    hasAudio:         false,
    teaser:           buildTeaser(pickPublishedText(s)),
    url:              `/stories/${s.slug ?? s.id}`,
    genre:            s.genre ?? undefined,
    // Час читання: у частини творів duration_minutes у базі порожній, і
    // картка лишалася без тегу. Рахуємо з тексту так само, як для серій.
    duration_minutes: s.duration_minutes ?? estimateMinutes(pickPublishedText(s)),
    category:         s.category ?? undefined,
    isAdult:          s.is_adult ?? false,
  }
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

    return rotateDaily(data ?? [], limit).map(mapStory)
  } catch {
    // Порожній масив ховає секцію — сторінка малюється без неї.
    return []
  }
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

/** Казки для головної. Той самий формат картки, що й у свіжих історій. */
export async function getFairytales(limit = 3): Promise<HomeStory[]> {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('content')
      .select('id, slug, title, author_name, genre, text, cover_url, cover_position, published_version, corrected_text, humanized_text, approved_at, duration_minutes, category, is_adult')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .eq('genre', 'Казка')
      .order('approved_at', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) throw error

    return (data ?? []).map(mapStory)
  } catch {
    return []
  }
}

export type TyshaItem = {
  id: string
  number: number | null
  season?: number | null
  title: string
  cover_url: string | null
  cover_position?: string | null
  has_audio: boolean
  url: string
  description: string | null
  duration_minutes?: number
  next_teaser?: string | null
}

/**
 * Перше «чисте» речення: прибираємо рядки-репліки «Імʼя: …» і беремо
 * оповідний початок. Той самий код використовує /api/tysha.
 */
export function makeExcerpt(text?: string | null, max = 160): string | null {
  if (!text) return null
  const clean = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^[\p{Lu}][\p{L}'\u02bc\- ]{1,23}:\s/u.test(l))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  const base = clean || text.replace(/\s+/g, ' ').trim()
  if (base.length <= max) return base
  const cut = base.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '\u2026'
}

/**
 * Серії «Тиші»: published або scheduled, чий час уже настав — так планувальник
 * публікує серію в заданий момент навіть на дешевому тарифі.
 */
export async function getTyshaItems(limit?: number): Promise<TyshaItem[]> {
  try {
    const nowIso = new Date().toISOString()
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('content')
      .select('slug, episode_number, season_number, title, cover_url, cover_position, audio_status, description, short_description, text, corrected_text, humanized_text, published_version, hook, next_teaser')
      .eq('type', 'tysha')
      .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${nowIso})`)
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true })

    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) throw error

    return (data ?? []).map((r) => ({
      id: r.slug,
      number: r.episode_number,
      season: r.season_number,
      title: r.title,
      cover_url: r.cover_url,
      cover_position: r.cover_position ?? null,
      has_audio: r.audio_status === 'ready',
      url: `/tysha/${r.slug}`,
      description: r.hook ?? r.short_description ?? r.description ?? makeExcerpt(r.text) ?? null,
      duration_minutes: readingMinutes(r) || undefined,
      next_teaser: r.next_teaser ?? null,
    }))
  } catch {
    return []
  }
}

export type GenreCount = { genre: string; count: number }

/**
 * Кількість опублікованих історій у кожному жанрі.
 *
 * Жанр без жодного твору у відповідь не потрапляє: читач, який натиснув
 * «Детектив» і побачив порожньо, більше не натисне нічого.
 *
 * Рахуємо запитами count по кожному жанру, а не вибіркою всіх творів:
 * рядків уже понад тисячу, і тягнути їх заради дев'яти чисел марно.
 */
export async function getGenreCounts(): Promise<GenreCount[]> {
  try {
    const db = getSupabaseAdmin()

    const counts = await Promise.all(
      GENRES.map(async (genre) => {
        const { count } = await db
          .from('content')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'story')
          .in('status', ['approved', 'published'])
          .eq('genre', genre)
        return { genre, count: count ?? 0 }
      }),
    )

    return counts.filter((g) => g.count > 0)
  } catch {
    return []
  }
}

export type SiteStats = { works: number; authors: number; fresh: number }

/**
 * Числа для рядка фактів під гаслом.
 *
 * Авторів рахуємо за підписом (author_name), а не за профілями: більшість
 * творів прийшла з газет від людей без кабінету, і рахунок профілів
 * применшив би вчетверо. Лише type='story' — епізоди серіалів читач
 * історіями не називає.
 */
export async function getSiteStats(): Promise<SiteStats> {
  const PAGE = 1000
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
        .eq('type', 'story')
        .in('status', ['approved', 'published'])
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

    return { works, authors: names.size, fresh }
  } catch {
    return { works: 0, authors: 0, fresh: 0 }
  }
}

export type StripAuthor = { slug: string; name: string; avatar: string | null; initials: string }

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
}

/**
 * Автори для рядка «Наші автори».
 *
 * Показуємо активних, не схованих перемикачем, із щонайменше одним
 * опублікованим твором і з фотографією. Вимога фото свідома: рядок
 * золотих кружечків з ініціалами виглядає порожньо, а так автор бачить,
 * що фото виводить його на головну, і надсилає.
 *
 * Порядок — щоденна ротація зсувом вікна: детерміновано, тому всі
 * відвідувачі за добу бачать однакове.
 */
export async function getStripAuthors(limit = 8): Promise<StripAuthor[]> {
  const PAGE = 1000
  try {
    const supabase = getSupabaseAdmin()

    const { data: profileData, error } = await supabase
      .from('author_profiles')
      .select('user_id, display_name, pen_name, avatar_url, hide_from_directory')
      .eq('is_active', true)

    if (error || !profileData) return []
    const profiles = profileData as {
      user_id: string
      display_name: string | null
      pen_name: string | null
      avatar_url: string | null
      hide_from_directory: boolean | null
    }[]

    // Автори, у яких є хоч один опублікований твір. Сторінками:
    // Supabase мовчки віддає максимум 1000 рядків.
    const withWorks = new Set<string>()
    for (let from = 0; from < 10000; from += PAGE) {
      const { data, error: wErr } = await supabase
        .from('content')
        .select('author_id')
        .eq('type', 'story')
        .in('status', ['approved', 'published'])
        .not('author_id', 'is', null)
        .range(from, from + PAGE - 1)
      if (wErr || !data || data.length === 0) break
      for (const r of data as { author_id: string | null }[]) {
        if (r.author_id) withWorks.add(r.author_id)
      }
      if (data.length < PAGE) break
    }

    const all: StripAuthor[] = []
    for (const p of profiles) {
      if (p.hide_from_directory) continue
      if (!withWorks.has(p.user_id)) continue
      if (!p.avatar_url?.trim()) continue
      const name = p.pen_name?.trim() || p.display_name?.trim() || ''
      if (!name) continue
      all.push({ slug: authorSlug(name), name, avatar: p.avatar_url, initials: initialsOf(name) })
    }

    if (all.length === 0) return []

    // Стабільний порядок, щоб зсув був передбачуваний.
    all.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))

    const day = Math.floor(Date.now() / 86400000)
    const start = ((day * limit) % all.length + all.length) % all.length
    const out: StripAuthor[] = []
    for (let i = 0; i < Math.min(limit, all.length); i++) {
      out.push(all[(start + i) % all.length])
    }
    return out
  } catch {
    return []
  }
}
