'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'

const GOLD = '#f5a623'
const FONT = "'Montserrat', Arial, sans-serif"
const COLORS = ['#f5a623', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

// ─── Types ────────────────────────────────────────────────────────────────────

interface SurveyRow {
  age?: string; gender?: string; location?: string; device?: string
  reading_time?: string; frequency?: string; format?: string; audio?: string
  duration?: string; genres?: string[]; genre_other?: string
  plan?: string; source?: string; attraction?: string; missing?: string
  budget?: string; sharing?: string; recommend?: string; created_at?: string
}
interface PageView   { url: string; timestamp: string; device?: string; session_id?: string }
interface StoryEvent { story_id?: string; story_title?: string; event_type: string; duration_seconds?: number; created_at: string }
interface Session    { device?: string; city?: string; start_time: string; end_time?: string }
interface PaywallHit { user_id: string; limit_type: string; hit_at: string }
interface RevenueEvent { user_id?: string | null; source: string; plan?: string | null; provider?: string; amount_kopecks: number; occurred_at: string }
interface Acquisition { user_id: string; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; referrer?: string | null }

interface AnalyticsData {
  surveys:        SurveyRow[]
  page_views:     PageView[]
  story_events:   StoryEvent[]
  sessions:       Session[]
  paywall_hits?:  PaywallHit[]
  subscriber_ids?: string[]
  revenue_events?: RevenueEvent[]
  acquisition?:   Acquisition[]
  genre_by_id?:   Record<string, string>
  reviews?:       ReviewRow[]
  title_by_id?:   Record<string, string>
}

interface ReviewRow {
  content_type: string
  content_id:   string
  rating:       number
  comment:      string | null
  created_at:   string
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function countBy(arr: Record<string, unknown>[], key: string): { name: string; value: number }[] {
  const c: Record<string, number> = {}
  arr.forEach(r => {
    const v = String(r[key] ?? 'Не вказано')
    c[v] = (c[v] ?? 0) + 1
  })
  return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function countGenres(surveys: SurveyRow[]): { name: string; value: number }[] {
  const c: Record<string, number> = {}
  surveys.forEach(s => {
    (s.genres ?? []).forEach(g => { c[g] = (c[g] ?? 0) + 1 })
  })
  return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 12)
}

function groupByHour(views: PageView[]): { hour: string; views: number }[] {
  const c = Array(24).fill(0)
  views.forEach(v => { try { c[new Date(v.timestamp).getHours()]++ } catch { /* skip */ } })
  return c.map((views, h) => ({ hour: `${h}:00`, views }))
}

function groupByDay(views: PageView[], days = 30): { date: string; views: number }[] {
  const result: Record<string, number> = {}
  const now = Date.now()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    result[`${d.getDate()}.${d.getMonth() + 1}`] = 0
  }
  views.forEach(v => {
    try {
      const d = new Date(v.timestamp)
      if (now - d.getTime() <= days * 86400000) {
        const key = `${d.getDate()}.${d.getMonth() + 1}`
        if (key in result) result[key]++
      }
    } catch { /* skip */ }
  })
  return Object.entries(result).map(([date, views]) => ({ date, views }))
}

function topStories(events: StoryEvent[]): { title: string; reads: number }[] {
  const c: Record<string, { title: string; reads: number }> = {}
  events.filter(e => e.event_type === 'read').forEach(e => {
    const k = e.story_id ?? e.story_title ?? 'unknown'
    if (!c[k]) c[k] = { title: (e.story_title ?? k).slice(0, 30), reads: 0 }
    c[k].reads++
  })
  return Object.values(c).sort((a, b) => b.reads - a.reads).slice(0, 10)
}

function avgDuration(events: StoryEvent[]): number {
  const reads = events.filter(e => e.event_type === 'read' && e.duration_seconds)
  if (!reads.length) return 0
  return Math.round(reads.reduce((s, e) => s + (e.duration_seconds ?? 0), 0) / reads.length)
}

/**
 * Службові сторінки — адмінка й кабінет автора. Заходи туди робить команда,
 * а не аудиторія. Доки вони лічилися нарівні з рештою, статистика показувала
 * тим кращі числа, чим більше ми самі працювали в адмінці, — і ШІ-аналіз
 * робив з цього висновки на кшталт «авторів більше, ніж читачів».
 */
function isInternalPath(url: unknown): boolean {
  const u = String(url ?? '')
  return u.includes('/admin') || u.includes('/author/')
}

function buildSummary(d: AnalyticsData) {
  const publicViews = d.page_views.filter(v =>
    !isInternalPath((v as unknown as Record<string, unknown>).url))
  const internalCount = d.page_views.length - publicViews.length

  return {
    // Службові заходи команди виключено з підрахунку — див. isInternalPath.
    внутрішніх_переглядів_виключено: internalCount,
    total_surveys:            d.surveys.length,
    age_distribution:         countBy(d.surveys as Record<string, unknown>[], 'age').slice(0, 6),
    gender_distribution:      countBy(d.surveys as Record<string, unknown>[], 'gender'),
    top_cities:               countBy(d.surveys as Record<string, unknown>[], 'location').slice(0, 10),
    device_distribution:      countBy(d.surveys as Record<string, unknown>[], 'device'),
    top_genres:               countGenres(d.surveys).slice(0, 10),
    budget_distribution:      countBy(d.surveys as Record<string, unknown>[], 'budget'),
    recommend_distribution:   countBy(d.surveys as Record<string, unknown>[], 'recommend'),
    total_page_views:         publicViews.length,
    unique_sessions:          new Set(publicViews.map(v => v.session_id)).size,
    top_pages:                countBy(publicViews as unknown as Record<string, unknown>[], 'url').slice(0, 8),
    total_story_opens:        d.story_events.filter(e => e.event_type === 'open').length,
    total_story_reads:        d.story_events.filter(e => e.event_type === 'read').length,
    total_shares:             d.story_events.filter(e => e.event_type === 'share').length,
    top_stories:              topStories(d.story_events).slice(0, 5),
    avg_read_duration_sec:    avgDuration(d.story_events),
    paywall_total_hits:       (d.paywall_hits ?? []).length,
    paywall_unique_hitters:   new Set((d.paywall_hits ?? []).map(h => h.user_id)).size,
    revenue_total_uah:        Math.round((d.revenue_events ?? []).reduce((s, e) => s + (e.amount_kopecks || 0), 0) / 100),
    revenue_transactions:     (d.revenue_events ?? []).length,
  }
}

// Воронка: скільки унікальних людей уперлися в пейвол і скільки з них стали платниками.
// Зв'язок — user_id (balabony_uid) однаковий у paywall_hits і в активних підписках.
function buildPaywall(hits: PaywallHit[], subscriberIds: string[]) {
  const hitters = new Set(hits.map(h => h.user_id).filter(Boolean))
  const subs    = new Set(subscriberIds)
  let converted = 0
  hitters.forEach(u => { if (subs.has(u)) converted++ })
  const uniqueHitters  = hitters.size
  const conversionRate = uniqueHitters ? Math.round((converted / uniqueHitters) * 100) : 0
  const byType = [
    { name: 'Історії (7)',     value: hits.filter(h => h.limit_type === 'stories_limit_reached').length },
    { name: 'Серії (2/сезон)', value: hits.filter(h => h.limit_type === 'season_limit_reached').length },
  ]
  return { totalHits: hits.length, uniqueHitters, converted, conversionRate, byType }
}

// Гроші: усе рахуємо в копійках, показуємо в гривнях.
const SOURCE_LABELS: Record<string, string> = {
  subscription: 'Підписки',
  installment:  'Розстрочка',
  gift:         'Подарунки',
  purchase:     'Поштучно',
}

function fmtUah(kopecks: number): string {
  const uah = Math.round(kopecks / 100)
  return `${uah.toLocaleString('uk-UA')} ₴`
}

function buildRevenue(events: RevenueEvent[]) {
  const now = Date.now()
  const totalKop   = events.reduce((s, e) => s + (e.amount_kopecks || 0), 0)
  const last30Kop  = events
    .filter(e => { try { return now - new Date(e.occurred_at).getTime() <= 30 * 86400000 } catch { return false } })
    .reduce((s, e) => s + (e.amount_kopecks || 0), 0)
  const count      = events.length
  const avgKop     = count ? Math.round(totalKop / count) : 0

  // За джерелом (у гривнях, для графіка)
  const bySrcKop: Record<string, number> = {}
  events.forEach(e => { bySrcKop[e.source] = (bySrcKop[e.source] ?? 0) + (e.amount_kopecks || 0) })
  const bySource = Object.entries(bySrcKop)
    .map(([src, kop]) => ({ name: SOURCE_LABELS[src] ?? src, value: Math.round(kop / 100) }))
    .sort((a, b) => b.value - a.value)

  return { totalKop, last30Kop, count, avgKop, bySource }
}

// Виручка по днях (у гривнях) за останні 30 днів
function revenueByDay(events: RevenueEvent[], days = 30): { date: string; uah: number }[] {
  const result: Record<string, number> = {}
  const now = Date.now()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    result[`${d.getDate()}.${d.getMonth() + 1}`] = 0
  }
  events.forEach(e => {
    try {
      const d = new Date(e.occurred_at)
      if (now - d.getTime() <= days * 86400000) {
        const key = `${d.getDate()}.${d.getMonth() + 1}`
        if (key in result) result[key] += (e.amount_kopecks || 0) / 100
      }
    } catch { /* skip */ }
  })
  return Object.entries(result).map(([date, uah]) => ({ date, uah: Math.round(uah) }))
}

