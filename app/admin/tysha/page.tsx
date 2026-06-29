'use client'

import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react'
import { checkTysha, summarize, autofixTypography, type Finding, type Severity } from '@/lib/canon/tysha'

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
  slug?: string
  title: string
  season_number: number | null
  episode_number: number | null
  status: string
  audioStatus?: string | null
  hasAudio?: boolean
  canonErrors?: number
  canonWarns?: number
  coverUrl?: string | null
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: 'чернетка', color: '#9aa0a6' },
  scheduled: { label: 'заплановано', color: '#6b6f9e' },
  published: { label: 'опубліковано', color: '#8fc4a6' },
}

function chip(color: string): React.CSSProperties {
  return { fontSize: 10, fontWeight: 700, color, background: `${color}22`, border: `1px solid ${color}66`, borderRadius: 5, padding: '1px 6px', letterSpacing: 0.3, whiteSpace: 'nowrap' }
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

export default function TyshaMaisternia() {
  const [list, setList] = useState<SeriesItem[]>([])
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [savedText, setSavedText] = useState('')
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [suggestions, setSuggestions] = useState<Sugg[] | null>(null)
  const [aiBusy, setAiBusy] = useState<string | null>(null)
  const [recapText, setRecapText] = useState<string | null>(null)
  const [cleaned, setCleaned] = useState<string | null>(null)
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
  // --- Обкладинка серії ---
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverBusy, setCoverBusy] = useState<'' | 'upload' | 'ai'>('')
  const [coverEdit, setCoverEdit] = useState('')   // опис правки для AI
  const [coverPos, setCoverPos] = useState(40)     // позиція кадру по вертикалі, % (менше = вище)
  const [posBusy, setPosBusy] = useState(false)
  const coverFileRef = useRef<HTMLInputElement | null>(null)
  const [saving, setSaving] = useState(false)
  const [improving, setImproving] = useState(false)
  const [spellBusy, setSpellBusy] = useState(false)
  const [punctBusy, setPunctBusy] = useState(false)
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

  // Завантажити ВЛАСНЕ фото як обкладинку поточної серії.
  async function uploadOwnCover(file: File) {
    if (!selectedId) return
    setCoverBusy('upload'); setErr(''); setMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('episode_id', selectedId)
      const r = await fetch('/api/admin/tysha-upload-cover', { method: 'POST', body: fd, credentials: 'same-origin' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Не вдалося завантажити фото')
      setCoverUrl(d.url)
      setList((cur) => cur.map((x) => (x.id === selectedId ? { ...x, coverUrl: d.url } : x)))
      setMsg('Фото завантажено й присвоєно серії')
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setCoverBusy('')
      if (coverFileRef.current) coverFileRef.current.value = ''
    }
  }

  // AI-редагування поточної обкладинки: flux-kontext змінює фото за описом, обличчя тримається.
  async function editCoverAI() {
    if (!selectedId || !coverUrl) { setErr('Спершу має бути обкладинка'); return }
    if (!coverEdit.trim()) { setErr('Опиши, що змінити (англ. краще)'); return }
    setCoverBusy('ai'); setErr(''); setMsg('')
    try {
      const r = await fetch('/api/admin/generate-tysha-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ mode: 'cover', referenceImageUrl: coverUrl, scene: coverEdit.trim() }),
      })
      const d = await r.json()
      if (!r.ok || !d.url) throw new Error(d.error || 'AI не зміг відредагувати')
      // присвоїти нову обкладинку серії
      await fetch(`/api/admin/content/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ cover_url: d.url }),
      })
      setCoverUrl(d.url)
      setList((cur) => cur.map((x) => (x.id === selectedId ? { ...x, coverUrl: d.url } : x)))
      setMsg('Обкладинку відредаговано через AI')
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setCoverBusy('')
    }
  }

  // Зберегти позицію кадру обкладинки (object-position center NN%).
  async function saveCoverPos(pos: number) {
    if (!selectedId) return
    setPosBusy(true); setErr('')
    try {
      const value = `center ${pos}%`
      const r = await fetch(`/api/admin/content/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ cover_position: value }),
      })
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Не вдалося зберегти позицію') }
      setMsg('Позицію фото збережено')
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setPosBusy(false)
    }
  }

  async function selectSeries(id: string) {
    if (dirty && !confirm('Є незбережені зміни. Відкрити іншу серію без збереження?')) return
    setLoadingItem(true); setErr(''); setMsg(''); setFindings(null); setSuggestions(null); setRecapText(null); setCleaned(null)
    try {
      const r = await fetch(`/api/admin/content/${id}`, { credentials: 'same-origin' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Не вдалося відкрити серію')
      const body = (d.item?.text ?? '') as string
      setSelectedId(id); setText(body); setSavedText(body)
      setCoverUrl((d.item?.cover_url ?? null) as string | null)
      setCoverEdit('')
      // cover_position у форматі 'center NN%' → дістаємо NN (дефолт 40)
      { const cp = (d.item?.cover_position ?? '') as string; const m = cp.match(/(\d+(?:\.\d+)?)%/); setCoverPos(m ? Math.round(parseFloat(m[1])) : 40) }
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
    const f = checkTysha(text)
    setFindings(f)
    setErr('')
    if (f.length === 0) {
      setMsg('Перевірено — чисто. Усе одно перечитай оком: прихований передвісник/магію в підтексті механіка не ловить.')
    } else {
      const s = summarize(f)
      const parts: string[] = []
      if (s.error) parts.push(`помилок ${s.error}`)
      if (s.warn) parts.push(`уваг ${s.warn}`)
      if (s.info) parts.push(`інфо ${s.info}`)
      setMsg(`Перевірено: ${parts.join(', ')} — підсвічено в тексті, зведення нижче ↓`)
    }
  }

  // ОДНА КНОПКА: безпечне (пробіли, лапки, очевидні крапки) застосовую ОДРАЗУ;
  // крапки в реченнях (імена, склеєні) показую в панелі «було→стане» з так/ні.
  async function fixAll() {
    if (!text.trim()) return
    setPunctBusy(true); setErr(''); setMsg(''); setSuggestions(null)

    // 1) Безпечна типографіка — миттєво, без перегляду.
    const det = autofixTypography(text)
    const working = det.text
    if (working !== text) { setText(working); setFindings(checkTysha(working)) }
    else setFindings(checkTysha(working))

    // 2) AI-крапки в реченнях → у панель на перегляд (так/ні), не авто.
    let aiNote = ''
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 75000)
    try {
      const r = await fetch('/api/admin/tysha-punct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text: working }),
        signal: ctrl.signal,
      })
      const d = await r.json()
      if (r.ok) {
        const raw = (d.suggestions ?? []) as { before: string; after: string; reason: string }[]
        const blockNote = typeof d.note === 'string' && d.note ? ` · ${d.note}` : ''
        if (raw.length) {
          setSuggestions(raw.map((s) => ({ ...s, accepted: true })))
          setMsg(`Типографіку виправлено (${det.total}). Крапки в реченнях — переглянь нижче (так/ні) і «Застосувати».${blockNote}`)
          setPunctBusy(false)
          return
        }
        aiNote = d.note || ''
      } else {
        aiNote = d.error || 'AI-крапки не спрацювали'
      }
    } catch (e) {
      aiNote = e instanceof Error && e.name === 'AbortError' ? 'AI не встиг за 75 c' : 'AI недоступний'
    } finally {
      clearTimeout(timer)
    }

    // Якщо AI нічого не дав / впав.
    const base = det.total ? `Типографіку виправлено (${det.total}).` : 'Типографіка вже чиста.'
    setMsg(aiNote ? `${base} Крапки в реченнях не перевірено · ${aiNote}` : `${base} Пропущених крапок у реченнях не знайдено.`)
    setPunctBusy(false)
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

  // Перевірка правопису: орфографія/пунктуація/граматика з опорою на базу /pravopys.
  // Показує пропозиції в тій самій панелі, що «Олюднити» (було→стало→причина).
  async function spellcheck() {
    if (!text.trim()) return
    setSpellBusy(true); setErr(''); setMsg(''); setSuggestions(null)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 75000)
    try {
      const r = await fetch('/api/admin/tysha-spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text }),
        signal: ctrl.signal,
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка перевірки правопису')
      const raw = (d.suggestions ?? []) as { before: string; after: string; reason: string }[]
      const blockNote = typeof d.note === 'string' && d.note ? ` · ${d.note}` : ''
      if (raw.length > 0) {
        setSuggestions(raw.map((s) => ({ ...s, accepted: true })))
        setMsg((d.usedRules ? 'Перевірено за правописом із бази /pravopys' : 'Перевірено (база правил недоступна — загальні норми)') + blockNote)
      } else {
        setMsg((d.note ? d.note : 'Помилок правопису не знайдено — текст чистий.'))
      }
    } catch (e) {
      const m = e instanceof Error && e.name === 'AbortError'
        ? 'Gemini не встиг за 75 c. Спробуй ще раз або коротшу серію.'
        : String(e instanceof Error ? e.message : e)
      setErr(m)
    } finally {
      clearTimeout(timer)
      setSpellBusy(false)
    }
  }

  // ── AI-помічники (батч 1: аналізатори + recap) ──
  function clearPanels() { setErr(''); setMsg(''); setFindings(null); setSuggestions(null); setRecapText(null); setCleaned(null) }

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

  async function cleanTts() {
    if (!text.trim()) return
    clearPanels(); setAiBusy('clean')
    try {
      const r = await fetch('/api/admin/clean-for-tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка чистки для TTS')
      setCleaned((d.cleanedText ?? '').trim())
    } catch (e) { setErr(e instanceof Error ? e.message : 'Помилка') } finally { setAiBusy(null) }
  }

  async function createSeries() {
    setCreating(true); setErr(''); setMsg('')
    try {
      const r = await fetch('/api/admin/tysha-create', { method: 'POST', credentials: 'same-origin' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Не вдалося створити серію')
      await loadList()
      if (d.id) selectSeries(d.id)
      setMsg(`Створено серію №${d.episode_number} (чернетка)`)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Помилка') } finally { setCreating(false) }
  }

  async function deleteSeries() {
    if (!selectedId) return
    const t = list.find((x) => x.id === selectedId)?.title ?? 'цю серію'
    if (!window.confirm(`Видалити «${t}»? Цю дію НЕ можна скасувати.`)) return
    setDeleting(true); setErr(''); setMsg('')
    try {
      const r = await fetch(`/api/admin/content/${selectedId}`, { method: 'DELETE', credentials: 'same-origin' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Не вдалося видалити')
      setSelectedId(null); setText('')
      await loadList()
      setMsg('Серію видалено')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Помилка') } finally { setDeleting(false) }
  }

  const sum = findings ? summarize(findings) : null
  const sorted = findings
    ? [...findings].sort((a, b) => SEV[a.severity].order - SEV[b.severity].order)
    : []
  // Зведення по типах правил (для компактного списку без лінків-стрибків).
  const grouped = (() => {
    const map = new Map<string, { rule: string; severity: Severity; count: number; example?: string }>()
    for (const f of sorted) {
      const g = map.get(f.rule)
      if (g) { g.count++; if (!g.example && f.excerpt) g.example = f.excerpt }
      else map.set(f.rule, { rule: f.rule, severity: f.severity, count: 1, example: f.excerpt })
    }
    return [...map.values()].sort((a, b) => SEV[a.severity].order - SEV[b.severity].order)
  })()

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
        <button onClick={createSeries} disabled={creating} style={{ display: 'block', width: '100%', marginBottom: 10, padding: '8px 11px', borderRadius: 8, cursor: creating ? 'default' : 'pointer', background: 'transparent', color: GOLD, border: `1px dashed ${GOLD}88`, fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
          {creating ? 'Створюю…' : '+ Нова серія'}
        </button>
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
              {s.coverUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={s.coverUrl} alt="" style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', objectPosition: 'center 22%', borderRadius: 6, marginBottom: 7, display: 'block' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '3 / 2', borderRadius: 6, marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)', fontSize: 11, color: 'rgba(245,240,232,0.4)' }}>без обкладинки</div>
              )}
              {s.episode_number != null ? `${s.episode_number}. ` : ''}{s.title}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                {(() => { const sm = STATUS_META[s.status] ?? { label: s.status, color: '#9aa0a6' }; return <span style={chip(sm.color)}>{sm.label}</span> })()}
                {(s.canonErrors ?? 0) > 0
                  ? <span style={chip('#e0484d')}>⚠ {s.canonErrors}</span>
                  : (s.canonWarns ?? 0) > 0
                    ? <span style={chip('#e0a23d')}>⚠ {s.canonWarns}</span>
                    : <span style={chip('#6fae8a')}>✓ канон</span>}
                {s.hasAudio
                  ? <span style={chip('#7ac4a2')}>♪ аудіо</span>
                  : (s.audioStatus && s.audioStatus !== 'none' && s.audioStatus !== 'pending')
                    ? <span style={chip('#c4a27a')}>♪ {s.audioStatus}</span>
                    : null}
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
            {/* ── Обкладинка серії: показ + завантажити своє фото + AI-редагування ── */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 14, padding: 14, borderRadius: 10, background: NAVY, border: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
              <div style={{ width: 200, flexShrink: 0 }}>
                {coverUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={coverUrl} alt="обкладинка" style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', objectPosition: `center ${coverPos}%`, borderRadius: 8, display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '3 / 2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.18)', fontSize: 12, color: 'rgba(245,240,232,0.45)' }}>без обкладинки</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 8 }}>Обкладинка серії</div>

                {coverUrl && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(245,240,232,0.65)', marginBottom: 4, fontFamily: FONT }}>
                      <span>Посунути фото ↑↓</span>
                      <span>{coverPos}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={coverPos}
                      onChange={(e) => setCoverPos(parseInt(e.target.value, 10))}
                      style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => saveCoverPos(coverPos)}
                        disabled={posBusy}
                        style={{ padding: '6px 12px', borderRadius: 7, background: 'transparent', color: GOLD, border: `1px solid ${GOLD}88`, fontWeight: 700, fontSize: 12, fontFamily: FONT, cursor: posBusy ? 'default' : 'pointer' }}
                      >
                        {posBusy ? 'Зберігаю…' : 'Зберегти позицію'}
                      </button>
                      <span style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', fontFamily: FONT }}>менше = вище, більше = нижче</span>
                    </div>
                  </div>
                )}

                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => { const fl = e.target.files?.[0]; if (fl) uploadOwnCover(fl) }}
                />
                <button
                  onClick={() => coverFileRef.current?.click()}
                  disabled={coverBusy !== ''}
                  style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', color: GOLD, border: `1px solid ${GOLD}88`, fontWeight: 700, fontSize: 13, fontFamily: FONT, cursor: coverBusy ? 'default' : 'pointer', marginRight: 8, marginBottom: 8 }}
                >
                  {coverBusy === 'upload' ? 'Завантаження…' : '⬆ Завантажити своє фото'}
                </button>
                <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)', marginBottom: 10 }}>JPG, PNG або WebP, до 8 МБ. Фото одразу стає обкладинкою цієї серії.</div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    value={coverEdit}
                    onChange={(e) => setCoverEdit(e.target.value)}
                    placeholder="що змінити в обкладинці (англ. краще, напр. add falling snow)"
                    style={{ flex: 1, minWidth: 180, padding: 9, borderRadius: 8, background: NAVY_DEEP, color: INK, border: '1px solid rgba(255,255,255,0.15)', fontFamily: FONT, fontSize: 13 }}
                  />
                  <button
                    onClick={editCoverAI}
                    disabled={coverBusy !== '' || !coverUrl}
                    title={!coverUrl ? 'Спершу має бути обкладинка' : 'AI змінить фото за описом'}
                    style={{ padding: '9px 14px', borderRadius: 8, background: coverUrl ? '#c98a2e' : '#33405e', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, fontFamily: FONT, cursor: (coverBusy || !coverUrl) ? 'default' : 'pointer' }}
                  >
                    {coverBusy === 'ai' ? 'AI редагує…' : '✦ Редагувати через AI'}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', marginTop: 6 }}>AI бере поточну обкладинку й вносить зміну, тримаючи кадр. Для нової з нуля — «Обкладинки Тиша».</div>
              </div>
            </div>

            <div style={{ position: 'relative', height: 520, borderRadius: 10, border: `1px solid ${dirty ? GOLD : 'rgba(255,255,255,0.12)'}`, overflow: 'hidden', background: NAVY_DEEP }}>
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

            {/* ── Послідовність вичитки 1 → 4 ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 6px', flexWrap: 'wrap' }}>
              <button onClick={runCheck} disabled={!text.trim()} style={btn('#7aa2c4', !!text.trim())}>
                1 · Перевірити канон
              </button>
              <button onClick={fixAll} disabled={punctBusy || !text.trim()} style={btn('#c47a9e', !punctBusy && !!text.trim())}>
                {punctBusy ? 'Виправляю…' : '2 · Виправити крапки й типографіку'}
              </button>
              <button onClick={spellcheck} disabled={spellBusy || !text.trim()} style={btn('#5b8fb0', !spellBusy && !!text.trim())}>
                {spellBusy ? 'Перевіряю…' : '3 · Перевірити правопис'}
              </button>
              <button onClick={save} disabled={!dirty || saving} style={btn(GOLD, dirty && !saving)}>
                {saving ? 'Зберігаю…' : dirty ? '4 · Зберегти' : '4 · Збережено'}
              </button>
              {msg && <span style={{ fontSize: 13, color: '#8fc4a6' }}>{msg}</span>}
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'rgba(245,240,232,0.5)' }}>
                {words} слів{words > 0 && words < 1500 ? ' · закоротко' : ''}{words > 2300 ? ' · задовго' : ''}
                {dirty ? ' · не збережено' : ''}
              </span>
            </div>

            {/* ── Окремі інструменти (поза послідовністю) ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.4)', marginRight: 2 }}>Окремо:</span>
              <button onClick={improve} disabled={improving || !text.trim()} style={{ ...btn('#6b6f9e', !improving && !!text.trim()), padding: '7px 13px', fontSize: 13 }}>
                {improving ? 'Олюднюю…' : 'Олюднити (Gemini)'}
              </button>
              <button onClick={genRecap} disabled={!text.trim() || aiBusy !== null} style={{ ...btn('#c4a27a', !!text.trim() && aiBusy === null), padding: '7px 13px', fontSize: 13 }}>
                {aiBusy === 'recap' ? 'Генерую…' : 'Recap'}
              </button>
              <button onClick={cleanTts} disabled={!text.trim() || aiBusy !== null} style={{ ...btn('#7ac4a2', !!text.trim() && aiBusy === null), padding: '7px 13px', fontSize: 13 }}>
                {aiBusy === 'clean' ? 'Чищу…' : 'Чистка для TTS'}
              </button>
            </div>

            {/* ─── Метадані серії ─── */}
            <div style={{ margin: '6px 0 14px', padding: 14, borderRadius: 10, background: NAVY, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 13 }}>Метадані серії</strong>
                <button onClick={saveMeta} disabled={!metaDirty || metaBusy} style={{ ...btn(GOLD, metaDirty && !metaBusy), padding: '6px 13px', fontSize: 12 }}>
                  {metaBusy ? 'Зберігаю…' : metaDirty ? 'Зберегти метадані' : 'Збережено'}
                </button>
                <button onClick={suggestTitles} disabled={titleBusy || !text.trim()} style={{ ...btn('#6b6f9e', !titleBusy && !!text.trim()), padding: '6px 13px', fontSize: 12 }}>
                  {titleBusy ? 'Генерую…' : 'AI-назви'}
                </button>
              </div>

              {titleSugg && (
                <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {titleSugg.length === 0 && <span style={{ fontSize: 12, color: 'rgba(245,240,232,0.5)' }}>Gemini не дав варіантів.</span>}
                  {titleSugg.map((t, i) => (
                    <button key={i} onClick={() => setMetaTitle(t)} style={{ fontSize: 12, color: '#a8acd0', background: 'rgba(107,111,158,0.15)', border: '1px solid #6b6f9e', borderRadius: 16, padding: '4px 11px', cursor: 'pointer', fontFamily: FONT }}>
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
                    scheduled: { t: 'заплановано', c: '#6b6f9e' },
                    published: { t: 'опубліковано', c: '#6fae8a' },
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
                <button onClick={() => doPublish('schedule')} disabled={pubBusy || !scheduleInput} style={btn('#6b6f9e', !pubBusy && !!scheduleInput)}>
                  Запланувати
                </button>
                <button onClick={() => doPublish('publish')} disabled={pubBusy} style={btn('#4f9e74', !pubBusy)}>
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

            {/* Небезпечна зона — видалення */}
            <div style={{ margin: '6px 0 14px', padding: 12, borderRadius: 10, border: '1px solid rgba(224,72,77,0.4)', background: 'rgba(224,72,77,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.6)' }}>Видалення незворотне.</span>
              <button onClick={deleteSeries} disabled={deleting} style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 8, cursor: deleting ? 'default' : 'pointer', background: 'transparent', color: '#e0484d', border: '1px solid #e0484d', fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
                {deleting ? 'Видаляю…' : 'Видалити серію'}
              </button>
            </div>

            {/* Точкові пропозиції олюднення */}
            {suggestions !== null && (() => {
              const total = suggestions.length
              const acceptedCount = suggestions.filter((s) => s.accepted).length
              const setAll = (val: boolean) => setSuggestions((cur) => cur!.map((s) => ({ ...s, accepted: val })))
              const toggle = (idx: number) => setSuggestions((cur) => cur!.map((s, i) => (i === idx ? { ...s, accepted: !s.accepted } : s)))

              // Діапазони правок у ПОТОЧНОМУ тексті — щоб показати їх у контексті.
              const esc = (s: string) => s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
              const rangesRaw: Array<{ start: number; end: number; idx: number }> = []
              for (let i = 0; i < suggestions.length; i++) {
                let m: RegExpMatchArray | null = null
                try { m = text.match(new RegExp(esc(suggestions[i].before))) } catch { m = null }
                if (m && m.index != null) rangesRaw.push({ start: m.index, end: m.index + m[0].length, idx: i })
              }
              rangesRaw.sort((a, b) => a.start - b.start)
              const ranges: Array<{ start: number; end: number; idx: number }> = []
              let lastEnd = -1
              for (const r of rangesRaw) { if (r.start >= lastEnd) { ranges.push(r); lastEnd = r.end } }
              const missing = suggestions.length - ranges.length
              const previewNodes: ReactNode[] = []
              let cur = 0
              ranges.forEach((r, n) => {
                if (r.start > cur) previewNodes.push(<span key={`t${n}`}>{text.slice(cur, r.start)}</span>)
                const s = suggestions[r.idx]
                previewNodes.push(
                  <span
                    key={`c${n}`}
                    onClick={() => toggle(r.idx)}
                    title={s.reason ? `${s.reason} · клік — прийняти/відхилити` : 'клік — прийняти/відхилити'}
                    style={s.accepted
                      ? { background: 'rgba(79,158,116,0.32)', borderBottom: '2px solid #4f9e74', cursor: 'pointer', borderRadius: 3, padding: '0 1px' }
                      : { background: 'rgba(168,90,90,0.14)', textDecoration: 'line-through', textDecorationColor: '#a85a5a', color: '#c8a0a0', cursor: 'pointer', borderRadius: 3, padding: '0 1px' }}
                  >
                    {s.accepted ? s.after : text.slice(r.start, r.end)}
                  </span>
                )
                cur = r.end
              })
              if (cur < text.length) previewNodes.push(<span key="tail">{text.slice(cur)}</span>)

              const apply = () => {
                const acc = suggestions.filter((s) => s.accepted)
                const res = applySuggestions(text, acc)
                setText(res.text)
                setFindings(checkTysha(res.text))
                setSuggestions(null)
                setMsg(res.skipped > 0
                  ? `Застосовано ${res.applied}, пропущено ${res.skipped} (фрагмент уже змінився). Не забудь зберегти.`
                  : `Застосовано ${res.applied}. Не забудь зберегти.`)
              }
              return (
                <div style={{ margin: '14px 0', padding: 14, borderRadius: 10, background: 'rgba(107,111,158,0.10)', border: '1px solid #6b6f9e' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13, color: '#a8acd0' }}>Пропозиції: {total}, прийнято {acceptedCount}</strong>
                    <button onClick={() => setAll(true)} style={{ ...btn('#4f9e74', true), padding: '5px 11px', fontSize: 12 }}>Прийняти всі</button>
                    <button onClick={() => setAll(false)} style={{ padding: '5px 11px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 12, fontFamily: FONT }}>Зняти всі</button>
                    <button onClick={apply} disabled={acceptedCount === 0} style={{ ...btn('#6b6f9e', acceptedCount > 0), padding: '5px 11px', fontSize: 12 }}>Застосувати ({acceptedCount})</button>
                    <button onClick={() => setSuggestions(null)} style={{ padding: '5px 11px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontFamily: FONT }}>Скасувати</button>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.55)', marginBottom: 8, fontFamily: FONT }}>
                    <span style={{ background: 'rgba(79,158,116,0.32)', borderBottom: '2px solid #4f9e74', borderRadius: 3, padding: '0 4px' }}>зелене</span> — буде поставлено · <span style={{ textDecoration: 'line-through', color: '#c8a0a0' }}>закреслене</span> — відхилено · клік по слову перемикає
                  </div>
                  <div style={{ maxHeight: 460, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14, lineHeight: 1.75, fontFamily: "'Georgia', serif", color: INK, background: NAVY_DEEP, borderRadius: 8, padding: 14 }}>
                    {previewNodes}
                  </div>
                  {missing > 0 && (
                    <div style={{ fontSize: 11.5, color: '#c89090', marginTop: 6, fontFamily: FONT }}>
                      Не знайдено в тексті: {missing} (фрагмент уже змінено — перевір вручну).
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Чистка для TTS: переглянь і застосуй */}
            {cleaned !== null && (
              <div style={{ margin: '14px 0', padding: 14, borderRadius: 10, background: 'rgba(122,196,162,0.08)', border: '1px solid #7ac4a2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 13, color: '#9cd6bd' }}>Текст, підготовлений для озвучки</strong>
                  <span style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.5)' }}>переглянь — «Застосувати» замінить текст у редакторі (збереження окремо)</span>
                  <button onClick={() => { setText(cleaned); setCleaned(null); setMsg('Текст замінено TTS-версією — перевір і збережи') }} style={{ ...btn('#7ac4a2', true), padding: '5px 12px', fontSize: 12, marginLeft: 'auto' }}>Застосувати в редактор</button>
                  <button onClick={() => setCleaned(null)} style={{ padding: '5px 11px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontFamily: FONT }}>Скасувати</button>
                </div>
                <textarea value={cleaned} onChange={(e) => setCleaned(e.target.value)} rows={8} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.25)', color: '#f5f0e8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 14, lineHeight: 1.6, fontFamily: "'Georgia', serif", resize: 'vertical' }} />
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
              <div style={{ padding: 14, borderRadius: 10, background: 'rgba(45,143,78,0.12)', border: '1px solid #2d8f4e', color: '#8fc4a6', fontSize: 14 }}>
                Чисто — механічних зауважень немає. Усе одно перечитай оком: прихований передвісник і магію в підтексті функція не ловить.
              </div>
            )}

            {grouped.length > 0 && (
              <div style={{ margin: '10px 0' }}>
                <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.6)', marginBottom: 8, fontFamily: FONT }}>
                  Підсвічено в тексті вище (галочка «Підсвічувати порушення»). Прав прямо в редакторі. Зведення:
                </div>
                {grouped.map((g) => (
                  <div key={g.rule} style={{ margin: '7px 0', padding: '10px 12px', borderRadius: 10, background: SEV[g.severity].bg, borderLeft: `3px solid ${SEV[g.severity].color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: SEV[g.severity].color }}>{SEV[g.severity].label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{g.rule}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: SEV[g.severity].color }}>{g.count}</span>
                    </div>
                    {g.example && (
                      <div style={{ marginTop: 5, fontSize: 12, color: 'rgba(245,240,232,0.6)', fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                        напр.: «{g.example}»
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
