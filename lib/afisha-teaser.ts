/**
 * 16.11.2026 (Богдан): блок «Афіша без барʼєрів» на головній — до 3 найближчих позицій.
 * Кіно, що зараз у прокаті, йде першим (до 2), потім найближчі події. Дані ті самі, що на /afisha.
 */
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { upcoming, upcomingPremieres, fromRows, type Access } from '@/lib/afisha'

export type TeaserItem = { title: string; label: string; when: string; access: Access[] }

const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']
const dm = (iso: string) => { const [, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]}` }

export async function getAfishaTeaser(limit = 3): Promise<TeaserItem[]> {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })
  let db: ReturnType<typeof fromRows> = { events: [], films: [] }
  try {
    const from35 = new Date(new Date(today + 'T12:00:00Z').getTime() - 35 * 864e5).toISOString().slice(0, 10)
    const { data } = await getSupabaseAdmin().from('afisha_items').select('*').eq('published', true).gte('date', from35)
    const rows = (data || []).filter((r: { kind: string; date: string; until?: string | null }) => r.kind === 'film' ? !(r.until && r.until < today) : r.date >= today)
    db = fromRows(rows)
  } catch {}
  const films = [...upcomingPremieres(today), ...db.films]
    .filter((f) => f.date <= today && (f.access || []).length > 0)
    .sort((a, b) => (a.until || '9999').localeCompare(b.until || '9999'))
    .map((f): TeaserItem => ({ title: f.title, label: 'Кіно', when: f.until ? `кіно до ${dm(f.until)}` : 'уже в кіно', access: f.access || [] }))
  const events = [...upcoming(today), ...db.events]
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
    .map((e): TeaserItem => ({ title: e.title, label: `${e.kind}${e.city ? ' · ' + e.city : ''}`, when: `${dm(e.date)}${e.time ? ', ' + e.time : ''}`, access: e.access }))
  const out = [...films.slice(0, 2), ...events]
  return [...out, ...films.slice(2)].slice(0, limit)
}
