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

interface AnalyticsData {
  surveys:      SurveyRow[]
  page_views:   PageView[]
  story_events: StoryEvent[]
  sessions:     Session[]
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

function buildSummary(d: AnalyticsData) {
  return {
    total_surveys:            d.surveys.length,
    age_distribution:         countBy(d.surveys as Record<string, unknown>[], 'age').slice(0, 6),
    gender_distribution:      countBy(d.surveys as Record<string, unknown>[], 'gender'),
    top_cities:               countBy(d.surveys as Record<string, unknown>[], 'location').slice(0, 10),
    device_distribution:      countBy(d.surveys as Record<string, unknown>[], 'device'),
    top_genres:               countGenres(d.surveys).slice(0, 10),
    budget_distribution:      countBy(d.surveys as Record<string, unknown>[], 'budget'),
    recommend_distribution:   countBy(d.surveys as Record<string, unknown>[], 'recommend'),
    total_page_views:         d.page_views.length,
    unique_sessions:          new Set(d.page_views.map(v => v.session_id)).size,
    top_pages:                countBy(d.page_views as unknown as Record<string, unknown>[], 'url').slice(0, 5),
    total_story_opens:        d.story_events.filter(e => e.event_type === 'open').length,
    total_story_reads:        d.story_events.filter(e => e.event_type === 'read').length,
    total_shares:             d.story_events.filter(e => e.event_type === 'share').length,
    top_stories:              topStories(d.story_events).slice(0, 5),
    avg_read_duration_sec:    avgDuration(d.story_events),
  }
}

// ─── Chart components ─────────────────────────────────────────────────────────

const DarkTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e3a5f', border: '1px solid rgba(245,166,35,0.4)', borderRadius: 8, padding: '8px 12px', fontFamily: FONT }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#fff', fontSize: 13 }}>{payload[0].value}</div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#0f1e3a', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 12, padding: '18px 22px' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: FONT, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: GOLD, fontFamily: FONT }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ChartCard({ title, children, span2 }: { title: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div style={{ background: '#0f1e3a', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 14, padding: '20px 20px 16px', gridColumn: span2 ? 'span 2' : undefined }}>
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

  return (
    <main style={{ minHeight: '100vh', background: '#0a1628', padding: '32px 24px 80px', fontFamily: FONT }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <a href="/" style={{ fontFamily: "'Comfortaa', cursive", fontSize: 20, fontWeight: 700, color: GOLD, textDecoration: 'none' }}>
              Balabony<sup style={{ fontSize: 8 }}>®</sup>
            </a>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 1.5, textTransform: 'uppercase' }}>Аналітика</div>
          </div>
          <a href="/admin/stories" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Адмін панель</a>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="Анкет"          value={surveys.length} />
          <StatCard label="Переглядів"     value={totalViews} />
          <StatCard label="Унікальних сес." value={uniqueSess} />
          <StatCard label="Прочитань"      value={totalReads} />
          <StatCard label="Шерингів"       value={totalShares} />
          <StatCard label="Сер. читання"   value={avgDur ? `${Math.floor(avgDur / 60)}хв ${avgDur % 60}с` : '—'} />
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
              padding: '12px 28px', background: aiLoading ? 'rgba(245,166,35,0.4)' : GOLD,
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
