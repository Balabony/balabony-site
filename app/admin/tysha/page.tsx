'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { checkTysha, summarize, type Finding, type Severity } from '@/lib/canon/tysha'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#f0a500'
const NAVY = '#0f1e3a'
const NAVY_DEEP = '#0a1628'
const INK = '#f5f0e8'

const SEV: Record<Severity, { label: string; color: string; bg: string; order: number }> = {
  error: { label: 'помилка', color: '#d94545', bg: 'rgba(217,69,69,0.12)', order: 0 },
  warn:  { label: 'увага',   color: '#f0a500', bg: 'rgba(240,165,0,0.10)', order: 1 },
  info:  { label: 'інфо',    color: '#7aa2c4', bg: 'rgba(255,255,255,0.05)', order: 2 },
}

const TYSHA_RULES = [
  'Прибери передвісники й анонси майбутнього (жодних «я ще не знав, що…», «згодом зрозумів», «це теж минеться»). Усе має лишатися сюрпризом.',
  'Пиши простою людською мовою. Уникай складних вкладених конструкцій і нагромадження лапок.',
  'Прибери зайві слова, що розжовують рішення героя й убивають інтригу (читач здогадається сам).',
  'Зберігай формат реплік «Імʼя: текст», не через тире.',
  'Не вигадуй нових подій, персонажів чи магії. Зберігай сюжет, голос автора і приблизний обсяг.',
]

interface SeriesItem {
  id: string
  title: string
  season_number: number | null
  episode_number: number | null
  status: string
}