// Канал залучення: utm_source, або хост реферера, або 'прямий'.
function channelOf(a: { utm_source?: string | null; referrer?: string | null }): string {
  if (a.utm_source) return a.utm_source.toLowerCase()
  const ref = a.referrer
  if (!ref) return 'прямий'
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '')
    if (host.includes('balabony')) return 'прямий'
    return host
  } catch { return 'прямий' }
}

// Користувачі та виручка за каналом залучення (join по user_id).
function buildChannels(acq: Acquisition[], revenue: RevenueEvent[]) {
  const userChannel = new Map<string, string>()
  const usersByCh: Record<string, number> = {}
  acq.forEach(a => {
    const ch = channelOf(a)
    if (a.user_id) userChannel.set(a.user_id, ch)
    usersByCh[ch] = (usersByCh[ch] ?? 0) + 1
  })

  const revByCh: Record<string, number> = {}
  revenue.forEach(e => {
    const ch = (e.user_id && userChannel.get(e.user_id)) || 'невідомо'
    revByCh[ch] = (revByCh[ch] ?? 0) + (e.amount_kopecks || 0)
  })

  const users = Object.entries(usersByCh)
    .map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  const revenueByChannel = Object.entries(revByCh)
    .map(([name, kop]) => ({ name, value: Math.round(kop / 100) })).sort((a, b) => b.value - a.value).slice(0, 10)

  return { users, revenueByChannel }
}

