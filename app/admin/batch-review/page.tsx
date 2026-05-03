'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'
const STORAGE_KEY = 'balabony-batch-v2'

// ── Types ────────────────────────────────────────────────────────────────────

interface QCIssues { technical: string[]; stylistics: string[]; plot: string[] }
interface QCResult { verdict: 'quality' | 'remarks' | 'poor'; issues: QCIssues; summary: string }

interface SeriesEntry {
  id: string
  filename: string
  text: string
  file?: File
  status: 'pending' | 'reviewing' | 'done' | 'error'
  qcResult?: QCResult
  crossIssues?: string[]
  markedForDeletion: boolean
  error?: string
  editorialStatus?: 'submitted' | 'error'
  submissionId?: number
}

// ── API response shapes ──────────────────────────────────────────────────────

interface QCResponse {
  verdict?: 'quality' | 'remarks' | 'poor'
  issues?: { technical?: string[]; stylistics?: string[]; plot?: string[] }
  summary?: string
  error?: string
}

interface CrossReviewResponse {
  episodeCrossIssues?: Array<{ filename: string; issues: string[] }>
  error?: string
}

interface ParseDocxResponse {
  text?: string
  filename?: string
  error?: string
}

// ── localStorage helpers ─────────────────────────────────────────────────────

function persist(entries: SeriesEntry[]) {
  try {
    const data = entries.map(({ file: _f, ...rest }) => rest)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function restore(): Omit<SeriesEntry, 'file'>[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as Omit<SeriesEntry, 'file'>[]).map(e => ({
      ...e,
      status: e.status === 'reviewing' ? 'pending' : e.status,
    }))
  } catch { return [] }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) }

function wordCount(text: string) { return text.trim().split(/\s+/).filter(Boolean).length }

function verdictColor(verdict: 'quality' | 'remarks' | 'poor') {
  if (verdict === 'quality') return '#4ade80'
  if (verdict === 'remarks') return '#fbbf24'
  return '#f87171'
}

