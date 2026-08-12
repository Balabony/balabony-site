'use client'

import { AudioWaveIcon } from '@/app/components/AudioBadge'
import { useState, useEffect } from 'react'
import type { AnalysisResult } from '@/components/admin/GeminiAnalyzer'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#d0a355'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

interface SeriesRow {
  id:             string
  slug:           string
  title:          string
  season_number:  number
  episode_number: number
  created_at:     string
  audio_status:   string | null
  cover_url:      string | null
  analyze_report: AnalysisResult | null
  is_premium:     boolean | null
}

type SortMode = 'newest' | 'oldest' | 'rating-desc' | 'rating-asc'

const controlStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 8,
  background: NAVY, border: '1px solid rgba(255,255,255,0.1)',
  color: '#f5f0e8', fontSize: 13, fontFamily: FONT, outline: 'none',
}

function ratingColor(r: number | null | undefined): string {
  if (r == null) return 'rgba(255,255,255,0.15)'
  if (r >= 8)    return '#2d8f4e'
  if (r >= 6)    return '#d4a017'
  return '#d94545'
}

export default function SeriesListPage() {
  const [series,       setSeries]       = useState<SeriesRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [search,       setSearch]       = useState('')
  const [filterSeason, setFilterSeason] = useState('all')
  const [filterTag,    setFilterTag]    = useState('all')
  const [sortMode,     setSortMode]     = useState<SortMode>('newest')
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [editTitle,    setEditTitle]    = useState('')
  const [savingId,     setSavingId]     = useState<string | null>(null)
  const [covGenSlug,   setCovGenSlug]   = useState<string | null>(null)
  const [coverChar,    setCoverChar]    = useState<'auto' | 'panas' | 'ganya'>('auto')
  // Порожньо = позу вибирає модель. Інакше — примусово ця поза.
  const [coverPose,    setCoverPose]    = useState('')
  // Батч-генерація recap
  const [recapRunning, setRecapRunning] = useState(false)

  // Батч перегенерації обкладинок (серії без cover_meta — зроблені повз систему)
  const [covRunning, setCovRunning] = useState(false)
  const [covDone,    setCovDone]    = useState(0)
  const [covTotal,   setCovTotal]   = useState(0)
  const [covLast,    setCovLast]    = useState('')
  const [covMsg,     setCovMsg]     = useState('')
  const [covFailed,  setCovFailed]  = useState<string[]>([])
  const [recapDone,    setRecapDone]    = useState(0)
  const [recapTotal,   setRecapTotal]   = useState(0)
  const [recapLast,    setRecapLast]    = useState('')
  const [recapMsg,     setRecapMsg]     = useState('')
  // Батч-генерація шортів-скриптів (гачки без спойлера)
  const [ssRunning, setSsRunning] = useState(false)
  const [ssDone,    setSsDone]    = useState(0)
  const [ssTotal,   setSsTotal]   = useState(0)
  const [ssLast,    setSsLast]    = useState('')
  const [ssText,    setSsText]    = useState('')
  const [ssMsg,     setSsMsg]     = useState('')
  const [hkRunning, setHkRunning] = useState(false)
  const [hkDone,    setHkDone]    = useState(0)
  const [hkTotal,   setHkTotal]   = useState(0)
  const [hkLast,    setHkLast]    = useState('')
  const [hkText,    setHkText]    = useState('')
  const [hkMsg,     setHkMsg]     = useState('')
  // Канон-перевірка (Кімната сценариста, Ф1 — механіка)
  type CanonFinding = { rule: string; severity: 'error' | 'warn' | 'info'; message: string; excerpt?: string }
  const [canonLoading, setCanonLoading] = useState<string | null>(null)
  const [canonReport,  setCanonReport]  = useState<Record<string, CanonFinding[]>>({})

  // AI-continuity (Кімната сценариста, Ф2a — Gemini проти recap попередніх епізодів)
  type ContIssue   = { severity: 'error' | 'warn'; issue: string; source?: string }
  type VoiceIssue  = { character: string; issue: string }
  type ContFindings = { continuity: ContIssue[]; voices: VoiceIssue[]; summary: string }
  const [contLoading, setContLoading] = useState<string | null>(null)
  const [contReport,  setContReport]  = useState<Record<string, ContFindings | { error: string }>>({})
  // Діалог-конвертер (тире → «Імʼя:») — чернетка в dialog_converted
  const [dlgLoading, setDlgLoading] = useState<string | null>(null)
  const [dlgResult,  setDlgResult]  = useState<Record<string, string>>({})
  // Батч-конвертація діалогів
  const [dbRunning, setDbRunning] = useState(false)
  const [dbDone,    setDbDone]    = useState(0)
  const [dbTotal,   setDbTotal]   = useState(0)
  const [dbLast,    setDbLast]    = useState('')
  const [dbMsg,     setDbMsg]     = useState('')

  // Пакетний continuity-реаудит (Ф2c)
  const [cbRunning, setCbRunning] = useState(false)
  const [cbDone,    setCbDone]    = useState(0)
  const [cbTotal,   setCbTotal]   = useState(0)
  const [cbFlagged, setCbFlagged] = useState(0)
  const [cbLast,    setCbLast]    = useState('')
  const [cbMsg,     setCbMsg]     = useState('')

  useEffect(() => {
    fetch('/api/admin/series')
      .then(r => r.json())
      .then((data: { series?: SeriesRow[]; error?: string }) => {
        if (data.error) { setError(data.error); return }
        setSeries(data.series ?? [])
      })
      .catch(() => setError("Помилка з'єднання"))
      .finally(() => setLoading(false))
  }, [])

  const startEdit = (id: string, current: string) => { setEditingId(id); setEditTitle(current) }
  const cancelEdit = () => { setEditingId(null); setEditTitle('') }
  const saveTitle = async (id: string) => {
    const t = editTitle.trim()
    if (!t) return
    setSavingId(id)
    try {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t }),
      })
      if (res.ok) {
        setSeries(prev => prev.map(s => s.id === id ? { ...s, title: t } : s))
        setEditingId(null); setEditTitle('')
      }
    } catch { /* тихо */ } finally {
      setSavingId(null)
    }
  }

  const regenCover = async (slug: string, title: string) => {
    if (covGenSlug) return
    setCovGenSlug(slug)
    try {
      const res = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId: slug, title, description: '', character: coverChar, pose: coverPose }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (res.ok && data.url) {
        const fresh = `${data.url}${data.url.includes('?') ? '&' : '?'}t=${Date.now()}`
        setSeries(prev => prev.map(s => s.slug === slug ? { ...s, cover_url: fresh } : s))
      }
    } catch { /* тихо */ } finally {
      setCovGenSlug(null)
    }
  }

  // Батч перегенерації обкладинок: викликаємо endpoint у циклі, доки done=true.
  // Кожен виклик обробляє ОДНУ серію без cover_meta. Серії, де генерація впала,
  // накопичуються у skip-списку й передаються назад — інакше батч уперся б у ту
  // саму проблемну серію і не рушив далі.
  const runCoverBatch = async () => {
    if (covRunning) return
    if (!confirm(
      'Перегенерувати обкладинки для серій, зроблених повз систему?\n\n' +
      'Обробляються ТІЛЬКИ серії без cover_meta (їх 34). Обкладинки, вже ' +
      'згенеровані з еталонних поз, не зачіпаються.\n\n' +
      'Кожна серія — 30-90 секунд, тож повний прогін триватиме близько години. ' +
      'Вкладку не закривай.'
    )) return

    setCovRunning(true); setCovDone(0); setCovTotal(0); setCovLast(''); setCovMsg(''); setCovFailed([])
    const failed: string[] = []
    let safety = 0

    try {
      while (safety < 200) {
        safety++
        const res = await fetch('/api/admin/cover-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skipSlugs: failed }),
        })
        const data = await res.json() as {
          done?: boolean; total?: number; error?: string; failedSlug?: string
          processed?: { slug?: string; title?: string; season?: number; episode?: number; url?: string } | null
        }

        if (!res.ok && !data.processed) {
          setCovMsg(`Помилка: ${data.error ?? 'невідома'}. Зупинено. Можна запустити знову — продовжить з місця.`)
          break
        }
        if (data.total) setCovTotal(data.total)
        if (data.done) {
          setCovMsg(failed.length > 0
            ? `Готово. Не вдалося: ${failed.length} — ${failed.join(', ')}. Спробуй їх окремо кнопкою на серії.`
            : 'Готово — усі обкладинки перегенеровано.')
          break
        }

        const p = data.processed
        const label = p ? `S${p.season}E${p.episode} — ${p.title}` : ''

        if (data.failedSlug) {
          failed.push(data.failedSlug)
          setCovFailed([...failed])
          setCovLast(`${label} — збій, пропускаю`)
        } else {
          setCovDone(d => d + 1)
          setCovLast(label)
          // оновлюємо обкладинку в списку без перезавантаження сторінки
          if (p?.slug && p?.url) {
            const fresh = `${p.url}${p.url.includes('?') ? '&' : '?'}t=${Date.now()}`
            setSeries(prev => prev.map(s => s.slug === p.slug ? { ...s, cover_url: fresh } : s))
          }
        }
      }
    } catch (e) {
      setCovMsg(`Помилка: ${e instanceof Error ? e.message : 'невідома'}. Можна запустити знову.`)
    } finally {
      setCovRunning(false)
    }
  }

  // Батч-генерація recap: викликаємо endpoint у циклі, доки done=true.
  // Кожен виклик обробляє один епізод без recap → нема Vercel-timeout, є прогрес.
  const runRecapBatch = async () => {
    if (recapRunning) return
    if (!confirm('Згенерувати recap для всіх епізодів без recap? Уже наявні не змінюються. Це може зайняти кілька хвилин.')) return
    setRecapRunning(true); setRecapDone(0); setRecapTotal(0); setRecapLast(''); setRecapMsg('')
    let safety = 0
    try {
      // doки endpoint каже done=false — продовжуємо
      while (safety < 500) {
        safety++
        const res = await fetch('/api/admin/recap-batch', { method: 'POST' })
        const data = await res.json() as {
          done?: boolean; total?: number; remaining?: number
          processed?: { title?: string; season?: number; episode?: number } | null
          error?: string
        }
        if (!res.ok || data.error) {
          setRecapMsg(`Помилка: ${data.error ?? 'невідома'}. Зупинено. Можна запустити знову — продовжить з місця.`)
          break
        }
        if (data.total) setRecapTotal(data.total)
        if (data.done) {
          setRecapMsg('Готово — усі епізоди мають recap.')
          break
        }
        if (data.processed) {
          setRecapDone(d => d + 1)
          setRecapLast(`S${data.processed.season}E${data.processed.episode} · ${data.processed.title ?? ''}`)
        }
      }
    } catch {
      setRecapMsg("Помилка з'єднання. Зупинено. Можна запустити знову — продовжить з місця.")
    } finally {
      setRecapRunning(false)
    }
  }

  // Батч-генерація шортів-скриптів: той самий патерн, що й recap.
  // Кожен виклик обробляє один епізод без short_script → нема Vercel-timeout, є прогрес.
  const runShortBatch = async () => {
    if (ssRunning) return
    if (!confirm('Згенерувати шорти-гачки для всіх епізодів без шорту? Уже наявні не змінюються. Це може зайняти кілька хвилин.')) return
    setSsRunning(true); setSsDone(0); setSsTotal(0); setSsLast(''); setSsText(''); setSsMsg('')
    let safety = 0
    try {
      while (safety < 500) {
        safety++
        const res = await fetch('/api/admin/short-script-batch', { method: 'POST' })
        const data = await res.json() as {
          done?: boolean; total?: number; remaining?: number
          processed?: { title?: string; season?: number; episode?: number; short_script?: string } | null
          error?: string
        }
        if (!res.ok || data.error) {
          setSsMsg(`Помилка: ${data.error ?? 'невідома'}. Зупинено. Можна запустити знову — продовжить з місця.`)
          break
        }
        if (data.total) setSsTotal(data.total)
        if (data.done) {
          setSsMsg('Готово — усі епізоди мають шорт-гачок.')
          break
        }
        if (data.processed) {
          setSsDone(d => d + 1)
          setSsLast(`S${data.processed.season}E${data.processed.episode} · ${data.processed.title ?? ''}`)
          if (data.processed.short_script) setSsText(data.processed.short_script)
        }
      }
    } catch {
      setSsMsg("Помилка з'єднання. Зупинено. Можна запустити знову — продовжить з місця.")
    } finally {
      setSsRunning(false)
    }
  }

  // Батч-генерація коротких гачків (hook) для картки: той самий патерн, що й шорти.
  const runHookBatch = async () => {
    if (hkRunning) return
    if (!confirm('Згенерувати короткі гачки (1 речення) для всіх епізодів без гачка? Уже наявні не змінюються. Це може зайняти кілька хвилин.')) return
    setHkRunning(true); setHkDone(0); setHkTotal(0); setHkLast(''); setHkText(''); setHkMsg('')
    let safety = 0
    try {
      while (safety < 500) {
        safety++
        const res = await fetch('/api/admin/hook-batch', { method: 'POST' })
        const data = await res.json() as {
          done?: boolean; total?: number; remaining?: number
          processed?: { title?: string; season?: number; episode?: number; hook?: string } | null
          error?: string
        }
        if (!res.ok || data.error) {
          setHkMsg(`Помилка: ${data.error ?? 'невідома'}. Зупинено. Можна запустити знову — продовжить з місця.`)
          break
        }
        if (data.total) setHkTotal(data.total)
        if (data.done) {
          setHkMsg('Готово — усі епізоди мають гачок.')
          break
        }
        if (data.processed) {
          setHkDone(d => d + 1)
          setHkLast(`S${data.processed.season}E${data.processed.episode} · ${data.processed.title ?? ''}`)
          if (data.processed.hook) setHkText(data.processed.hook)
        }
      }
    } catch {
      setHkMsg("Помилка з'єднання. Зупинено. Можна запустити знову — продовжить з місця.")
    } finally {
      setHkRunning(false)
    }
  }

  // Канон-перевірка одного епізоду (механіка, без AI).
  const runCanonCheck = async (id: string) => {
    if (canonLoading) return
    setCanonLoading(id)
    try {
      const res = await fetch('/api/admin/canon-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json() as { findings?: CanonFinding[]; error?: string }
      if (!res.ok || data.error) {
        setCanonReport(prev => ({ ...prev, [id]: [{ rule: 'помилка', severity: 'error', message: data.error ?? 'Не вдалося перевірити' }] }))
      } else {
        setCanonReport(prev => ({ ...prev, [id]: data.findings ?? [] }))
      }
    } catch {
      setCanonReport(prev => ({ ...prev, [id]: [{ rule: 'помилка', severity: 'error', message: "Помилка з'єднання" }] }))
    } finally {
      setCanonLoading(null)
    }
  }

  // AI-continuity одного епізоду (Ф2a): Gemini звіряє з recap попередніх + canon_bible.
  const runContinuityCheck = async (id: string) => {
    if (contLoading) return
    setContLoading(id)
    try {
      const res = await fetch('/api/admin/continuity-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json() as { findings?: ContFindings; error?: string; overloaded?: boolean }
      if (!res.ok || data.error) {
        const msg = data.overloaded
          ? 'Gemini перевантажений (503). Спробуйте ще раз за хвилину.'
          : (data.error ?? 'Не вдалося перевірити')
        setContReport(prev => ({ ...prev, [id]: { error: msg } }))
      } else {
        setContReport(prev => ({ ...prev, [id]: data.findings ?? { continuity: [], voices: [], summary: '' } }))
      }
    } catch {
      setContReport(prev => ({ ...prev, [id]: { error: "Помилка з'єднання" } }))
    } finally {
      setContLoading(null)
    }
  }

  // Пакетний continuity-реаудит (Ф2c): по одному, доки done. Повторний запуск
  // ПРОДОВЖУЄ з місця (обробляє лише епізоди, яких ще немає в canon_audit).
  const runContinuityBatch = async () => {
    if (cbRunning) return
    if (!confirm('Запустити AI-реаудит хронології? Обробляться епізоди, яких ще немає в аудиті (повторний запуск продовжує з місця). Кілька хвилин — Gemini по одному.')) return
    setCbRunning(true); setCbMsg('')
    let safety = 0
    try {
      while (safety < 500) {
        safety++
        const res = await fetch('/api/admin/continuity-batch', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
        })
        const data = await res.json() as {
          done?: boolean; total?: number; remaining?: number
          processed?: { title?: string; season?: number; episode?: number; errors?: number; warns?: number } | null
          error?: string; overloaded?: boolean
        }
        if (!res.ok || data.error) {
          setCbMsg(data.overloaded
            ? 'Gemini перевантажений (503). Зупинено. Натисніть ще раз — продовжить з місця.'
            : `Помилка: ${data.error ?? 'невідома'}. Зупинено. Можна запустити знову.`)
          break
        }
        if (data.total) setCbTotal(data.total)
        if (data.done) { setCbMsg('Готово — реаудит завершено. Тисніть «Експорт CSV».'); break }
        if (data.processed) {
          setCbDone(d => d + 1)
          const p = data.processed
          setCbLast(`S${p.season}E${p.episode} · ${p.title ?? ''} — помилок: ${p.errors ?? 0}, попереджень: ${p.warns ?? 0}`)
          if ((p.errors ?? 0) > 0 || (p.warns ?? 0) > 0) setCbFlagged(f => f + 1)
        }
      }
    } catch {
      setCbMsg("Помилка з'єднання. Зупинено. Можна запустити знову — продовжить з місця.")
    } finally {
      setCbRunning(false)
    }
  }

  // Очистити збережений аудит — щоб наступний реаудит почався з нуля.
  const runContinuityReset = async () => {
    if (cbRunning) return
    if (!confirm('Очистити всі збережені результати реаудиту? Наступний реаудит почнеться з нуля.')) return
    try {
      const r = await fetch('/api/admin/continuity-batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reset: true }),
      })
      const d = await r.json() as { total?: number; error?: string }
      if (!r.ok || d.error) { setCbMsg(`Помилка очищення: ${d.error ?? ''}`); return }
      setCbDone(0); setCbFlagged(0); setCbLast(''); setCbMsg('Аудит очищено. Можна запускати реаудит з нуля.')
      if (d.total) setCbTotal(d.total)
    } catch {
      setCbMsg("Помилка з'єднання при очищенні.")
    }
  }

  // Конвертація тире-діалогів у «Імʼя:» — чернетка (оригінал недоторканий).
  const runDialogConvert = async (id: string) => {
    if (dlgLoading) return
    if (!confirm('Згенерувати чернетку діалогів у форматі «Імʼя:» для цього епізоду? Оригінал не змінюється — результат збережеться окремо.')) return
    setDlgLoading(id)
    try {
      const res = await fetch('/api/admin/dialog-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json() as { converted?: string; error?: string }
      if (!res.ok || data.error) {
        setDlgResult(prev => ({ ...prev, [id]: `⚠ ${data.error ?? 'Не вдалося конвертувати'}` }))
      } else {
        setDlgResult(prev => ({ ...prev, [id]: data.converted ?? '' }))
      }
    } catch {
      setDlgResult(prev => ({ ...prev, [id]: "⚠ Помилка з'єднання" }))
    } finally {
      setDlgLoading(null)
    }
  }

  // Батч-конвертація діалогів: по одному, доки done=true. Наявні чернетки не чіпає.
  const runDialogBatch = async () => {
    if (dbRunning) return
    if (!confirm('Згенерувати чернетки діалогів «Імʼя:» для ВСІХ епізодів без чернетки? Оригінали не змінюються. Це довше за шорти — кілька хвилин.')) return
    setDbRunning(true); setDbDone(0); setDbTotal(0); setDbLast(''); setDbMsg('')
    let safety = 0
    try {
      while (safety < 500) {
        safety++
        const res = await fetch('/api/admin/dialog-convert-batch', { method: 'POST' })
        const data = await res.json() as {
          done?: boolean; total?: number; remaining?: number
          processed?: { title?: string; season?: number; episode?: number } | null
          error?: string
        }
        if (!res.ok || data.error) {
          setDbMsg(`Помилка: ${data.error ?? 'невідома'}. Зупинено. Можна запустити знову — продовжить з місця.`)
          break
        }
        if (data.total) setDbTotal(data.total)
        if (data.done) {
          setDbMsg('Готово — усі епізоди мають чернетку діалогів.')
          break
        }
        if (data.processed) {
          setDbDone(d => d + 1)
          setDbLast(`S${data.processed.season}E${data.processed.episode} · ${data.processed.title ?? ''}`)
        }
      }
    } catch {
      setDbMsg("Помилка з'єднання. Зупинено. Можна запустити знову — продовжить з місця.")
    } finally {
      setDbRunning(false)
    }
  }

  const allSeasons = [...new Set(series.map(s => s.season_number))].sort((a, b) => a - b)
  const allTags    = [...new Set(series.flatMap(s => s.analyze_report?.tags ?? []))].sort()

  const filteredAndSorted = series
    .filter(s => {
      if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterSeason !== 'all' && String(s.season_number) !== filterSeason) return false
      if (filterTag !== 'all' && !(s.analyze_report?.tags ?? []).includes(filterTag)) return false
      return true
    })
    .sort((a, b) => {
      if (sortMode === 'newest') {
        return b.season_number !== a.season_number
          ? b.season_number - a.season_number
          : b.episode_number - a.episode_number
      }
      if (sortMode === 'oldest') {
        return a.season_number !== b.season_number
          ? a.season_number - b.season_number
          : a.episode_number - b.episode_number
      }
      const ra = a.analyze_report?.rating ?? -1
      const rb = b.analyze_report?.rating ?? -1
      if (sortMode === 'rating-desc') return rb - ra
      return ra - rb
    })

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Батч-генерація recap */}
        <div style={{ marginBottom: 20, padding: 14, background: NAVY, borderRadius: 12, border: '1px solid rgba(208, 163, 85,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={runRecapBatch}
              disabled={recapRunning}
              style={{
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                color: '#1a1205', background: GOLD, border: 'none',
                borderRadius: 8, padding: '9px 16px',
                cursor: recapRunning ? 'default' : 'pointer', opacity: recapRunning ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {recapRunning ? '⏳ Генерую recap…' : '✨ Згенерувати всі recap'}
            </button>
            <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>
              Тільки для епізодів без recap. Наявні не змінюються.
            </span>
          </div>
          {(recapRunning || recapDone > 0 || recapMsg) && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1', fontFamily: FONT, lineHeight: 1.6 }}>
              {recapDone > 0 && <div>Згенеровано цього запуску: <b style={{ color: GOLD }}>{recapDone}</b>{recapTotal ? ` (усього епізодів: ${recapTotal})` : ''}</div>}
              {recapLast && <div style={{ color: '#8899bb' }}>Останній: {recapLast}</div>}
              {recapMsg && <div style={{ color: recapMsg.startsWith('Помилка') ? '#dd8f8f' : '#9ae6b4' }}>{recapMsg}</div>}
            </div>
          )}
        </div>

        {/* Батч-генерація шортів-гачків (тизери без спойлера) */}
        <div style={{ marginBottom: 20, padding: 14, background: NAVY, borderRadius: 12, border: '1px solid rgba(208, 163, 85,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={runShortBatch}
              disabled={ssRunning}
              style={{
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                color: '#1a1205', background: GOLD, border: 'none',
                borderRadius: 8, padding: '9px 16px',
                cursor: ssRunning ? 'default' : 'pointer', opacity: ssRunning ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {ssRunning ? '⏳ Генерую шорти…' : '🎬 Згенерувати всі шорти-гачки'}
            </button>
            <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>
              Тизер-гачок без спойлера (~70-90 слів). Тільки для епізодів без шорту. Аудіо — пізніше.
            </span>
          </div>
          {(ssRunning || ssDone > 0 || ssMsg) && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1', fontFamily: FONT, lineHeight: 1.6 }}>
              {ssDone > 0 && <div>Згенеровано цього запуску: <b style={{ color: GOLD }}>{ssDone}</b>{ssTotal ? ` (усього епізодів: ${ssTotal})` : ''}</div>}
              {ssLast && <div style={{ color: '#8899bb' }}>Останній: {ssLast}</div>}
              {ssText && <div style={{ marginTop: 6, padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 8, color: '#e7d9bf', fontStyle: 'italic' }}>{ssText}</div>}
              {ssMsg && <div style={{ color: ssMsg.startsWith('Помилка') ? '#dd8f8f' : '#9ae6b4' }}>{ssMsg}</div>}
            </div>
          )}
        </div>

        {/* Батч-перегенерація обкладинок, зроблених повз систему (cover_meta IS NULL) */}
        <div style={{ marginBottom: 20, padding: 14, background: NAVY, borderRadius: 12, border: '1px solid rgba(208, 163, 85,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={runCoverBatch}
              disabled={covRunning}
              style={{
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                color: '#1a1205', background: GOLD, border: 'none',
                borderRadius: 8, padding: '9px 16px',
                cursor: covRunning ? 'default' : 'pointer', opacity: covRunning ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {covRunning ? '⏳ Генерую обкладинки…' : '🖼 Перегенерувати старі обкладинки'}
            </button>
            <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>
              Тільки серії без cover_meta — ті, чиї обкладинки зроблені повз систему, через що обличчя Панаса на них випадкове.
              Уже згенеровані з еталонних поз не чіпаються. ~30-90 с на серію, вкладку не закривати.
            </span>
          </div>
          {(covRunning || covDone > 0 || covMsg) && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1', fontFamily: FONT, lineHeight: 1.6 }}>
              {covDone > 0 && <div>Перегенеровано цього запуску: <b style={{ color: GOLD }}>{covDone}</b>{covTotal ? ` (треба: ${covTotal})` : ''}</div>}
              {covLast && <div style={{ color: '#8899bb' }}>Останній: {covLast}</div>}
              {covFailed.length > 0 && <div style={{ color: '#dd8f8f' }}>Збої ({covFailed.length}): {covFailed.join(', ')}</div>}
              {covMsg && <div style={{ color: covMsg.startsWith('Помилка') ? '#dd8f8f' : '#9ae6b4' }}>{covMsg}</div>}
            </div>
          )}
        </div>

        {/* Батч-генерація коротких гачків (1 речення) — для тизера на картці */}
        <div style={{ marginBottom: 20, padding: 14, background: NAVY, borderRadius: 12, border: '1px solid rgba(208, 163, 85,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={runHookBatch}
              disabled={hkRunning}
              style={{
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                color: '#1a1205', background: GOLD, border: 'none',
                borderRadius: 8, padding: '9px 16px',
                cursor: hkRunning ? 'default' : 'pointer', opacity: hkRunning ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {hkRunning ? '⏳ Генерую гачки…' : '✦ Згенерувати всі гачки (картка)'}
            </button>
            <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>
              Однореченнєвий гачок без спойлера — саме він показується зачином на картці серії. Тільки для епізодів без гачка.
            </span>
          </div>
          {(hkRunning || hkDone > 0 || hkMsg) && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1', fontFamily: FONT, lineHeight: 1.6 }}>
              {hkDone > 0 && <div>Згенеровано цього запуску: <b style={{ color: GOLD }}>{hkDone}</b>{hkTotal ? ` (усього епізодів: ${hkTotal})` : ''}</div>}
              {hkLast && <div style={{ color: '#8899bb' }}>Останній: {hkLast}</div>}
              {hkText && <div style={{ marginTop: 6, padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 8, color: '#e7d9bf', fontStyle: 'italic' }}>{hkText}</div>}
              {hkMsg && <div style={{ color: hkMsg.startsWith('Помилка') ? '#dd8f8f' : '#9ae6b4' }}>{hkMsg}</div>}
            </div>
          )}
        </div>

        {/* Батч-конвертація діалогів у «Імʼя:» (чернетки) */}
        <div style={{ marginBottom: 20, padding: 14, background: NAVY, borderRadius: 12, border: '1px solid rgba(208, 163, 85,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={runDialogBatch}
              disabled={dbRunning}
              style={{
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                color: '#1a1205', background: GOLD, border: 'none',
                borderRadius: 8, padding: '9px 16px',
                cursor: dbRunning ? 'default' : 'pointer', opacity: dbRunning ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {dbRunning ? '⏳ Конвертую діалоги…' : '↔ Конвертувати всі діалоги'}
            </button>
            <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>
              Тире → «Імʼя:» у чернетку (dialog_converted). Оригінал НЕ змінюється. Тільки для епізодів без чернетки.
            </span>
          </div>
          {(dbRunning || dbDone > 0 || dbMsg) && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1', fontFamily: FONT, lineHeight: 1.6 }}>
              {dbDone > 0 && <div>Сконвертовано цього запуску: <b style={{ color: GOLD }}>{dbDone}</b>{dbTotal ? ` (усього епізодів: ${dbTotal})` : ''}</div>}
              {dbLast && <div style={{ color: '#8899bb' }}>Останній: {dbLast}</div>}
              {dbMsg && <div style={{ color: dbMsg.startsWith('Помилка') ? '#dd8f8f' : '#9ae6b4' }}>{dbMsg}</div>}
            </div>
          )}
        </div>

        {/* Пакетний continuity-реаудит (Ф2c) */}
        <div style={{ marginBottom: 20, padding: 14, background: NAVY, borderRadius: 12, border: '1px solid rgba(201,181,244,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={runContinuityBatch}
              disabled={cbRunning}
              style={{
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                color: '#1a1205', background: '#C9B5F4', border: 'none',
                borderRadius: 8, padding: '9px 16px',
                cursor: cbRunning ? 'default' : 'pointer', opacity: cbRunning ? 0.7 : 1, whiteSpace: 'nowrap',
              }}
            >
              {cbRunning ? '⏳ Реаудит…' : '🔗 Реаудит хронології (всі)'}
            </button>
            <a
              href="/api/admin/continuity-audit-export"
              style={{
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                color: '#C9B5F4', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(201,181,244,0.4)', borderRadius: 8,
                padding: '9px 16px', textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              ⬇ Експорт CSV
            </a>
            <button
              type="button"
              onClick={runContinuityReset}
              disabled={cbRunning}
              style={{
                fontSize: 12, fontWeight: 600, fontFamily: FONT,
                color: '#8899bb', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                padding: '9px 14px', cursor: cbRunning ? 'default' : 'pointer', whiteSpace: 'nowrap',
              }}
            >
              🗑 Очистити аудит
            </button>
            <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>
              Прогін Gemini по всіх епізодах → результати в canon_audit → CSV для огляду. Повторний запуск продовжує з місця.
            </span>
          </div>
          {(cbRunning || cbDone > 0 || cbMsg) && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1', fontFamily: FONT, lineHeight: 1.6 }}>
              {cbTotal > 0 && <div>Опрацьовано цього запуску: <b style={{ color: '#C9B5F4' }}>{cbDone}</b> з {cbTotal}{cbFlagged > 0 ? ` · з проблемами: ${cbFlagged}` : ''}</div>}
              {cbLast && <div style={{ color: '#8899bb' }}>Останній: {cbLast}</div>}
              {cbMsg && <div style={{ color: cbMsg.startsWith('Помилка') ? '#dd8f8f' : '#9ae6b4' }}>{cbMsg}</div>}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            style={{ ...controlStyle, flex: '2 1 180px' }}
            placeholder="Пошук за назвою..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={{ ...controlStyle, flex: '1 1 130px', cursor: 'pointer' }} value={filterSeason} onChange={e => setFilterSeason(e.target.value)}>
            <option value="all">Усі сезони</option>
            {allSeasons.map(s => <option key={s} value={String(s)}>Сезон {s}</option>)}
          </select>
          <select style={{ ...controlStyle, flex: '1 1 130px', cursor: 'pointer' }} value={filterTag} onChange={e => setFilterTag(e.target.value)}>
            <option value="all">Усі теги</option>
            {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
          </select>
          <select style={{ ...controlStyle, flex: '1 1 150px', cursor: 'pointer' }} value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}>
            <option value="newest">Новіші зверху</option>
            <option value="oldest">Старіші зверху</option>
            <option value="rating-desc">Рейтинг ↓</option>
            <option value="rating-asc">Рейтинг ↑</option>
          </select>
          <select
            style={{ ...controlStyle, flex: '1 1 160px', cursor: 'pointer' }}
            value={coverChar}
            onChange={e => setCoverChar(e.target.value as 'auto' | 'panas' | 'ganya')}
            title="Хто на обкладинці при перегенерації"
          >
            <option value="auto">Герой: авто</option>
            <option value="panas">Герой: Панас</option>
            <option value="ganya">Герой: Ганя</option>
          </select>
          {coverChar === 'ganya' && (
            <select
              style={{ ...controlStyle, flex: '1 1 170px', cursor: 'pointer' }}
              value={coverPose}
              onChange={e => setCoverPose(e.target.value)}
              title="Яку позу Гані брати за основу"
            >
              <option value="">Поза: авто</option>
              <option value="ganya-talking">Поза: розмовляє</option>
              <option value="ganya-scolding">Поза: свариться</option>
              <option value="ganya-baking">Поза: місить тісто</option>
              <option value="ganya-holding">Поза: тримає предмет</option>
              <option value="ganya-standing">Поза: стоїть</option>
            </select>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 14, color: '#445566', fontFamily: FONT }}>
            Завантаження...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontSize: 13, color: '#dd8f8f', fontFamily: FONT }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredAndSorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 14, color: '#445566', fontFamily: FONT }}>
            Серій не знайдено
          </div>
        )}

        {/* Series list */}
        {!loading && !error && filteredAndSorted.map(s => {
          const rating = s.analyze_report?.rating ?? null
          const tags   = (s.analyze_report?.tags ?? []).slice(0, 3)
          const ep     = `S${s.season_number}E${String(s.episode_number).padStart(2, '0')}`
          const date   = new Date(s.created_at).toLocaleDateString('uk-UA')

          return (
            <div key={s.slug} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: NAVY, borderRadius: 12 }}>

              {/* Cover */}
              {s.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.cover_url}
                  alt={s.title}
                  style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 8, background: NAVY_DEEP, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#334455', flexShrink: 0 }}>
                  —
                </div>
              )}

              {/* Main area */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Row 1: episode label + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: FONT, flexShrink: 0 }}>{ep}</span>
                  {editingId === s.id ? (
                    <>
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveTitle(s.id); if (e.key === 'Escape') cancelEdit() }}
                        style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: '#f5f0e8', fontFamily: FONT, background: 'rgba(0,0,0,0.3)', border: `1px solid ${GOLD}`, borderRadius: 6, padding: '4px 8px', outline: 'none' }}
                      />
                      <button type="button" onClick={() => saveTitle(s.id)} disabled={savingId === s.id}
                        style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#1a1205', background: GOLD, border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT }}>
                        {savingId === s.id ? '…' : 'Зберегти'}
                      </button>
                      <button type="button" onClick={cancelEdit}
                        style={{ flexShrink: 0, fontSize: 14, color: '#8899bb', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#f5f0e8', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                      <button type="button" onClick={() => startEdit(s.id, s.title)} title="Редагувати назву"
                        style={{ flexShrink: 0, fontSize: 13, color: '#8899bb', background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}>✎</button>
                      {s.is_premium && (
                        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, color: GOLD, background: `${GOLD}1a`, border: `1px solid ${GOLD}55`, borderRadius: 12, padding: '2px 8px', fontFamily: FONT, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>🔒 Тільки річні</span>
                      )}
                    </>
                  )}
                </div>
                {/* Row 2: tags */}
                {tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tags.map(tag => (
                      <span key={tag} style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontFamily: FONT }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Row 3: date + audio badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>{date}</span>
                  {s.audio_status === 'ready' && <AudioWaveIcon size={14} color="#d0a355" />}
                </div>
              </div>

              {/* Rating badge */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: ratingColor(rating),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: rating != null ? 13 : 14, fontWeight: 700,
                color: rating != null ? '#fff' : '#445566',
                fontFamily: FONT,
              }}>
                {rating ?? '—'}
              </div>

              {/* Regenerate cover */}
              <button
                type="button"
                onClick={() => regenCover(s.slug, s.title)}
                disabled={covGenSlug === s.slug}
                title="Перегенерувати обкладинку (~60–90 с)"
                style={{
                  flexShrink: 0, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', color: covGenSlug === s.slug ? '#caa24a' : '#B5D4F4',
                  border: '1px solid rgba(255,255,255,0.12)', fontFamily: FONT,
                  fontSize: 12, fontWeight: 700, cursor: covGenSlug === s.slug ? 'default' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {covGenSlug === s.slug ? '⏳ Малюю…' : '🔄 Обкладинка'}
              </button>

              {/* Канон-перевірка */}
              <button
                type="button"
                onClick={() => runCanonCheck(s.id)}
                disabled={canonLoading === s.id}
                title="Механічна перевірка канону (без AI)"
                style={{
                  flexShrink: 0, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', color: canonLoading === s.id ? '#caa24a' : '#B5D4F4',
                  border: '1px solid rgba(255,255,255,0.12)', fontFamily: FONT,
                  fontSize: 12, fontWeight: 700, cursor: canonLoading === s.id ? 'default' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {canonLoading === s.id ? '⏳ Канон…' : '✓ Канон'}
              </button>

              {/* AI-continuity (Ф2a) */}
              <button
                type="button"
                onClick={() => runContinuityCheck(s.id)}
                disabled={contLoading === s.id}
                title="AI-перевірка хронології: суперечності подіям попередніх епізодів (Gemini)"
                style={{
                  flexShrink: 0, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', color: contLoading === s.id ? '#caa24a' : '#C9B5F4',
                  border: '1px solid rgba(255,255,255,0.12)', fontFamily: FONT,
                  fontSize: 12, fontWeight: 700, cursor: contLoading === s.id ? 'default' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {contLoading === s.id ? '⏳ Хронологія…' : '🔗 Хронологія'}
              </button>

              {/* Діалоги → «Імʼя:» (чернетка) */}
              <button
                type="button"
                onClick={() => runDialogConvert(s.id)}
                disabled={dlgLoading === s.id}
                title="Конвертувати тире-діалоги у «Імʼя:» (чернетка, оригінал недоторканий)"
                style={{
                  flexShrink: 0, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', color: dlgLoading === s.id ? '#caa24a' : '#B5D4F4',
                  border: '1px solid rgba(255,255,255,0.12)', fontFamily: FONT,
                  fontSize: 12, fontWeight: 700, cursor: dlgLoading === s.id ? 'default' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {dlgLoading === s.id ? '⏳ Діалоги…' : '↔ Діалоги'}
              </button>

              {/* Edit link */}
              <a
                href={`/admin/content/stories/${s.id}/edit`}
                style={{
                  flexShrink: 0, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(208, 163, 85,0.12)', color: GOLD,
                  border: '1px solid rgba(208, 163, 85,0.3)', fontFamily: FONT,
                  fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                Редагувати
              </a>

            </div>

            {/* Канон-звіт під рядком */}
            {canonReport[s.id] && (
              <div style={{ margin: '6px 0 0', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', fontFamily: FONT }}>
                {canonReport[s.id].length === 0 ? (
                  <div style={{ fontSize: 13, color: '#9ae6b4' }}>✓ Канон чистий — механічних зауважень немає.</div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 6 }}>
                      Знайдено: {canonReport[s.id].filter(f => f.severity === 'error').length} помилок · {canonReport[s.id].filter(f => f.severity === 'warn').length} попереджень
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {canonReport[s.id].map((f, i) => (
                        <li key={i} style={{ fontSize: 12.5, lineHeight: 1.5, color: f.severity === 'error' ? '#dd8f8f' : '#e7c98a', display: 'flex', gap: 8 }}>
                          <span style={{ flexShrink: 0, fontWeight: 700, opacity: 0.85 }}>{f.severity === 'error' ? '●' : '○'} {f.rule}:</span>
                          <span style={{ color: '#cbd5e1' }}>{f.message}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* AI-continuity звіт під рядком (Ф2a) */}
            {contReport[s.id] && (
              <div style={{ margin: '6px 0 0', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: 10, border: '1px solid rgba(201,181,244,0.18)', fontFamily: FONT }}>
                {'error' in contReport[s.id] ? (
                  <div style={{ fontSize: 13, color: '#dd8f8f' }}>⚠ {(contReport[s.id] as { error: string }).error}</div>
                ) : (() => {
                  const r = contReport[s.id] as ContFindings
                  const cont = r.continuity ?? []
                  const voices = r.voices ?? []
                  if (cont.length === 0 && voices.length === 0) {
                    return (
                      <div>
                        <div style={{ fontSize: 13, color: '#9ae6b4' }}>🔗 Хронологія чиста — суперечностей із попередніми епізодами не знайдено.</div>
                        {r.summary && <div style={{ fontSize: 11.5, color: '#8899bb', marginTop: 4 }}>{r.summary}</div>}
                      </div>
                    )
                  }
                  return (
                    <>
                      <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 6 }}>
                        Хронологія: {cont.filter(c => c.severity === 'error').length} суперечностей · {cont.filter(c => c.severity === 'warn').length} попереджень · голоси: {voices.length}
                      </div>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {cont.map((c, i) => (
                          <li key={`c${i}`} style={{ fontSize: 12.5, lineHeight: 1.5, color: c.severity === 'error' ? '#dd8f8f' : '#e7c98a', display: 'flex', gap: 8 }}>
                            <span style={{ flexShrink: 0, fontWeight: 700, opacity: 0.85 }}>{c.severity === 'error' ? '●' : '○'}{c.source ? ` ${c.source}` : ''}:</span>
                            <span style={{ color: '#cbd5e1' }}>{c.issue}</span>
                          </li>
                        ))}
                        {voices.map((v, i) => (
                          <li key={`v${i}`} style={{ fontSize: 12.5, lineHeight: 1.5, color: '#c9b5f4', display: 'flex', gap: 8 }}>
                            <span style={{ flexShrink: 0, fontWeight: 700, opacity: 0.85 }}>🗣 {v.character}:</span>
                            <span style={{ color: '#cbd5e1' }}>{v.issue}</span>
                          </li>
                        ))}
                      </ul>
                      {r.summary && <div style={{ fontSize: 11.5, color: '#8899bb', marginTop: 6 }}>{r.summary}</div>}
                    </>
                  )
                })()}
              </div>
            )}

            {/* Результат діалог-конвертера */}
            {dlgResult[s.id] && (
              <div style={{ margin: '6px 0 0', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: 10, border: '1px solid rgba(181,212,244,0.18)', fontFamily: FONT }}>
                <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 6 }}>
                  Чернетка діалогів «Імʼя:» (оригінал не змінено; збережено в dialog_converted). Спікери зі знаком «?» — перевір.
                </div>
                <pre style={{ margin: 0, maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12.5, lineHeight: 1.6, color: '#e7d9bf', fontFamily: FONT }}>
                  {dlgResult[s.id]}
                </pre>
              </div>
            )}

            </div>
          )
        })}

      </div>
    </div>
  )
}