// ─── Chart components ─────────────────────────────────────────────────────────


/**
 * Поведінкова аналітика: не «що читачі кажуть у анкеті», а що вони роблять.
 */

/** Жанри за реальними прочитаннями, а не за відповідями в анкеті. */
function realGenres(events: StoryEvent[], genreById: Record<string, string>): { name: string; value: number }[] {
  const c: Record<string, number> = {}
  events.filter(e => e.event_type === 'read' && e.story_id).forEach(e => {
    const g = genreById[e.story_id as string]
    if (!g) return
    c[g] = (c[g] ?? 0) + 1
  })
  return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

/**
 * Глибина читання: скільки з відкритих творів дочитали до кінця.
 * 'open' пишеться при відкритті сторінки, 'read' — коли виконано умову
 * зарахування прочитання. Різниця між ними і є відповіддю на питання,
 * чи тексти втримують.
 */
function readDepth(events: StoryEvent[]) {
  const opens = events.filter(e => e.event_type === 'open').length
  const reads = events.filter(e => e.event_type === 'read').length
  const rate = opens > 0 ? Math.round((reads / opens) * 100) : 0
  return { opens, reads, rate }
}

/** Розподіл часу читання — показує, на якій хвилині втрачаємо читача. */
function durationBuckets(events: StoryEvent[]): { name: string; value: number }[] {
  const b = [
    { name: 'до 1 хв', value: 0 },
    { name: '1–3 хв', value: 0 },
    { name: '3–7 хв', value: 0 },
    { name: '7–15 хв', value: 0 },
    { name: 'понад 15 хв', value: 0 },
  ]
  events.filter(e => e.duration_seconds).forEach(e => {
    const m = (e.duration_seconds ?? 0) / 60
    if (m < 1) b[0].value++
    else if (m < 3) b[1].value++
    else if (m < 7) b[2].value++
    else if (m < 15) b[3].value++
    else b[4].value++
  })
  return b.filter(x => x.value > 0)
}

/**
 * Точки входу і виходу. Сесія — це session_id у page_views; перша сторінка
 * за часом каже, звідки читач зайшов, остання — де він пішов. Друге
 * важливіше: сторінка, на якій обривається більшість сесій, і є місцем,
 * яке треба лагодити.
 */
function entryExitPages(views: PageView[]) {
  const bySession: Record<string, PageView[]> = {}
  views.filter(v => v.session_id && !isInternalPath(v.url)).forEach(v => {
    const k = v.session_id as string
    if (!bySession[k]) bySession[k] = []
    bySession[k].push(v)
  })

  const entries: Record<string, number> = {}
  const exits: Record<string, number> = {}
  let single = 0
  const sessions = Object.values(bySession)

  sessions.forEach(list => {
    const sorted = [...list].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    const first = pathOf(sorted[0].url)
    const last = pathOf(sorted[sorted.length - 1].url)
    entries[first] = (entries[first] ?? 0) + 1
    exits[last] = (exits[last] ?? 0) + 1
    if (sorted.length === 1) single++
  })

  const top = (o: Record<string, number>) =>
    Object.entries(o).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  return {
    entries: top(entries),
    exits: top(exits),
    sessions: sessions.length,
    bounceRate: sessions.length ? Math.round((single / sessions.length) * 100) : 0,
    pagesPerSession: sessions.length
      ? Math.round((sessions.reduce((s, l) => s + l.length, 0) / sessions.length) * 10) / 10
      : 0,
  }
}

/** Адреса без домену й параметрів — щоб однакові сторінки не двоїлися. */
function pathOf(url: unknown): string {
  const u = String(url ?? '')
  try {
    const p = u.startsWith('http') ? new URL(u).pathname : u.split('?')[0]
    return p.length > 40 ? p.slice(0, 40) + '…' : (p || '/')
  } catch {
    return u.slice(0, 40)
  }
}

/** Частки у відсотках — абсолютні числа без частки мало що кажуть. */
function withShare(rows: { name: string; value: number }[]): { name: string; value: number; share: number }[] {
  const total = rows.reduce((s, r) => s + r.value, 0)
  return rows.map(r => ({ ...r, share: total ? Math.round((r.value / total) * 100) : 0 }))
}

const DarkTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e3a5f', border: '1px solid rgba(208, 163, 85,0.4)', borderRadius: 8, padding: '8px 12px', fontFamily: FONT }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#fff', fontSize: 13 }}>{payload[0].value}</div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#0f1e3a', border: '1px solid rgba(208, 163, 85,0.3)', borderRadius: 12, padding: '18px 22px' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: FONT, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: GOLD, fontFamily: FONT }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// Підписи оцінок — ті самі, що бачить читач у вікні відгуку.
const RATING_LABELS = ['Не зайшло', 'Нормально', 'Добре', 'Дуже добре', 'Чудово']