function countWords(t: string): number {
  return (t.match(/[А-Яа-яІіЇїЄєҐґ'’\u02bc-]+/g) ?? []).length
}

// Фон підсвітки порушення в тексті (напівпрозорий — просвічує крізь текст).
const MARK: Record<Severity, string> = {
  error: 'rgba(217,69,69,0.38)',
  warn:  'rgba(240,165,0,0.32)',
  info:  'rgba(122,162,196,0.28)',
}
const SEV_ORDER: Record<Severity, number> = { error: 0, warn: 1, info: 2 }

interface Range { start: number; end: number; sev: Severity }

// Гнучкий пошук цитати порушення в поточному тексті (пробіли = будь-які).
function findRange(text: string, excerpt: string): [number, number] | null {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  let m: RegExpMatchArray | null = null
  try { m = text.match(new RegExp(esc(excerpt.trim()))) } catch { m = null }
  if (!m || m.index == null) {
    const short = excerpt.trim().split(/\s+/).slice(0, 4).join(' ')
    try { m = text.match(new RegExp(esc(short))) } catch { m = null }
  }
  if (!m || m.index == null) return null
  return [m.index, m.index + m[0].length]
}

// Зібрати діапазони порушень, відсортувати, злити перекриття.
function computeRanges(text: string, findings: Finding[]): Range[] {
  const raw: Range[] = []
  for (const f of findings) {
    if (!f.excerpt) continue
    const r = findRange(text, f.excerpt)
    if (r) raw.push({ start: r[0], end: r[1], sev: f.severity })
  }
  raw.sort((a, b) => a.start - b.start || a.end - b.end)
  const merged: Range[] = []
  for (const r of raw) {
    const last = merged[merged.length - 1]
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end)
      if (SEV_ORDER[r.sev] < SEV_ORDER[last.sev]) last.sev = r.sev
    } else {
      merged.push({ ...r })
    }
  }
  return merged
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Побудувати HTML тексту з кольоровими <mark> навколо порушень.
function buildHighlight(text: string, findings: Finding[]): string {
  const ranges = computeRanges(text, findings)
  if (!ranges.length) return escHtml(text)
  let html = ''
  let pos = 0
  for (const r of ranges) {
    if (r.start > pos) html += escHtml(text.slice(pos, r.start))
    html += `<mark style="background:${MARK[r.sev]};color:transparent;border-radius:2px">${escHtml(text.slice(r.start, r.end))}</mark>`
    pos = r.end
  }
  html += escHtml(text.slice(pos))
  return html
}

// ─── Точкові пропозиції олюднення ────────────────────────────────────────────
// Gemini повертає список {було, стало, причина}. Кожне «було» — дослівний
// фрагмент тексту; застосування міняє лише цей фрагмент, не чіпаючи абзаци.
type Sugg = { before: string; after: string; reason: string; accepted: boolean }

// Гнучкий пошук фрагмента: апострофи/тире/пробіли — будь-які варіанти.
function flexRe(fragment: string): RegExp | null {
  const esc = fragment
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/['’ʼ`´]/g, "['’ʼ`´]")
    .replace(/[—–−-]/g, '[—–−-]')
    .replace(/\s+/g, '\\s+')
  try {
    return new RegExp(esc)
  } catch {
    return null
  }
}

// Застосувати прийняті пропозиції: для кожної міняємо ПЕРШЕ входження «було» на
// «стало». Структура тексту (абзаци, сцени) лишається недоторканою.
function applySuggestions(src: string, accepted: Sugg[]): { text: string; applied: number; skipped: number } {
  let out = src
  let applied = 0
  let skipped = 0
  for (const s of accepted) {
    const re = flexRe(s.before)
    if (re && re.test(out)) {
      out = out.replace(re, () => s.after)
      applied++
    } else {
      skipped++
    }
  }
  return { text: out, applied, skipped }
}

// ─── AI-помічники: звіти ─────────────────────────────────────────────────────
type ContReport = {
  kind: 'continuity'
  title: string | null
  season: number | null
  episode: number | null
  prevCount: number
  continuity: { severity: 'error' | 'warn'; issue: string; source?: string }[]
  voices: { character: string; issue: string }[]
  summary: string
}
type QualReport = {
  kind: 'quality'
  verdict: 'quality' | 'remarks' | 'poor'
  issues: { technical: string[]; stylistics: string[]; plot: string[] }
  summary: string
}
type AiReport = ContReport | QualReport

export default function TyshaMaisternia() {
  const [list, setList] = useState<SeriesItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [savedText, setSavedText] = useState('')
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [suggestions, setSuggestions] = useState<Sugg[] | null>(null)
  const [aiBusy, setAiBusy] = useState<string | null>(null)
  const [report, setReport] = useState<AiReport | null>(null)
  const [recapText, setRecapText] = useState<string | null>(null)
  const [pubStatus, setPubStatus] = useState<string>('draft')
  const [publishAt, setPublishAt] = useState<string>('')   // ISO з БД
  const [scheduleInput, setScheduleInput] = useState<string>('') // datetime-local
  const [pubBusy, setPubBusy] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaHook, setMetaHook] = useState('')
  const [metaTeaser, setMetaTeaser] = useState('')
  const [metaShort, setMetaShort] = useState('')
  const [metaSaved, setMetaSaved] = useState({ title: '', hook: '', teaser: '', short: '' })
  const [metaBusy, setMetaBusy] = useState(false)
  const [titleSugg, setTitleSugg] = useState<string[] | null>(null)
  const [titleBusy, setTitleBusy] = useState(false)

  const [loadingList, setLoadingList] = useState(true)
  const [loadingItem, setLoadingItem] = useState(false)
  const [saving, setSaving] = useState(false)
  const [improving, setImproving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const words = useMemo(() => countWords(text), [text])
  const dirty = text !== savedText

  const taRef = useRef<HTMLTextAreaElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [highlightOn, setHighlightOn] = useState(true)

  // HTML підсвітки: рахується від ПОТОЧНОГО тексту — щойно правиш порушення,
  // цитата зникає й пляма гасне сама (до повторної перевірки).
  const highlightHtml = useMemo(
    () => (findings && highlightOn ? buildHighlight(text, findings) : ''),
    [text, findings, highlightOn]
  )

  function syncScroll() {
    if (backRef.current && taRef.current) {
      backRef.current.scrollTop = taRef.current.scrollTop
      backRef.current.scrollLeft = taRef.current.scrollLeft
    }
  }

  // Перехід до місця порушення: знаходимо цитату в тексті (пробіли гнучко),
  // виділяємо й прокручуємо поле до неї.
  function jumpTo(excerpt?: string) {
    const ta = taRef.current
    if (!ta || !excerpt) return
    const needle = excerpt.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    let m: RegExpMatchArray | null = null
    try { m = text.match(new RegExp(needle)) } catch { m = null }
    if (!m || m.index == null) {
      // запасний варіант — перші 4 слова цитати
      const short = excerpt.trim().split(/\s+/).slice(0, 4).join(' ')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
      try { m = text.match(new RegExp(short)) } catch { m = null }
    }
    if (!m || m.index == null) return
    const start = m.index
    const end = start + m[0].length
    ta.focus()
    ta.setSelectionRange(start, end)
    // прокрутка до місця (приблизно по номеру рядка)
    const before = text.slice(0, start)
    const line = before.split('\n').length
    const lineH = 22
    ta.scrollTop = Math.max(0, (line - 4) * lineH)
    syncScroll()
  }

  const loadList = useCallback(async () => {
    setLoadingList(true); setErr('')
    try {
      const r = await fetch('/api/admin/tysha-list', { credentials: 'same-origin' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка завантаження списку')
      setList(d.items ?? [])
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => { loadList() }, [loadList])

  async function selectSeries(id: string) {
    if (dirty && !confirm('Є незбережені зміни. Відкрити іншу серію без збереження?')) return
    setLoadingItem(true); setErr(''); setMsg(''); setFindings(null); setSuggestions(null); setReport(null); setRecapText(null)
    try {
      const r = await fetch(`/api/admin/content/${id}`, { credentials: 'same-origin' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Не вдалося відкрити серію')
      const body = (d.item?.text ?? '') as string
      setSelectedId(id); setText(body); setSavedText(body)
      setPubStatus((d.item?.status ?? 'draft') as string)
      const it = d.item ?? {}
      const mt = (it.title ?? '') as string
      const mh = (it.hook ?? '') as string
      const mte = (it.next_teaser ?? '') as string
      const ms = (it.short_description ?? '') as string
      setMetaTitle(mt); setMetaHook(mh); setMetaTeaser(mte); setMetaShort(ms)
      setMetaSaved({ title: mt, hook: mh, teaser: mte, short: ms })
      setTitleSugg(null)
      const pa = (d.item?.publish_at ?? '') as string
      setPublishAt(pa)
      // ISO → формат для datetime-local (локальний час браузера)
      if (pa) {
        const dt = new Date(pa)
        const pad = (n: number) => String(n).padStart(2, '0')
        setScheduleInput(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`)
      } else {
        setScheduleInput('')
      }
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setLoadingItem(false)
    }
  }

  async function save() {
    if (!selectedId) return
    setSaving(true); setErr(''); setMsg('')
    try {
      const r = await fetch(`/api/admin/content/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка збереження')
      setSavedText(text); setMsg('Збережено')
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setSaving(false)
    }
  }

  function runCheck() {
    setFindings(checkTysha(text))
  }

  const metaDirty =
    metaTitle !== metaSaved.title || metaHook !== metaSaved.hook ||
    metaTeaser !== metaSaved.teaser || metaShort !== metaSaved.short

  async function saveMeta() {
    if (!selectedId) return
    setMetaBusy(true); setErr(''); setMsg('')
    try {
      const r = await fetch(`/api/admin/content/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ title: metaTitle, hook: metaHook, next_teaser: metaTeaser, short_description: metaShort }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка збереження метаданих')
      setMetaSaved({ title: metaTitle, hook: metaHook, teaser: metaTeaser, short: metaShort })
      setMsg('Метадані збережено')
      loadList()
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setMetaBusy(false)
    }
  }

  async function suggestTitles() {
    setTitleBusy(true); setErr(''); setTitleSugg(null)
    try {
      const r = await fetch('/api/admin/suggest-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка генерації назв')
      setTitleSugg(Array.isArray(d.titles) ? d.titles : [])
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setTitleBusy(false)
    }
  }

  async function doPublish(action: 'publish' | 'schedule' | 'unpublish') {
    if (!selectedId) return
    if (action === 'schedule' && !scheduleInput) { setErr('Вкажи дату й час публікації'); return }
    setPubBusy(true); setErr(''); setMsg('')
    try {
      const payload: Record<string, unknown> = { id: selectedId, action }
      if (action === 'schedule') payload.publish_at = new Date(scheduleInput).toISOString()
      const r = await fetch('/api/admin/tysha-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка публікації')
      setPubStatus(d.status as string)
      setPublishAt((d.publish_at ?? '') as string)
      setMsg(action === 'publish' ? 'Опубліковано' : action === 'schedule' ? 'Заплановано' : 'Знято з публікації')
      loadList()
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setPubBusy(false)
    }
  }

  async function improve() {
    setImproving(true); setErr(''); setMsg(''); setSuggestions(null)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 75000)
    try {
      const r = await fetch('/api/admin/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text, recommendations: TYSHA_RULES }),
        signal: ctrl.signal,
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка олюднення')
      const raw = (d.suggestions ?? []) as { before: string; after: string; reason: string }[]
      const dropped = typeof d.dropped === 'number' ? d.dropped : 0
      if (raw.length > 0) {
        setSuggestions(raw.map((s) => ({ ...s, accepted: true })))
      } else {
        setMsg(dropped > 0
          ? 'Пропозиції не пройшли перевірку (фрагментів нема в тексті) — текст лишаю як є.'
          : 'Олюднення не запропонувало змін — текст уже чистий.')
      }
    } catch (e) {
      const m = e instanceof Error && e.name === 'AbortError'
        ? 'Gemini не встиг за 75 c. Спробуй ще раз або коротшу серію.'
        : String(e instanceof Error ? e.message : e)
      setErr(m)
    } finally {
      clearTimeout(timer)
      setImproving(false)
    }
  }

  // ── AI-помічники (батч 1: аналізатори + recap) ──
  function clearPanels() { setErr(''); setMsg(''); setFindings(null); setSuggestions(null); setReport(null); setRecapText(null) }

  async function runContinuity() {
    if (!selectedId) return
    clearPanels(); setAiBusy('continuity')
    try {
      const r = await fetch('/api/admin/continuity-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: selectedId }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка перевірки хронології')
      setReport({ kind: 'continuity', title: d.title ?? null, season: d.season ?? null, episode: d.episode ?? null, prevCount: d.prevCount ?? 0, continuity: d.findings?.continuity ?? [], voices: d.findings?.voices ?? [], summary: d.findings?.summary ?? '' })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Помилка') } finally { setAiBusy(null) }
  }

  async function runQuality() {
    if (!text.trim()) return
    clearPanels(); setAiBusy('quality')
    try {
      const r = await fetch('/api/admin/quality-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка перевірки якості')
      setReport({ kind: 'quality', verdict: d.verdict ?? 'remarks', issues: { technical: d.issues?.technical ?? [], stylistics: d.issues?.stylistics ?? [], plot: d.issues?.plot ?? [] }, summary: d.summary ?? '' })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Помилка') } finally { setAiBusy(null) }
  }

  async function genRecap() {
    if (!text.trim()) return
    clearPanels(); setAiBusy('recap')
    try {
      const r = await fetch('/api/admin/recap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text, title: metaTitle }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка генерації recap')
      setRecapText((d.recap ?? '').trim())
    } catch (e) { setErr(e instanceof Error ? e.message : 'Помилка') } finally { setAiBusy(null) }
  }

  async function saveRecap() {
    if (!selectedId || !recapText) return
    setAiBusy('recap-save'); setErr(''); setMsg('')
    try {
      const r = await fetch(`/api/admin/content/${selectedId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ recap: recapText }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Не вдалося зберегти recap')
      setMsg('Recap збережено — живить блок «Що було раніше» в наступній серії'); setRecapText(null)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Помилка') } finally { setAiBusy(null) }
  }

  const sum = findings ? summarize(findings) : null
  const sorted = findings
    ? [...findings].sort((a, b) => SEV[a.severity].order - SEV[b.severity].order)
    : []

  const btn = (bg: string, on: boolean): React.CSSProperties => ({
    padding: '9px 16px', borderRadius: 8, border: 'none', cursor: on ? 'pointer' : 'default',
    background: on ? bg : 'rgba(255,255,255,0.15)', color: on ? NAVY_DEEP : 'rgba(245,240,232,0.5)',
    fontWeight: 700, fontSize: 13, fontFamily: FONT,
  })

  const metaInput: React.CSSProperties = {
    display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4,
    padding: '8px 10px', borderRadius: 8, background: NAVY_DEEP, color: INK,
    border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, fontFamily: FONT, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', gap: 16, maxWidth: 1180, margin: '0 auto', padding: '20px 16px', fontFamily: FONT, color: INK, alignItems: 'flex-start' }}>

      <aside style={{ width: 230, flexShrink: 0, position: 'sticky', top: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px' }}>Серії «Тиші»</h2>
        {loadingList && <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.5)' }}>Завантаження…</div>}
        {list.map((s) => {
          const active = s.id === selectedId
          return (
            <button
              key={s.id}
              onClick={() => selectSeries(s.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', marginBottom: 4,
                padding: '9px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: FONT,
                background: active ? GOLD : NAVY, color: active ? NAVY_DEEP : INK,
                border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`,
                fontWeight: active ? 700 : 500,
              }}
            >
              {s.episode_number != null ? `${s.episode_number}. ` : ''}{s.title}
              <span style={{ display: 'block', fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                {s.status}
              </span>
            </button>
          )
        })}
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.6)', margin: '0 0 12px' }}>
          Обери серію зліва, правь текст, перевіряй канон і зберігай. «Олюднити» — Gemini за правилами «Тиші».
          Механіка ловить грубе — вичитуй ще й оком.
        </p>

        {err && <div style={{ padding: 10, borderRadius: 8, background: 'rgba(217,69,69,0.15)', border: '1px solid #d94545', marginBottom: 10, fontSize: 13 }}>{err}</div>}

        {!selectedId && !loadingItem && (
          <div style={{ padding: 24, textAlign: 'center', color: 'rgba(245,240,232,0.5)', fontSize: 14 }}>
            ← Обери серію зі списку
          </div>
        )}

        {loadingItem && <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.5)' }}>Відкриваю серію…</div>}

        {selectedId && !loadingItem && (
          <>
            <div style={{ position: 'relative', height: 440, borderRadius: 10, border: `1px solid ${dirty ? GOLD : 'rgba(255,255,255,0.12)'}`, overflow: 'hidden', background: NAVY_DEEP }}>
              {/* Шар підсвітки (під текстом) */}
              <div
                ref={backRef}
                aria-hidden
                style={{
                  position: 'absolute', inset: 0, margin: 0, padding: 14, overflow: 'hidden',
                  pointerEvents: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  fontSize: 14, lineHeight: 1.55, fontFamily: "'Georgia', serif",
                  color: 'transparent', boxSizing: 'border-box',
                }}
                dangerouslySetInnerHTML={{ __html: highlightHtml }}
              />
              {/* Текстове поле (прозорий фон — плями просвічують) */}
              <textarea
                ref={taRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onScroll={syncScroll}
                spellCheck={false}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%', resize: 'none',
                  boxSizing: 'border-box', padding: 14, background: 'transparent', color: INK,
                  caretColor: INK, border: 'none',
                  fontSize: 14, lineHeight: 1.55, fontFamily: "'Georgia', serif", outline: 'none',
                }}
              />
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '8px 0 0', fontSize: 12.5, color: 'rgba(245,240,232,0.6)', cursor: 'pointer' }}>
              <input type="checkbox" checked={highlightOn} onChange={(e) => setHighlightOn(e.target.checked)} />
              Підсвічувати порушення в тексті
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0', flexWrap: 'wrap' }}>
              <button onClick={save} disabled={!dirty || saving} style={btn(GOLD, dirty && !saving)}>
                {saving ? 'Зберігаю…' : dirty ? 'Зберегти' : 'Збережено'}
              </button>
              <button onClick={runCheck} disabled={!text.trim()} style={btn('#7aa2c4', !!text.trim())}>
                Перевірити канон
              </button>
              <button onClick={improve} disabled={improving || !text.trim()} style={btn('#9b8cff', !improving && !!text.trim())}>
                {improving ? 'Олюднюю…' : 'Олюднити (Gemini)'}
              </button>
              <button onClick={runContinuity} disabled={!selectedId || aiBusy !== null} style={btn('#7aa2c4', !!selectedId && aiBusy === null)}>
                {aiBusy === 'continuity' ? 'Перевіряю…' : 'Хронологія'}
              </button>
              <button onClick={runQuality} disabled={!text.trim() || aiBusy !== null} style={btn('#7aa2c4', !!text.trim() && aiBusy === null)}>
                {aiBusy === 'quality' ? 'Перевіряю…' : 'Якість'}
              </button>
              <button onClick={genRecap} disabled={!text.trim() || aiBusy !== null} style={btn('#c4a27a', !!text.trim() && aiBusy === null)}>
                {aiBusy === 'recap' ? 'Генерую…' : 'Recap'}
              </button>
              {msg && <span style={{ fontSize: 13, color: '#7ddb9f' }}>{msg}</span>}
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'rgba(245,240,232,0.5)' }}>
                {words} слів{words > 0 && words < 1500 ? ' · закоротко' : ''}{words > 2300 ? ' · задовго' : ''}
                {dirty ? ' · не збережено' : ''}
              </span>
            </div>

            {/* ─── Метадані серії ─── */}
            <div style={{ margin: '6px 0 14px', padding: 14, borderRadius: 10, background: NAVY, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 13 }}>Метадані серії</strong>
                <button onClick={saveMeta} disabled={!metaDirty || metaBusy} style={{ ...btn(GOLD, metaDirty && !metaBusy), padding: '6px 13px', fontSize: 12 }}>
                  {metaBusy ? 'Зберігаю…' : metaDirty ? 'Зберегти метадані' : 'Збережено'}
                </button>
                <button onClick={suggestTitles} disabled={titleBusy || !text.trim()} style={{ ...btn('#9b8cff', !titleBusy && !!text.trim()), padding: '6px 13px', fontSize: 12 }}>
                  {titleBusy ? 'Генерую…' : 'AI-назви'}
                </button>
              </div>

              {titleSugg && (
                <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {titleSugg.length === 0 && <span style={{ fontSize: 12, color: 'rgba(245,240,232,0.5)' }}>Gemini не дав варіантів.</span>}
                  {titleSugg.map((t, i) => (
                    <button key={i} onClick={() => setMetaTitle(t)} style={{ fontSize: 12, color: '#bcb0ff', background: 'rgba(155,140,255,0.1)', border: '1px solid #9b8cff', borderRadius: 16, padding: '4px 11px', cursor: 'pointer', fontFamily: FONT }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gap: 9 }}>
                <label style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.55)' }}>
                  Назва серії
                  <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} style={metaInput} />
                </label>
                <label style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.55)' }}>
                  Гачок (короткий тізер для картки рубрики)
                  <textarea value={metaHook} onChange={(e) => setMetaHook(e.target.value)} rows={2} style={{ ...metaInput, resize: 'vertical', fontFamily: "'Georgia', serif" }} />
                </label>
                <label style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.55)' }}>
                  Тізер наступної серії (рядок «далі буде» в читалці)
                  <textarea value={metaTeaser} onChange={(e) => setMetaTeaser(e.target.value)} rows={2} style={{ ...metaInput, resize: 'vertical', fontFamily: "'Georgia', serif" }} />
                </label>
                <label style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.55)' }}>
                  Короткий опис (для прев'ю / пошуку)
                  <textarea value={metaShort} onChange={(e) => setMetaShort(e.target.value)} rows={2} style={{ ...metaInput, resize: 'vertical' }} />
                </label>
              </div>
            </div>

            {/* ─── Публікація / планувальник ─── */}
            <div style={{ margin: '6px 0 14px', padding: 14, borderRadius: 10, background: NAVY, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 13 }}>Публікація</strong>
                {(() => {
                  const map: Record<string, { t: string; c: string }> = {
                    draft:     { t: 'чернетка',    c: 'rgba(255,255,255,0.5)' },
                    scheduled: { t: 'заплановано', c: '#9b8cff' },
                    published: { t: 'опубліковано', c: '#7ddb9f' },
                  }
                  const m = map[pubStatus] ?? { t: pubStatus, c: 'rgba(255,255,255,0.5)' }
                  return <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: m.c }}>{m.t}</span>
                })()}
                {pubStatus === 'scheduled' && publishAt && (
                  <span style={{ fontSize: 12, color: 'rgba(245,240,232,0.6)' }}>
                    вийде: {new Date(publishAt).toLocaleString('uk-UA')}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="datetime-local"
                  value={scheduleInput}
                  onChange={(e) => setScheduleInput(e.target.value)}
                  style={{ padding: '7px 9px', borderRadius: 8, background: NAVY_DEEP, color: INK, border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, fontFamily: FONT, outline: 'none' }}
                />
                <button onClick={() => doPublish('schedule')} disabled={pubBusy || !scheduleInput} style={btn('#9b8cff', !pubBusy && !!scheduleInput)}>
                  Запланувати
                </button>
                <button onClick={() => doPublish('publish')} disabled={pubBusy} style={btn('#7ddb9f', !pubBusy)}>
                  Опублікувати зараз
                </button>
                {pubStatus !== 'draft' && (
                  <button onClick={() => doPublish('unpublish')} disabled={pubBusy} style={{ padding: '9px 14px', borderRadius: 8, cursor: pubBusy ? 'default' : 'pointer', background: 'transparent', color: 'rgba(245,240,232,0.65)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, fontFamily: FONT }}>
                    Зняти
                  </button>
                )}
              </div>
              <p style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.45)', margin: '8px 0 0' }}>
                Запланована серія зʼявиться на сайті точно в заданий час (час — твого пристрою).
              </p>
            </div>

            {/* Точкові пропозиції олюднення */}
            {suggestions !== null && (() => {
              const total = suggestions.length
              const acceptedCount = suggestions.filter((s) => s.accepted).length
              const setAll = (val: boolean) => setSuggestions((cur) => cur!.map((s) => ({ ...s, accepted: val })))
              const toggle = (idx: number) => setSuggestions((cur) => cur!.map((s, i) => (i === idx ? { ...s, accepted: !s.accepted } : s)))
              const apply = () => {
                const acc = suggestions.filter((s) => s.accepted)
                const res = applySuggestions(text, acc)
                setText(res.text)
                setSuggestions(null)
                setMsg(res.skipped > 0
                  ? `Застосовано ${res.applied}, пропущено ${res.skipped} (фрагмент уже змінився). Не забудь зберегти.`
                  : `Застосовано ${res.applied}. Не забудь зберегти.`)
              }
              return (
                <div style={{ margin: '14px 0', padding: 14, borderRadius: 10, background: 'rgba(155,140,255,0.08)', border: '1px solid #9b8cff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13, color: '#bcb0ff' }}>Пропозиції олюднення: {total}, прийнято {acceptedCount}</strong>
                    <button onClick={() => setAll(true)} style={{ ...btn('#7ddb9f', true), padding: '5px 11px', fontSize: 12 }}>Прийняти всі</button>
                    <button onClick={() => setAll(false)} style={{ padding: '5px 11px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 12, fontFamily: FONT }}>Зняти всі</button>
                    <button onClick={apply} disabled={acceptedCount === 0} style={{ ...btn('#9b8cff', acceptedCount > 0), padding: '5px 11px', fontSize: 12 }}>Застосувати ({acceptedCount})</button>
                    <button onClick={() => setSuggestions(null)} style={{ padding: '5px 11px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontFamily: FONT }}>Скасувати</button>
                  </div>
                  <div style={{ maxHeight: 460, overflowY: 'auto' }}>
                    {suggestions.map((s, idx) => (
                      <div key={idx} style={{ borderRadius: 8, border: `1px solid ${s.accepted ? '#9b8cff' : 'rgba(255,255,255,0.14)'}`, overflow: 'hidden', opacity: s.accepted ? 1 : 0.55, marginBottom: 10 }}>
                        <div style={{ padding: '8px 10px', background: 'rgba(217,69,69,0.20)', borderLeft: '3px solid #d94545', fontSize: 13.5, lineHeight: 1.55, color: '#f3d3d3', fontFamily: "'Georgia', serif", maxHeight: 200, overflowY: 'auto' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#e88', textTransform: 'uppercase', letterSpacing: 0.5 }}>було</span><br />{s.before}
                        </div>
                        <div style={{ padding: '8px 10px', background: 'rgba(45,143,78,0.20)', borderLeft: '3px solid #2d8f4e', fontSize: 13.5, lineHeight: 1.55, color: '#cdebd6', fontFamily: "'Georgia', serif", maxHeight: 200, overflowY: 'auto' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#7ddb9f', textTransform: 'uppercase', letterSpacing: 0.5 }}>стало</span><br />{s.after}
                        </div>
                        {s.reason && (
                          <div style={{ padding: '5px 10px', fontSize: 11.5, color: 'rgba(245,240,232,0.6)', fontStyle: 'italic', fontFamily: FONT }}>
                            чому: {s.reason}
                          </div>
                        )}
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(0,0,0,0.25)', fontSize: 12.5, cursor: 'pointer', fontFamily: FONT, color: s.accepted ? '#7ddb9f' : 'rgba(245,240,232,0.55)' }}>
                          <input type="checkbox" checked={s.accepted} onChange={() => toggle(idx)} />
                          {s.accepted ? 'прийняти цю зміну' : 'лишити як було'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* AI-звіт: хронологія / якість */}
            {report && (
              <div style={{ margin: '14px 0', padding: 14, borderRadius: 10, background: 'rgba(122,162,196,0.08)', border: '1px solid #7aa2c4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <strong style={{ fontSize: 13, color: '#a9c6dd' }}>{report.kind === 'continuity' ? 'Хронологія / континуїті' : 'Перевірка якості'}</strong>
                  <button onClick={() => setReport(null)} style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontFamily: FONT }}>Закрити</button>
                </div>
                {report.kind === 'continuity' ? (
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#d8d2c6' }}>
                    <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.55)', marginBottom: 8 }}>Звірено з {report.prevCount} попередніми серіями</div>
                    {report.summary && <p style={{ margin: '0 0 10px', fontStyle: 'italic' }}>{report.summary}</p>}
                    {report.continuity.length === 0 && report.voices.length === 0 && <p style={{ margin: 0, color: '#7ddb9f' }}>Суперечностей не знайдено.</p>}
                    {report.continuity.map((c, i) => (
                      <div key={`c${i}`} style={{ padding: '7px 10px', marginBottom: 6, borderRadius: 6, borderLeft: `3px solid ${c.severity === 'error' ? '#e0484d' : '#e0a23d'}`, background: 'rgba(0,0,0,0.2)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: c.severity === 'error' ? '#ef8a8d' : '#e0c07d' }}>{c.severity === 'error' ? 'суперечність' : 'увага'}</span>
                        <div>{c.issue}</div>
                        {c.source && <div style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.5)', marginTop: 2 }}>джерело: {c.source}</div>}
                      </div>
                    ))}
                    {report.voices.map((v, i) => (
                      <div key={`v${i}`} style={{ padding: '7px 10px', marginBottom: 6, borderRadius: 6, borderLeft: '3px solid #9b8cff', background: 'rgba(0,0,0,0.2)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#bcb0ff' }}>голос · {v.character}</span>
                        <div>{v.issue}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#d8d2c6' }}>
                    {(() => {
                      const vc = report.verdict === 'quality' ? '#7ddb9f' : report.verdict === 'poor' ? '#e0484d' : '#e0a23d'
                      const vt = report.verdict === 'quality' ? 'Якісно' : report.verdict === 'poor' ? 'Слабко' : 'Із зауваженнями'
                      return <span style={{ display: 'inline-block', marginBottom: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: vc, border: `1px solid ${vc}`, borderRadius: 6, padding: '3px 10px' }}>{vt}</span>
                    })()}
                    {report.summary && <p style={{ margin: '0 0 10px', fontStyle: 'italic' }}>{report.summary}</p>}
                    {([['Технічне', report.issues.technical], ['Стилістика', report.issues.stylistics], ['Сюжет/персонажі', report.issues.plot]] as [string, string[]][]).map(([label, arr]) => arr.length > 0 && (
                      <div key={label} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(245,240,232,0.5)', marginBottom: 3 }}>{label}</div>
                        {arr.map((it, i) => <div key={i} style={{ padding: '5px 10px', marginBottom: 4, borderRadius: 6, borderLeft: '3px solid #e0a23d', background: 'rgba(0,0,0,0.2)' }}>{it}</div>)}
                      </div>
                    ))}
                    {report.issues.technical.length === 0 && report.issues.stylistics.length === 0 && report.issues.plot.length === 0 && <p style={{ margin: 0, color: '#7ddb9f' }}>Зауважень немає.</p>}
                  </div>
                )}
              </div>
            )}

            {/* Recap: згенеровано — переглянь і збережи */}
            {recapText !== null && (
              <div style={{ margin: '14px 0', padding: 14, borderRadius: 10, background: 'rgba(196,162,122,0.08)', border: '1px solid #c4a27a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 13, color: '#d6bd9c' }}>Recap цієї серії</strong>
                  <span style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.5)' }}>покаже наступна серія в блоці «Що було раніше»</span>
                  <button onClick={saveRecap} disabled={aiBusy === 'recap-save' || !recapText.trim()} style={{ ...btn('#c4a27a', aiBusy !== 'recap-save' && !!recapText.trim()), padding: '5px 12px', fontSize: 12, marginLeft: 'auto' }}>{aiBusy === 'recap-save' ? 'Зберігаю…' : 'Зберегти recap'}</button>
                  <button onClick={() => setRecapText(null)} style={{ padding: '5px 11px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontFamily: FONT }}>Скасувати</button>
                </div>
                <textarea value={recapText} onChange={(e) => setRecapText(e.target.value)} rows={4} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.25)', color: '#f5f0e8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 14, lineHeight: 1.6, fontFamily: "'Georgia', serif", resize: 'vertical' }} />
              </div>
            )}

            {sum && (
              <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
                {(['error', 'warn', 'info'] as Severity[]).map((s) => (
                  <div key={s} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: SEV[s].bg, border: `1px solid ${SEV[s].color}` }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: SEV[s].color }}>{sum[s]}</div>
                    <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{SEV[s].label}</div>
                  </div>
                ))}
              </div>
            )}

            {findings && findings.length === 0 && (
              <div style={{ padding: 14, borderRadius: 10, background: 'rgba(45,143,78,0.12)', border: '1px solid #2d8f4e', color: '#7ddb9f', fontSize: 14 }}>
                Чисто — механічних зауважень немає. Усе одно перечитай оком: прихований передвісник і магію в підтексті функція не ловить.
              </div>
            )}

            {sorted.map((f, i) => (
              <div
                key={i}
                onClick={() => jumpTo(f.excerpt)}
                title={f.excerpt ? 'Клік — показати місце в тексті' : undefined}
                style={{ margin: '8px 0', padding: '11px 13px', borderRadius: 10, background: SEV[f.severity].bg, borderLeft: `3px solid ${SEV[f.severity].color}`, cursor: f.excerpt ? 'pointer' : 'default' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: SEV[f.severity].color }}>{SEV[f.severity].label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{f.rule}</span>
                  {f.excerpt && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(245,240,232,0.45)' }}>показати в тексті →</span>}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.85)', lineHeight: 1.4 }}>{f.message}</div>
                {f.excerpt && (
                  <div style={{ marginTop: 5, padding: '6px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.25)', fontSize: 12.5, color: 'rgba(245,240,232,0.7)', fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                    «{f.excerpt}»
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