function verdictIcon(verdict: 'quality' | 'remarks' | 'poor') {
  if (verdict === 'quality') return '✅'
  if (verdict === 'remarks') return '⚠️'
  return '❌'
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function BatchReviewPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [entries,     setEntries]     = useState<SeriesEntry[]>([])
  const [hydrated,    setHydrated]    = useState(false)
  const [dragOver,    setDragOver]    = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [processing,  setProcessing]  = useState(false)
  const [progress,    setProgress]    = useState({ current: 0, total: 0 })
  const [crossLoading, setCrossLoading] = useState(false)
  const [zipLoading,  setZipLoading]  = useState(false)
  const [season,      setSeason]      = useState(1)
  const [pasteText,   setPasteText]   = useState('')
  const [recheckingIds, setRecheckingIds] = useState<Set<string>>(new Set())
  const [replacingId,  setReplacingId]  = useState<string | null>(null)
  const [submittingEditorial, setSubmittingEditorial] = useState(false)

  const entriesRef     = useRef<SeriesEntry[]>([])
  const replaceRef     = useRef<HTMLInputElement>(null)
  const processingRef  = useRef(false)
  const crossLoadingRef = useRef(false)
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep ref in sync
  useEffect(() => { entriesRef.current = entries }, [entries])

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return
    persist(entries)
  }, [entries, hydrated])

  // Hydrate from localStorage on mount
  useEffect(() => {
    setEntries(restore() as SeriesEntry[])
    setHydrated(true)
  }, [])

  // After hydration: if pending entries, schedule analysis
  useEffect(() => {
    if (!hydrated) return
    const hasPending = entriesRef.current.some(e => e.status === 'pending')
    if (hasPending) scheduleAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  // ── Analysis ────────────────────────────────────────────────────────────────

  function scheduleAnalysis() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (processingRef.current) return
      const pending = entriesRef.current.filter(e => e.status === 'pending')
      if (pending.length) runAnalysis(pending)
    }, 1200)
  }

  async function runAnalysis(pending: SeriesEntry[]) {
    const alreadyDone = entriesRef.current.filter(e => e.status === 'done' && e.qcResult)
    processingRef.current = true
    setProcessing(true)
    setProgress({ current: 0, total: pending.length })

    const newlyDone: SeriesEntry[] = []

    for (let i = 0; i < pending.length; i++) {
      const entry = pending[i]
      setProgress({ current: i + 1, total: pending.length })
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'reviewing' } : e))

      try {
        const res = await fetch('/api/admin/quality-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: entry.text }),
        })
        const data = await res.json() as QCResponse
        if (!res.ok || data.error) {
          setEntries(prev => prev.map(e =>
            e.id === entry.id ? { ...e, status: 'error', error: data.error ?? 'Помилка перевірки' } : e
          ))
        } else {
          const qcResult: QCResult = {
            verdict: data.verdict ?? 'poor',
            issues: {
              technical:  data.issues?.technical  ?? [],
              stylistics: data.issues?.stylistics ?? [],
              plot:       data.issues?.plot       ?? [],
            },
            summary: data.summary ?? '',
          }
          const doneEntry: SeriesEntry = {
            ...entry,
            status: 'done',
            qcResult,
            markedForDeletion: qcResult.verdict === 'poor',
          }
          newlyDone.push(doneEntry)
          setEntries(prev => prev.map(e => e.id === entry.id ? doneEntry : e))
        }
      } catch {
        setEntries(prev => prev.map(e =>
          e.id === entry.id ? { ...e, status: 'error', error: "Помилка з'єднання" } : e
        ))
      }
    }

    processingRef.current = false
    setProcessing(false)

    const allDone = [...alreadyDone, ...newlyDone]
    if (allDone.length >= 2) {
      runCrossReview(allDone)
    }
  }

  async function runCrossReview(doneEntries: SeriesEntry[]) {
    if (crossLoadingRef.current) return
    crossLoadingRef.current = true
    setCrossLoading(true)

    try {
      const res = await fetch('/api/admin/cross-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          series: doneEntries.map(e => ({
            filename: e.filename,
            textSnippet: e.text.slice(0, 800),
          })),
        }),
      })
      const data = await res.json() as CrossReviewResponse
      const crossIssuesMap = new Map<string, string[]>()
      for (const item of data.episodeCrossIssues ?? []) {
        crossIssuesMap.set(item.filename, item.issues)
      }
      setEntries(prev => prev.map(e => ({
        ...e,
        crossIssues: crossIssuesMap.has(e.filename) ? crossIssuesMap.get(e.filename) : e.crossIssues,
      })))
    } catch {
      // swallow — don't fail
    } finally {
      crossLoadingRef.current = false
      setCrossLoading(false)
    }
  }

  // ── File handling ──────────────────────────────────────────────────────────

  const uploadDocx = useCallback(async (files: FileList | File[]) => {
    const docxFiles = Array.from(files).filter(f => f.name.endsWith('.docx'))
    if (!docxFiles.length) return
    setUploading(true)
    for (const file of docxFiles) {
      // Deduplicate by filename
      if (entriesRef.current.some(e => e.filename === file.name)) continue
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/admin/parse-docx', { method: 'POST', body: fd })
        const data = await res.json() as ParseDocxResponse
        if (data.text) {
          const newEntry: SeriesEntry = {
            id: uid(),
            filename: data.filename ?? file.name,
            text: data.text,
            file,
            status: 'pending',
            markedForDeletion: false,
          }
          setEntries(prev => {
            if (prev.some(e => e.filename === newEntry.filename)) return prev
            return [...prev, newEntry]
          })
        }
      } catch { /* skip failed file */ }
    }
    setUploading(false)
    scheduleAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    uploadDocx(e.dataTransfer.files)
  }, [uploadDocx])

  // ── Paste text split ───────────────────────────────────────────────────────

  const addFromText = () => {
    const parts = pasteText.split(/\n---+\n|\n===+\n/).map(s => s.trim()).filter(Boolean)
    if (!parts.length) return
    const currentEntries = entriesRef.current
    const newEntries: SeriesEntry[] = parts
      .map((t, i): SeriesEntry | null => {
        const name = `Серія ${currentEntries.length + i + 1}`
        if (currentEntries.some(e => e.filename === name)) return null
        return {
          id: uid(),
          filename: name,
          text: t,
          status: 'pending' as const,
          markedForDeletion: false,
        }
      })
      .filter((e): e is SeriesEntry => e !== null)
    if (!newEntries.length) return
    setEntries(prev => [...prev, ...newEntries])
    setPasteText('')
    scheduleAnalysis()
  }

  // ── Per-card actions ──────────────────────────────────────────────────────

  function downloadEntry(entry: SeriesEntry) {
    if (entry.file) {
      const url = URL.createObjectURL(entry.file)
      const a = document.createElement('a')
      a.href = url; a.download = entry.filename
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    } else {
      const blob = new Blob([entry.text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = entry.filename.replace(/\.docx$/i, '') + '.txt'
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    }
  }

  async function onReplaceFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !replacingId) { setReplacingId(null); return }
    const id = replacingId
    setReplacingId(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/parse-docx', { method: 'POST', body: fd })
      const data = await res.json() as ParseDocxResponse
      if (data.text) {
        setEntries(prev => prev.map(e => e.id === id ? {
          ...e, text: data.text!, file,
          status: 'pending' as const, qcResult: undefined,
          crossIssues: undefined, markedForDeletion: false, error: undefined,
        } : e))
        scheduleAnalysis()
      }
    } catch { /* skip */ }
  }

  async function recheckEntry(id: string) {
    const entry = entriesRef.current.find(e => e.id === id)
    if (!entry) return
    setRecheckingIds(prev => new Set([...prev, id]))
    try {
      const res = await fetch('/api/admin/quality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entry.text }),
      })
      const data = await res.json() as QCResponse
      if (!res.ok || data.error) {
        setEntries(prev => prev.map(e =>
          e.id === id ? { ...e, status: 'error', error: data.error ?? 'Помилка перевірки' } : e
        ))
      } else {
        const qcResult: QCResult = {
          verdict: data.verdict ?? 'poor',
          issues: {
            technical:  data.issues?.technical  ?? [],
            stylistics: data.issues?.stylistics ?? [],
            plot:       data.issues?.plot       ?? [],
          },
          summary: data.summary ?? '',
        }
        setEntries(prev => prev.map(e => e.id === id ? {
          ...e, status: 'done', qcResult,
          markedForDeletion: qcResult.verdict === 'poor', error: undefined,
        } : e))
      }
    } catch {
      setEntries(prev => prev.map(e =>
        e.id === id ? { ...e, status: 'error', error: "Помилка з'єднання" } : e
      ))
    } finally {
      setRecheckingIds(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  // ── Editorial submission ───────────────────────────────────────────────────

  async function submitToEditorial(entryId: string) {
    const entry = entriesRef.current.find(e => e.id === entryId)
    if (!entry) return
    setSubmittingEditorial(true)
    try {
      const res = await fetch('/api/admin/editorial/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: [{ filename: entry.filename, text: entry.text }] }),
      })
      const data = await res.json() as { submitted?: number; editorCount?: number; error?: string }
      if (!res.ok || data.error) {
        alert(data.error ?? 'Помилка надсилання редакторам')
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, editorialStatus: 'error' } : e))
      } else {
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, editorialStatus: 'submitted' } : e))
      }
    } catch {
      alert("Помилка з'єднання")
    } finally {
      setSubmittingEditorial(false)
    }
  }

  // ── ZIP download ───────────────────────────────────────────────────────────

  const downloadZip = async () => {
    const toKeep = entries.filter(e => e.status === 'done' && !e.markedForDeletion)
    if (!toKeep.length) return
    setZipLoading(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (let i = 0; i < toKeep.length; i++) {
        const entry = toKeep[i]
        const num = String(i + 1).padStart(2, '0')
        const safeName = entry.filename.replace(/[/\\:*?"<>|]/g, '_').replace(/\.docx$/i, '')
        const prefix = `С${season}-Серія-${num}`
        if (entry.file) {
          zip.file(`${prefix}_${safeName}.docx`, await entry.file.arrayBuffer())
        } else {
          zip.file(`${prefix}_${safeName}.txt`, entry.text)
        }
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Балабони_С${season}_впорядковані.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setZipLoading(false)
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const doneEntries   = entries.filter(e => e.status === 'done' && e.qcResult)
  const doneCount     = doneEntries.length
  const qualityCount  = doneEntries.filter(e => e.qcResult!.verdict === 'quality').length
  const remarksCount  = doneEntries.filter(e => e.qcResult!.verdict === 'remarks').length
  const poorCount     = doneEntries.filter(e => e.qcResult!.verdict === 'poor').length
  const deletedCount  = entries.filter(e => e.markedForDeletion).length
  const keepCount     = entries.filter(e => e.status === 'done' && !e.markedForDeletion).length

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!hydrated) return null

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="3" width="16" height="14" rx="2" stroke={NAVY_DEEP} strokeWidth="1.6"/>
              <path d="M5 7h10M5 10h7M5 13h5" stroke={NAVY_DEEP} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 2, fontFamily: FONT }}>Адмін панель</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>Пакетна перевірка серій</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/admin/review')} style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}>✍️ Редактор</button>
            <button onClick={() => router.push('/admin/editorial')} style={{ fontSize: 12, fontWeight: 600, color: '#c8d4e8', background: 'rgba(200,212,232,0.07)', border: '1px solid rgba(200,212,232,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}>📋 Редакція</button>
            <button onClick={() => router.push('/admin/stories')} style={{ fontSize: 12, fontWeight: 600, color: GOLD, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}>← Редактор серій</button>
            <button onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login') }} style={{ fontSize: 12, fontWeight: 600, color: '#8899bb', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}>Вийти</button>
          </div>
        </div>

        {/* Upload section */}
        <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', border: '0.5px solid rgba(255,255,255,0.07)', marginBottom: 16 }}>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 12, padding: '28px 20px', textAlign: 'center',
              cursor: 'pointer', background: dragOver ? 'rgba(240,165,0,0.06)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s', marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f0e8', marginBottom: 4, fontFamily: FONT }}>
              {uploading ? 'Завантажую...' : 'Перетягніть .docx файли сюди або клікніть'}
            </div>
            <div style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>Підтримуються файли .docx · можна кілька одночасно</div>
            <input
              ref={fileRef} type="file" accept=".docx" multiple style={{ display: 'none' }}
              onChange={e => { if (e.target.files) uploadDocx(e.target.files); e.target.value = '' }}
            />
            <input
              ref={replaceRef} type="file" accept=".docx" style={{ display: 'none' }}
              onChange={onReplaceFileChange}
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>або вставте текст</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Paste textarea */}
          <textarea
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 13px', color: '#f5f0e8', fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box', height: 130, resize: 'vertical', lineHeight: 1.7 }}
            placeholder={'Вставте кілька серій, розділяючи їх рядком:\n---\nМіж кожною серією'}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          <button
            onClick={addFromText}
            disabled={!pasteText.trim()}
            style={{
              marginTop: 10, display: 'flex', alignItems: 'center', gap: 7,
              background: pasteText.trim() ? GOLD : 'rgba(255,255,255,0.05)',
              color: pasteText.trim() ? NAVY_DEEP : '#445566',
              border: 'none', borderRadius: 10, padding: '10px 18px',
              fontSize: 13, fontWeight: 700, fontFamily: FONT,
              cursor: pasteText.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Додати серії з тексту
          </button>
        </div>

        {/* Episode list */}
        {entries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>

            {/* List header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>
                Серій у черзі: {entries.length}
              </span>
              <button
                onClick={() => {
                  setEntries([])
                  localStorage.removeItem(STORAGE_KEY)
                }}
                style={{ fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
              >
                Очистити все
              </button>
            </div>

            {/* Progress bar */}
            {processing && (
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: GOLD,
                  borderRadius: 2,
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            )}

            {/* Cross-review indicator */}
            {crossLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(240,165,0,0.07)', borderRadius: 10, border: '1px solid rgba(240,165,0,0.2)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="6" stroke={GOLD} strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 12, color: GOLD, fontFamily: FONT }}>Крос-аналіз серій (AI)…</span>
              </div>
            )}

            {/* Entry cards */}
            {entries.map((entry, idx) => {
              if (entry.status === 'pending' || entry.status === 'reviewing') {
                const isReviewing = entry.status === 'reviewing'
                return (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    {isReviewing ? (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="6" stroke={GOLD} strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <span style={{ fontSize: 13, flexShrink: 0 }}>⏳</span>
                    )}
                    <span style={{ flex: 1, fontSize: 13, color: isReviewing ? GOLD : '#c8d4e8', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {idx + 1}. {entry.filename}
                    </span>
                    <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT, flexShrink: 0 }}>{wordCount(entry.text)} сл.</span>
                    {!isReviewing && (
                      <button onClick={() => setEntries(prev => prev.filter(x => x.id !== entry.id))} style={{ background: 'none', border: 'none', color: '#445566', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                    )}
                  </div>
                )
              }

              if (entry.status === 'error') {
                return (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', borderRadius: 10,
                    background: 'rgba(248,113,113,0.07)',
                    border: '1px solid rgba(248,113,113,0.2)',
                  }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>❌</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#f87171', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {idx + 1}. {entry.filename} — {entry.error}
                    </span>
                    <button
                      onClick={() => {
                        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'pending', error: undefined } : e))
                        scheduleAnalysis()
                      }}
                      style={{ fontSize: 11, color: GOLD, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}
                    >
                      Retry
                    </button>
                    <button onClick={() => setEntries(prev => prev.filter(x => x.id !== entry.id))} style={{ background: 'none', border: 'none', color: '#445566', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                  </div>
                )
              }

              // done
              if (!entry.qcResult) return null
              const qc = entry.qcResult
              const vColor = verdictColor(qc.verdict)
              const hasIssues = qc.issues.technical.length > 0 || qc.issues.stylistics.length > 0 || qc.issues.plot.length > 0
              const hasCrossIssues = (entry.crossIssues?.length ?? 0) > 0

              return (
                <div key={entry.id} style={{
                  borderRadius: 12,
                  background: '#081420',
                  border: `1px solid ${vColor}44`,
                  overflow: 'hidden',
                }}>
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: hasIssues || hasCrossIssues ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{verdictIcon(qc.verdict)}</span>
                    {recheckingIds.has(entry.id) && (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="6" stroke={GOLD} strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                      </svg>
                    )}
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#f5f0e8', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {idx + 1}. {entry.filename}
                    </span>
                    <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT, flexShrink: 0 }}>{wordCount(entry.text)} сл.</span>
                    <button onClick={() => setEntries(prev => prev.filter(x => x.id !== entry.id))} style={{ background: 'none', border: 'none', color: '#445566', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                  </div>

                  {/* Summary */}
                  <div style={{ padding: '8px 14px', fontSize: 12, color: '#c8d4e8', lineHeight: 1.6, fontFamily: FONT }}>
                    {qc.summary}
                  </div>

                  {/* Issues */}
                  {hasIssues && (
                    <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {qc.issues.technical.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 3 }}>Технічне</div>
                          {qc.issues.technical.map((issue, ii) => (
                            <div key={ii} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}>
                              <span style={{ color: '#f87171', fontWeight: 700, flexShrink: 0 }}>·</span>{issue}
                            </div>
                          ))}
                        </div>
                      )}
                      {qc.issues.stylistics.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 3 }}>Стилістика</div>
                          {qc.issues.stylistics.map((issue, ii) => (
                            <div key={ii} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}>
                              <span style={{ color: '#fbbf24', fontWeight: 700, flexShrink: 0 }}>·</span>{issue}
                            </div>
                          ))}
                        </div>
                      )}
                      {qc.issues.plot.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 3 }}>Сюжет і персонажі</div>
                          {qc.issues.plot.map((issue, ii) => (
                            <div key={ii} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}>
                              <span style={{ color: '#818cf8', fontWeight: 700, flexShrink: 0 }}>·</span>{issue}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cross issues */}
                  {hasCrossIssues && (
                    <div style={{ padding: '0 14px 10px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#fb923c', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 3 }}>Крос-серійні:</div>
                      {entry.crossIssues!.map((issue, ii) => (
                        <div key={ii} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}>
                          <span style={{ color: '#fb923c', fontWeight: 700, flexShrink: 0 }}>·</span>{issue}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Card footer: file actions + deletion toggle */}
                  <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>

                    {/* Download */}
                    <button
                      onClick={() => downloadEntry(entry)}
                      title={entry.file ? 'Завантажити оригінал .docx' : 'Завантажити як .txt'}
                      style={{ fontSize: 11, fontWeight: 600, color: '#8899bb', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                    >
                      ⬇ Завантажити файл
                    </button>

                    {/* Replace */}
                    <button
                      onClick={() => { setReplacingId(entry.id); replaceRef.current?.click() }}
                      title="Завантажити виправлену версію"
                      style={{ fontSize: 11, fontWeight: 600, color: '#8899bb', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                    >
                      ↑ Замінити файл
                    </button>

                    {/* Recheck */}
                    <button
                      onClick={() => recheckEntry(entry.id)}
                      disabled={recheckingIds.has(entry.id)}
                      title="Повторний AI-аналіз цього файлу"
                      style={{ fontSize: 11, fontWeight: 600, color: recheckingIds.has(entry.id) ? '#445566' : '#818cf8', background: recheckingIds.has(entry.id) ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.1)', border: `1px solid ${recheckingIds.has(entry.id) ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.25)'}`, borderRadius: 6, padding: '4px 10px', cursor: recheckingIds.has(entry.id) ? 'wait' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                    >
                      {recheckingIds.has(entry.id) ? '⏳ Перевіряю…' : '↺ Перевірити знову'}
                    </button>

                    {/* Editorial submit */}
                    {!entry.markedForDeletion && (qc.verdict === 'quality' || qc.verdict === 'remarks') && (
                      entry.editorialStatus === 'submitted' ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 6, padding: '4px 10px', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                          🔄 На перевірці у редактора
                        </span>
                      ) : (
                        <button
                          onClick={() => submitToEditorial(entry.id)}
                          disabled={submittingEditorial}
                          title="Надіслати на редакційне погодження"
                          style={{ fontSize: 11, fontWeight: 600, color: '#c8d4e8', background: 'rgba(200,212,232,0.08)', border: '1px solid rgba(200,212,232,0.2)', borderRadius: 6, padding: '4px 10px', cursor: submittingEditorial ? 'wait' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                        >
                          📨 Надіслати редакторам
                        </button>
                      )
                    )}

                    <div style={{ flex: 1 }} />

                    {/* Deletion toggle */}
                    {qc.verdict === 'poor' && (
                      entry.markedForDeletion ? (
                        <button
                          onClick={() => setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, markedForDeletion: false } : e))}
                          style={{ fontSize: 11, fontWeight: 600, color: '#f87171', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                        >
                          ❌ Буде видалена → Залишити
                        </button>
                      ) : (
                        <button
                          onClick={() => setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, markedForDeletion: true } : e))}
                          style={{ fontSize: 11, fontWeight: 600, color: '#8899bb', background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                        >
                          Залишити → Позначити для видалення
                        </button>
                      )
                    )}
                    {qc.verdict === 'remarks' && (
                      <button
                        onClick={() => setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, markedForDeletion: !e.markedForDeletion } : e))}
                        style={{ fontSize: 11, fontWeight: 600, color: entry.markedForDeletion ? '#f87171' : '#8899bb', background: entry.markedForDeletion ? 'rgba(248,113,113,0.1)' : 'none', border: `1px solid ${entry.markedForDeletion ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                      >
                        {entry.markedForDeletion ? '❌ Позначено → Скасувати' : 'Позначити для видалення'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats + actions bar */}
        {doneCount > 0 && (
          <div style={{ background: NAVY, borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.07)', padding: '16px 18px' }}>

            {/* Stats row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#4ade80', fontFamily: FONT }}>✅ {qualityCount} якісних</span>
              <span style={{ fontSize: 13, color: '#fbbf24', fontFamily: FONT }}>⚠️ {remarksCount} зауважень</span>
              <span style={{ fontSize: 13, color: '#f87171', fontFamily: FONT }}>❌ {poorCount} неякісних</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 13, color: '#8899bb', fontFamily: FONT }}>Буде видалено: {deletedCount}</span>
            </div>

            {/* Naming preview */}
            <div style={{ fontSize: 11, color: '#445566', fontFamily: FONT, marginBottom: 10 }}>
              Назва: С{season}-Серія-01, С{season}-Серія-02…
            </div>

            {/* Season + download row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6 }}>
                Сезон:
                <input
                  type="number" min={1} max={99} value={season}
                  onChange={e => setSeason(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                  style={{
                    width: 52, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 7, color: '#f5f0e8', fontSize: 13, fontFamily: FONT,
                    padding: '4px 8px', outline: 'none', textAlign: 'center',
                  }}
                />
              </label>
              <button
                onClick={downloadZip}
                disabled={zipLoading || keepCount === 0}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: zipLoading || keepCount === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(240,165,0,0.15)',
                  color: zipLoading || keepCount === 0 ? '#445566' : GOLD,
                  border: `1px solid ${zipLoading || keepCount === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(240,165,0,0.35)'}`,
                  borderRadius: 10, padding: '11px 18px',
                  fontSize: 13, fontWeight: 700, fontFamily: FONT,
                  cursor: zipLoading || keepCount === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {zipLoading ? '⏳ Пакую…' : `⬇️ Підтвердити та скачати ZIP (${keepCount} серій)`}
              </button>
            </div>

            {/* Note about txt fallback */}
            <div style={{ fontSize: 10, color: '#334455', fontFamily: FONT, marginTop: 8 }}>
              * Після завантаження ZIP — файли без &apos;file&apos; будуть збережені як .txt
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