/**
 * Відгуки для аналітики.
 *
 * Показуємо не лише середню: одна низька оцінка нічого не означає (читач міг
 * просто не любити жанр), а от твір із середньою 2,1 при восьми відгуках —
 * це вже сигнал редакції. Тому поруч із середньою йде розподіл по оцінках
 * і найсвіжіші коментарі з текстом.
 */
function buildReviews(rows: ReviewRow[], titleById: Record<string, string>) {
  const total = rows.length
  const sum = rows.reduce((a, r) => a + (r.rating || 0), 0)
  const avg = total ? Math.round((sum / total) * 10) / 10 : 0

  const dist = [1, 2, 3, 4, 5].map(n => ({
    name: `${n} · ${RATING_LABELS[n - 1]}`,
    value: rows.filter(r => r.rating === n).length,
  }))

  // Твори з трьома і більше відгуками, найгірші зверху: саме там може ховатися
  // системна проблема, а не смак однієї людини.
  const byWork: Record<string, { sum: number; n: number }> = {}
  for (const r of rows) {
    const k = r.content_id
    if (!byWork[k]) byWork[k] = { sum: 0, n: 0 }
    byWork[k].sum += r.rating || 0
    byWork[k].n += 1
  }
  const weak = Object.entries(byWork)
    .filter(([, v]) => v.n >= 3)
    .map(([id, v]) => ({
      title: titleById[id] ?? id.slice(0, 8),
      avg: Math.round((v.sum / v.n) * 10) / 10,
      n: v.n,
    }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 8)

  const withText = rows.filter(r => (r.comment ?? '').trim().length > 0).slice(0, 12)

  const low = rows.filter(r => r.rating <= 2).length

  return { total, avg, dist, weak, withText, low }
}

function ChartCard({ title, children, span2 }: { title: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div style={{ background: '#0f1e3a', border: '1px solid rgba(208, 163, 85,0.25)', borderRadius: 14, padding: '20px 20px 16px', gridColumn: span2 ? 'span 2' : undefined }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: FONT, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
      {children}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData]         = useState<AnalyticsData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [aiText, setAiText]     = useState('')
  const [aiLoading, setAiLoad]  = useState(false)
  const [aiError, setAiError]   = useState('')

  useEffect(() => {
    fetch('/api/admin/analytics-data')
      .then(r => {
        if (r.status === 401) { router.push('/admin/login'); return null }
        return r.json()
      })
      .then(d => { if (d) setData(d as AnalyticsData) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  const getRecommendations = useCallback(async () => {
    if (!data) return
    setAiLoad(true); setAiError(''); setAiText('')
    try {
      const res = await fetch('/api/admin/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: buildSummary(data) }),
      })
      if (!res.ok) { setAiError('Помилка. Перевірте ANTHROPIC_API_KEY.'); return }
      const { recommendations } = await res.json() as { recommendations: string }
      setAiText(recommendations)
    } catch {
      setAiError('Помилка з\'єднання')
    } finally {
      setAiLoad(false)
    }
  }, [data])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: GOLD, fontFamily: FONT, fontSize: 16 }}>Завантаження даних…</div>
    </div>
  )

  if (!data) return null

  const { surveys, page_views, story_events } = data
  const reviewRows = data.reviews ?? []
  const rev5 = buildReviews(reviewRows, data.title_by_id ?? {})

  const ageData      = countBy(surveys as Record<string, unknown>[], 'age')
  const genderData   = countBy(surveys as Record<string, unknown>[], 'gender')
  const deviceData   = countBy(surveys as Record<string, unknown>[], 'device')
  const budgetData   = countBy(surveys as Record<string, unknown>[], 'budget')
  const sourceData   = countBy(surveys as Record<string, unknown>[], 'source')
  const recData      = countBy(surveys as Record<string, unknown>[], 'recommend')
  const cityData     = countBy(surveys as Record<string, unknown>[], 'location').slice(0, 10)
  const genreData    = countGenres(surveys)
  const hourData     = groupByHour(page_views)
  const dayData      = groupByDay(page_views)
  const storiesData  = topStories(story_events)
  const avgDur       = avgDuration(story_events)

  const totalViews   = page_views.length
  const totalReads   = story_events.filter(e => e.event_type === 'read').length
  const totalShares  = story_events.filter(e => e.event_type === 'share').length
  const uniqueSess   = new Set(page_views.map(v => v.session_id)).size

  const paywallHits   = data.paywall_hits ?? []
  const subscriberIds = data.subscriber_ids ?? []
  const pw            = buildPaywall(paywallHits, subscriberIds)
  const pwDayData     = groupByDay(paywallHits.map(h => ({ url: '', timestamp: h.hit_at })) as PageView[])

  const revenueEvents = data.revenue_events ?? []
  const rev           = buildRevenue(revenueEvents)
  const revDayData    = revenueByDay(revenueEvents)

  const acquisition   = data.acquisition ?? []
  const ch            = buildChannels(acquisition, revenueEvents)

  // Поведінка читачів
  const genreById   = data.genre_by_id ?? {}
  const genresReal  = withShare(realGenres(story_events, genreById))
  const depth       = readDepth(story_events)
  const buckets     = durationBuckets(story_events)
  const flow        = entryExitPages(page_views)
  const chShare     = withShare(ch.users)

  return (
    <main style={{ minHeight: '100vh', background: '#0a1628', padding: '32px 24px 80px', fontFamily: FONT }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="Анкет"          value={surveys.length} />
          <StatCard label="Переглядів"     value={totalViews} />
          <StatCard label="Унікальних сес." value={uniqueSess} />
          <StatCard label="Прочитань"      value={totalReads} />
          <StatCard label="Шерингів"       value={totalShares} />
          <StatCard label="Сер. читання"   value={avgDur ? `${Math.floor(avgDur / 60)}хв ${avgDur % 60}с` : '—'} />
        </div>

        {/* ─── Відгуки ───
             Додано 09.09.2026. Механіка відгуків існувала з початку, але
             вікно ніде не викликалося — за весь час нуль відгуків, і
             аналітика про них не знала взагалі. */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          Відгуки
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <StatCard label="Усього відгуків" value={rev5.total} />
          <StatCard
            label="Середня оцінка"
            value={rev5.total ? `${rev5.avg} з 5` : '—'}
            sub={rev5.total ? RATING_LABELS[Math.round(rev5.avg) - 1] : undefined}
          />
          <StatCard label="З коментарем" value={rev5.withText.length} />
          <StatCard label="Низьких (1–2)" value={rev5.low} />
        </div>

        {rev5.total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
            <ChartCard title="Розподіл оцінок">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rev5.dist} layout="vertical" margin={{ left: 90 }}>
                  <XAxis type="number" stroke="rgba(255,255,255,0.35)" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={11} width={90} />
                  <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(208,163,85,0.3)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill={GOLD} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Слабкі місця (від 3 відгуків)">
              {rev5.weak.length === 0 ? (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', padding: '20px 0' }}>
                  Поки жоден твір не має трьох відгуків — рано робити висновки.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {rev5.weak.map(w => (
                    <div key={w.title} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, color: '#e8eef7' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title}</span>
                      {/* Увагу привертаємо золотим, не червоним: у бренді
                          Balabony червоного немає. Слабкий твір — яскравим
                          золотим, решта — приглушеним. */}
                      <span style={{ flex: 'none', color: w.avg < 3 ? GOLD : '#8899bb', fontWeight: 700 }}>
                        {w.avg} з 5 · {w.n}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard title="Останні коментарі" span2>
              {rev5.withText.length === 0 ? (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                  Оцінки є, а написаних коментарів ще немає.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {rev5.withText.map((r, i) => (
                    <div key={i} style={{ borderLeft: `2px solid ${r.rating <= 2 ? GOLD : 'rgba(255,255,255,0.15)'}`, paddingLeft: 12 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
                        {(data.title_by_id ?? {})[r.content_id] ?? r.content_id.slice(0, 8)}
                        {' · '}
                        {r.rating} з 5 · {RATING_LABELS[r.rating - 1] ?? ''}
                      </div>
                      <div style={{ fontSize: 13.5, color: '#e8eef7', lineHeight: 1.6 }}>{r.comment}</div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>
        )}

        {/* ─── Гроші ─── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          Гроші
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <StatCard label="Виручка всього"  value={fmtUah(rev.totalKop)} sub={`${rev.count} транзакцій`} />
          <StatCard label="За 30 днів"      value={fmtUah(rev.last30Kop)} />
          <StatCard label="Транзакцій"      value={rev.count} />
          <StatCard label="Середній чек"    value={rev.count ? fmtUah(rev.avgKop) : '—'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
          <ChartCard title="Виручка по днях, ₴ (30 днів)">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={revDayData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={4} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="uah" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Виручка за джерелом, ₴">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={rev.bySource} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ─── Поведінка читачів ─── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          Поведінка читачів
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <StatCard label="Відкрито творів" value={depth.opens} />
          <StatCard label="Дочитано"        value={depth.reads} sub={`${depth.rate}% від відкритих`} />
          <StatCard label="Сторінок за сесію" value={flow.pagesPerSession} />
          <StatCard label="Пішли з першої"  value={`${flow.bounceRate}%`} sub={`${flow.sessions} сесій`} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
          <ChartCard title="Жанри за реальними прочитаннями">
            {genresReal.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: 20 }}>Прочитань ще немає</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={genresReal} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} width={110} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Скільки часу читають">
            {buckets.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: 20 }}>Даних ще немає</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={buckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Куди заходять (перша сторінка сесії)">
            {flow.entries.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: 20 }}>Даних ще немає</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={flow.entries} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} width={150} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Звідки йдуть (остання сторінка сесії)">
            {flow.exits.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: 20 }}>Даних ще немає</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={flow.exits} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} width={150} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Джерела трафіку у відсотках — абсолютні числа не показують,
            наскільки Google переважає решту каналів. */}
        {chShare.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <ChartCard title="Частка джерел трафіку" span2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chShare.map((c) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 130, fontSize: 12, color: '#94a3b8', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </div>
                    <div style={{ flex: 1, height: 18, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${c.share}%`, height: '100%', background: GOLD, borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 80, textAlign: 'right', fontSize: 12, color: '#f5f0e8', fontFamily: FONT }}>
                      {c.share}% · {c.value}
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}

        {/* ─── Канали залучення ─── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          Канали залучення (UTM)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
          <ChartCard title="Користувачі за каналом">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ch.users} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Виручка за каналом, ₴">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ch.revenueByChannel} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ─── Воронка · пейвол ─── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          Воронка · пейвол
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <StatCard label="Дійшли до пейволу" value={pw.uniqueHitters} sub={`${pw.totalHits} спрацювань усього`} />
          <StatCard label="Стали платниками"  value={pw.converted} />
          <StatCard label="Конверсія"         value={`${pw.conversionRate}%`} sub="з тих, хто вперся в ліміт" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
          <ChartCard title="Де впираються (тип ліміту)">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pw.byType} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Пейвол по днях (30 днів)">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={pwDayData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={4} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="views" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ─── Survey charts ─── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          Анкетування
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>

          <ChartCard title="Вік">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" fill={GOLD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Стать">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Пристрій">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Бюджет / міс.">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Рекомендація">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={recData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Джерело трафіку">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sourceData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        {/* Genres — full width */}
        {genreData.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <ChartCard title="Жанри (топ)" span2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={genreData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {genreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Cities */}
        {cityData.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <ChartCard title="Міста (топ 10)" span2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cityData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} width={110} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* ─── Activity charts ─── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 }}>
          Активність
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>

          <ChartCard title="По годинах">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="hour" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={3} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="views" stroke={GOLD} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="По днях (30 днів)">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dayData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={4} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        {/* ─── Stories ─── */}
        {storiesData.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 }}>
              Топ-10 Історій
            </div>
            <div style={{ marginBottom: 24 }}>
              <ChartCard title="Найпопулярніші (за прочитаннями)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={storiesData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis type="category" dataKey="title" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} width={160} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="reads" fill={GOLD} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}

        {/* ─── AI Recommendations ─── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          ШІ-Аналіз
        </div>
        <div style={{ background: '#0f1e3a', border: `1.5px solid ${GOLD}`, borderRadius: 16, padding: '24px 24px' }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20, lineHeight: 1.6 }}>
            Claude проаналізує всі дані платформи та надасть рекомендації щодо розвитку, контенту, залучення аудиторії та монетизації.
          </p>
          <button
            onClick={getRecommendations}
            disabled={aiLoading}
            style={{
              padding: '12px 28px', background: aiLoading ? 'rgba(208, 163, 85,0.4)' : GOLD,
              color: '#fff', border: 'none', borderRadius: 10, cursor: aiLoading ? 'wait' : 'pointer',
              fontWeight: 700, fontSize: 14, fontFamily: FONT,
            }}
          >
            {aiLoading ? 'Аналізую дані…' : '✦ Отримати рекомендації від Claude'}
          </button>

          {aiError && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
              {aiError}
            </div>
          )}

          {aiText && (
            <div style={{ marginTop: 20, padding: '20px 22px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
              {aiText.split('\n').map((line, i) => {
                const isBold = line.startsWith('**') || /^\d+\.\s+\*\*/.test(line)
                const cleaned = line.replace(/\*\*/g, '')
                return (
                  <p key={i} style={{
                    margin: '0 0 8px', fontSize: 14, lineHeight: 1.7,
                    color: isBold ? GOLD : 'rgba(255,255,255,0.85)',
                    fontWeight: isBold ? 700 : 400, fontFamily: FONT,
                  }}>
                    {cleaned || ' '}
                  </p>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
