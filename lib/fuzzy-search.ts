// 07.11.2026: пошук, що прощає помилки. Аналітика показала: «гаржина», «гаржин» замість «Гаражина»
// давали 0 результатів, і читач ішов. Якщо точний пошук нічого не знайшов, порівнюємо слова запиту
// зі словами назв і імен авторів з допуском на 1–2 помилки.
import { getSupabaseAdmin } from '@/lib/supabase-server'

export type FuzzyRow = { id: string; slug: string | null; title: string | null; author_name: string | null; author_id: string | null; genre: string | null; type: string | null; approved_at: string | null }

let cache: { at: number; rows: FuzzyRow[] } | null = null

export function norm(s: string): string {
  return s.toLowerCase()
    .replace(/[’ʼ'`"«»]/g, '')
    .replace(/ё/g, 'е').replace(/ы/g, 'и').replace(/э/g, 'е').replace(/ъ/g, '')
    .replace(/ь/g, '')
    .replace(/ґ/g, 'г')
    .replace(/[^a-zа-яіїє0-9]+/g, ' ')
    .trim()
}

function dist(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (cur[j] < best) best = cur[j]
    }
    if (best > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/** Чи схоже слово запиту на якесь слово тексту (з урахуванням недописаного кінця). */
function wordHit(q: string, words: string[]): boolean {
  const max = q.length <= 4 ? 0 : q.length <= 7 ? 1 : 2
  for (const w of words) {
    if (w.startsWith(q)) return true
    if (dist(q, w, max) <= max) return true
    // недописане слово: порівнюємо з початком довшого слова
    if (w.length > q.length && q.length >= 4 && (dist(q, w.slice(0, q.length), max) <= max || dist(q, w.slice(0, q.length + 1), max) <= max)) return true
  }
  return false
}

export async function fuzzyWorks(q: string, types: string[]): Promise<FuzzyRow[]> {
  if (!cache || Date.now() - cache.at > 10 * 60 * 1000) {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('content')
      .select('id, slug, title, author_name, author_id, genre, type, approved_at')
      .in('type', types)
      .in('status', ['approved', 'published'])
      .limit(5000)
    cache = { at: Date.now(), rows: (data ?? []) as FuzzyRow[] }
  }
  const qs = norm(q).split(' ').filter((w) => w.length >= 2)
  if (!qs.length) return []
  const hits: { r: FuzzyRow; score: number }[] = []
  for (const r of cache.rows) {
    const words = norm(`${r.title ?? ''} ${r.author_name ?? ''}`).split(' ').filter(Boolean)
    if (qs.every((x) => wordHit(x, words))) hits.push({ r, score: (r.approved_at ? Date.parse(r.approved_at) : 0) })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 80).map((h) => h.r)
}
