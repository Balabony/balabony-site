'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

// ── Types ────────────────────────────────────────────────────────────────────

interface ReviewScore { key: string; label: string; score: number; comment: string }
interface ReviewReport {
  overall: number
  scores: ReviewScore[]
  problems: string[]
  recommendations: string[]
}
interface SeriesEntry {
  id: string
  filename: string
  text: string
  file?: File
  status: 'pending' | 'reviewing' | 'done' | 'error'
  report?: ReviewReport
  error?: string
}

interface FinalReport {
  overallQuality:    { score: number; comment: string }
  styleCompliance:   { compliant: number; nonCompliant: number; comment: string }
  charactersBible:   { score: number; comment: string }
  chronologyLogic:   { valid: boolean; issues: string[]; comment: string }
  plotUniqueness:    { uniqueCount: number; duplicates: number; comment: string }
  ttsReadiness:      { clean: number; needsCleaning: number; series: string[]; comment: string }
  needsRework:       Array<{ filename: string; reasons: string[] }>
  verdict:           'ready' | 'needs_rework'
  verdictText:       string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) }

function scoreColor(s: number) {
  if (s >= 8) return '#4ade80'
  if (s >= 5) return GOLD
  return '#f87171'
}

function ScoreCell({ s }: { s: number }) {
  return (
    <td style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700, fontSize: 14, color: scoreColor(s), fontFamily: FONT }}>
      {s}
    </td>
  )
}

const SCORE_KEYS = ['grammar', 'style', 'characters', 'emotion', 'uniqueness']
const SCORE_SHORT: Record<string, string> = {
  grammar: 'Грам', style: 'Стиль', characters: 'Хар-ри', emotion: 'Емоц', uniqueness: 'Унік',
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function BatchReviewPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [entries,    setEntries]    = useState<SeriesEntry[]>([])
  const [dragOver,   setDragOver]   = useState(false)
  const [pasteText,  setPasteText]  = useState('')
  const [processing, setProcessing] = useState(false)
  const [progress,   setProgress]   = useState({ current: 0, total: 0 })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [copied,        setCopied]        = useState(false)
  const [zipLoading,    setZipLoading]    = useState(false)
  const [finalReport,   setFinalReport]   = useState<FinalReport | null>(null)
  const [finalLoading,  setFinalLoading]  = useState(false)
  const [finalError,    setFinalError]    = useState('')

  // ── File handling ──────────────────────────────────────────────────────────

  const uploadDocx = useCallback(async (files: FileList | File[]) => {
    const docxFiles = Array.from(files).filter(f => f.name.endsWith('.docx'))
    if (!docxFiles.length) return
    setUploading(true)
    for (const file of docxFiles) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/admin/parse-docx', { method: 'POST', body: fd })
        const data = await res.json() as { text?: string; filename?: string; error?: string }
        if (data.text) {
          setEntries(prev => [...prev, { id: uid(), filename: data.filename ?? file.name, text: data.text!, file, status: 'pending' }])
        }
      } catch { /* skip failed file */ }
    }
    setUploading(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    uploadDocx(e.dataTransfer.files)
  }, [uploadDocx])

  // ── Paste text split ───────────────────────────────────────────────────────

  const addFromText = () => {
    const parts = pasteText.split(/\n---+\n|\n===+\n/).map(s => s.trim()).filter(Boolean)
    if (!parts.length) return
    const newEntries: SeriesEntry[] = parts.map((t, i) => ({
      id: uid(),
      filename: `Серія ${entries.length + i + 1}`,
      text: t,
      status: 'pending',
    }))
    setEntries(prev => [...prev, ...newEntries])
    setPasteText('')
  }

  // ── Final review ───────────────────────────────────────────────────────────

  const runFinalReview = async (doneEntries: SeriesEntry[]) => {
    setFinalLoading(true); setFinalError(''); setFinalReport(null)
    try {
      const payload = doneEntries.map(e => ({
        filename: e.filename,
        textSnippet: e.text.slice(0, 400),
        report: e.report,
      }))
      const res = await fetch('/api/admin/final-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series: payload }),
      })
      const data = await res.json() as FinalReport & { error?: string }
      if (!res.ok || data.error) { setFinalError(data.error ?? 'Помилка фінальної перевірки'); return }
      setFinalReport(data)
    } catch {
      setFinalError("Помилка з'єднання з API")
    } finally {
      setFinalLoading(false)
    }
  }

  // ── Batch review ───────────────────────────────────────────────────────────

  const runBatch = async () => {
    const alreadyDone = entries.filter(e => e.status === 'done' && e.report)
    const pending = entries.filter(e => e.status === 'pending' || e.status === 'error')
    if (!pending.length) return
    setProcessing(true)
    setFinalReport(null)
    setProgress({ current: 0, total: pending.length })

    const newlyDone: SeriesEntry[] = []

    for (let i = 0; i < pending.length; i++) {
      const entry = pending[i]
      setProgress({ current: i + 1, total: pending.length })
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'reviewing' } : e))

      try {
        const res = await fetch('/api/admin/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: entry.text }),
        })
        const data = await res.json() as ReviewReport & { error?: string }
        if (!res.ok || data.error) {
          setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'error', error: data.error ?? 'Помилка' } : e))
        } else {
          const doneEntry: SeriesEntry = { ...entry, status: 'done', report: data }
          newlyDone.push(doneEntry)
          setEntries(prev => prev.map(e => e.id === entry.id ? doneEntry : e))
        }
      } catch {
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'error', error: "Помилка з'єднання" } : e))
      }
    }
    setProcessing(false)

    const allDone = [...alreadyDone, ...newlyDone]
    if (allDone.length >= 1) {
      await runFinalReview(allDone)
    }
  }

  // ── Export summary ─────────────────────────────────────────────────────────

  const exportSummary = async () => {
    const done = entries.filter(e => e.status === 'done' && e.report)
    const lines = done.map((e, i) => {
      const r = e.report!
      const scores = SCORE_KEYS.map(k => {
        const s = r.scores.find(x => x.key === k)
        return `${SCORE_SHORT[k]}: ${s?.score ?? '—'}`
      }).join(' | ')
      return `${i + 1}. ${e.filename}\n   Загальна: ${r.overall}/10 | ${scores}\n   Проблеми (${r.problems.length}): ${r.problems.slice(0, 2).join('; ')}`
    })
    await navigator.clipboard.writeText(lines.join('\n\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const downloadZip = async () => {
    const reworkSet = new Set((finalReport?.needsRework ?? []).map(r => r.filename))
    const toExport = entries.filter(e => e.status === 'done' && !reworkSet.has(e.filename))
    if (!toExport.length) return

    setZipLoading(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      for (let i = 0; i < toExport.length; i++) {
        const entry = toExport[i]
        const num = String(i + 1).padStart(2, '0')
        const safeName = entry.filename.replace(/[/\\:*?"<>|]/g, '_').replace(/\.docx$/i, '')

        if (entry.file) {
          zip.file(`${num}_${safeName}.docx`, await entry.file.arrayBuffer())
        } else {
          zip.file(`${num}_${safeName}.txt`, entry.text)
        }
      }

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Балабони_серії_впорядковані.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setZipLoading(false)
    }
  }

  const doneCount  = entries.filter(e => e.status === 'done').length
  const hasPending = entries.some(e => e.status === 'pending' || e.status === 'error')

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
            <button onClick={() => router.push('/admin/stories')} style={{ fontSize: 12, fontWeight: 600, color: GOLD, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}>← Редактор серій</button>
            <button onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login') }} style={{ fontSize: 12, fontWeight: 600, color: '#8899bb', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}>Вийти</button>
          </div>
        </div>

        {/* Input area */}
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

        {/* Entries list */}
        {entries.length > 0 && (
          <div style={{ background: NAVY, borderRadius: 16, padding: '16px 18px', border: '0.5px solid rgba(255,255,255,0.07)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>
                Серій у черзі: {entries.length}
              </span>
              <button
                onClick={() => setEntries([])}
                style={{ fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
              >
                Очистити все
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entries.map((e, i) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT, flexShrink: 0, width: 20, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#c8d4e8', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.filename}</span>
                  <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT, flexShrink: 0 }}>{e.text.trim().split(/\s+/).length} сл.</span>
                  <span style={{ fontSize: 12, flexShrink: 0 }}>
                    {e.status === 'pending'   && <span style={{ color: '#8899bb' }}>⏳</span>}
                    {e.status === 'reviewing' && <span style={{ color: GOLD }}>⚡</span>}
                    {e.status === 'done'      && <span style={{ color: '#4ade80' }}>✓</span>}
                    {e.status === 'error'     && <span style={{ color: '#f87171' }}>✕</span>}
                  </span>
                  {e.status !== 'reviewing' && (
                    <button onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))} style={{ background: 'none', border: 'none', color: '#445566', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                  )}
                </div>
              ))}
            </div>

            {/* Run button */}
            <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={runBatch}
                disabled={processing || !hasPending}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  background: processing ? 'rgba(99,102,241,0.45)' : !hasPending ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: !hasPending ? '#445566' : '#fff',
                  border: 'none', borderRadius: 12, padding: '14px 20px',
                  fontSize: 14, fontWeight: 700, fontFamily: FONT,
                  cursor: processing ? 'wait' : !hasPending ? 'not-allowed' : 'pointer',
                  boxShadow: !hasPending || processing ? 'none' : '0 2px 12px rgba(99,102,241,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {processing ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="8" cy="8" r="6" stroke="#fff" strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                    </svg>
                    Перевіряю {progress.current} з {progress.total}…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <circle cx="7" cy="7" r="5" stroke="#fff" strokeWidth="1.6"/>
                      <path d="M11 11l3 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                    Перевірити всі ({entries.filter(e => e.status === 'pending' || e.status === 'error').length}) (AI)
                  </>
                )}
              </button>
              {doneCount > 0 && (
                <>
                  <button
                    onClick={exportSummary}
                    style={{ fontSize: 12, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                  >
                    {copied ? '✓ Скопійовано' : '📋 Копіювати звіт'}
                  </button>
                  <button
                    onClick={downloadZip}
                    disabled={zipLoading}
                    style={{ fontSize: 12, fontWeight: 600, color: zipLoading ? '#445566' : GOLD, background: zipLoading ? 'rgba(255,255,255,0.03)' : 'rgba(240,165,0,0.1)', border: `1px solid ${zipLoading ? 'rgba(255,255,255,0.08)' : 'rgba(240,165,0,0.25)'}`, borderRadius: 10, padding: '10px 14px', cursor: zipLoading ? 'wait' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                  >
                    {zipLoading ? '⏳ Пакую…' : '⬇️ Завантажити ZIP'}
                  </button>
                </>
              )}
            </div>

            {/* Progress bar */}
            {processing && (
              <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#6366f1', borderRadius: 2, width: `${(progress.current / progress.total) * 100}%`, transition: 'width 0.4s ease' }} />
              </div>
            )}
          </div>
        )}

        {/* Results table */}
        {doneCount > 0 && (
          <div style={{ background: NAVY, borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>
                Результати — {doneCount} серій
              </span>
              <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>Клікніть рядок для деталей</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#445566', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>№</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#445566', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>Назва</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#445566', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>Заг.</th>
                    {SCORE_KEYS.map(k => (
                      <th key={k} style={{ padding: '10px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#445566', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>{SCORE_SHORT[k]}</th>
                    ))}
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#445566', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>Пробл.</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.filter(e => e.status === 'done' && e.report).map((e, i) => (
                    <>
                      <tr
                        key={e.id}
                        onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: expandedId === e.id ? 'rgba(99,102,241,0.07)' : 'transparent', transition: 'background 0.15s' }}
                      >
                        <td style={{ padding: '12px 12px', fontSize: 12, color: '#445566', fontFamily: FONT }}>{i + 1}</td>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#f5f0e8', fontFamily: FONT, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ marginRight: 6 }}>{expandedId === e.id ? '▼' : '▶'}</span>
                          {e.filename}
                        </td>
                        <ScoreCell s={e.report!.overall} />
                        {SCORE_KEYS.map(k => {
                          const sc = e.report!.scores.find(x => x.key === k)
                          return <ScoreCell key={k} s={sc?.score ?? 0} />
                        })}
                        <td style={{ textAlign: 'center', padding: '12px 8px', fontSize: 13, color: e.report!.problems.length > 2 ? '#f87171' : '#8899bb', fontFamily: FONT, fontWeight: 700 }}>
                          {e.report!.problems.length}
                        </td>
                      </tr>

                      {expandedId === e.id && (
                        <tr key={`${e.id}-detail`}>
                          <td colSpan={9} style={{ padding: '0 12px 16px', background: 'rgba(99,102,241,0.05)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 12 }}>
                              {/* Score comments */}
                              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 8 }}>Оцінки</div>
                                {e.report!.scores.map(s => (
                                  <div key={s.key} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(s.score), fontFamily: FONT, flexShrink: 0, width: 22 }}>{s.score}</span>
                                    <span style={{ fontSize: 12, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}><b style={{ color: '#8899bb' }}>{s.label}:</b> {s.comment}</span>
                                  </div>
                                ))}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {/* Problems */}
                                {e.report!.problems.length > 0 && (
                                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>⚠️ Проблеми</div>
                                    {e.report!.problems.map((p, pi) => (
                                      <div key={pi} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT, marginBottom: 4 }}>
                                        <span style={{ color: '#f87171', fontWeight: 700 }}>·</span>{p}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Recommendations */}
                                {e.report!.recommendations.length > 0 && (
                                  <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>💡 Рекомендації</div>
                                    {e.report!.recommendations.map((r, ri) => (
                                      <div key={ri} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT, marginBottom: 4 }}>
                                        <span style={{ color: '#818cf8', fontWeight: 700 }}>·</span>{r}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Average row */}
            {doneCount > 1 && (() => {
              const done = entries.filter(e => e.status === 'done' && e.report)
              const avg = (key: string) => {
                const vals = done.map(e => e.report!.scores.find(s => s.key === key)?.score ?? 0)
                return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
              }
              const avgOverall = Math.round(done.reduce((a, e) => a + e.report!.overall, 0) / done.length)
              return (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#445566', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, width: 32 }}>СЕР.</span>
                  <span style={{ fontSize: 11, color: '#8899bb', fontFamily: FONT, flex: 1 }}>Середній бал по всіх серіях</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor(avgOverall), fontFamily: FONT, width: 40, textAlign: 'center' }}>{avgOverall}</span>
                  {SCORE_KEYS.map(k => (
                    <span key={k} style={{ fontSize: 14, fontWeight: 700, color: scoreColor(avg(k)), fontFamily: FONT, width: 36, textAlign: 'center' }}>{avg(k)}</span>
                  ))}
                  <span style={{ width: 40 }} />
                </div>
              )
            })()}
          </div>
        )}

        {/* Final review loading */}
        {finalLoading && (
          <div style={{ marginTop: 16, background: NAVY, borderRadius: 16, padding: '24px 20px', border: '1px solid rgba(240,165,0,0.2)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
              <circle cx="8" cy="8" r="6" stroke={GOLD} strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
            </svg>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, fontFamily: FONT, marginBottom: 2 }}>Фінальна перевірка якості (AI)…</div>
              <div style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>Gemini аналізує весь серіал цілісно</div>
            </div>
          </div>
        )}

        {/* Final review error */}
        {finalError && (
          <div style={{ marginTop: 16, fontSize: 13, color: '#f87171', padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: FONT }}>
            {finalError}
          </div>
        )}

        {/* Final report */}
        {finalReport && (
          <div style={{ marginTop: 16, background: NAVY, borderRadius: 16, border: `1px solid ${finalReport.verdict === 'ready' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`, overflow: 'hidden' }}>

            {/* Verdict banner */}
            <div style={{
              padding: '20px 22px',
              background: finalReport.verdict === 'ready' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
              borderBottom: `1px solid ${finalReport.verdict === 'ready' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'}`,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: finalReport.verdict === 'ready' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {finalReport.verdict === 'ready' ? '✅' : '⚠️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8899bb', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 4 }}>Фінальна перевірка якості</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: finalReport.verdict === 'ready' ? '#4ade80' : '#f87171', fontFamily: FONT }}>
                  {finalReport.verdictText}
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 38, fontWeight: 800, color: scoreColor(finalReport.overallQuality.score), fontFamily: FONT, lineHeight: 1 }}>{finalReport.overallQuality.score}</div>
                <div style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>/10 серіал</div>
              </div>
            </div>

            <div style={{ padding: '18px 20px' }}>

              {/* 6 indicator cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 16 }}>

                {/* Style compliance */}
                {(() => {
                  const ok = finalReport.styleCompliance.compliant >= finalReport.styleCompliance.nonCompliant + finalReport.styleCompliance.compliant * 0.3
                  return (
                    <div style={{ background: ok ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)', border: `1px solid ${ok ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: ok ? '#4ade80' : '#f87171', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>🎭 Стиль Балабонів</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT, marginBottom: 4 }}>
                        <span style={{ color: '#4ade80' }}>{finalReport.styleCompliance.compliant} відп.</span>
                        {finalReport.styleCompliance.nonCompliant > 0 && <span style={{ color: '#f87171' }}> · {finalReport.styleCompliance.nonCompliant} не відп.</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.4, fontFamily: FONT }}>{finalReport.styleCompliance.comment}</div>
                    </div>
                  )
                })()}

                {/* Characters bible */}
                <div style={{ background: `${scoreColor(finalReport.charactersBible.score)}11`, border: `1px solid ${scoreColor(finalReport.charactersBible.score)}33`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor(finalReport.charactersBible.score), letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>👥 Відповідність CHARACTERS_BIBLE</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor(finalReport.charactersBible.score), fontFamily: FONT, lineHeight: 1 }}>{finalReport.charactersBible.score}</span>
                    <span style={{ fontSize: 12, color: '#445566', fontFamily: FONT }}>/10</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.4, fontFamily: FONT }}>{finalReport.charactersBible.comment}</div>
                </div>

                {/* Chronology */}
                {(() => {
                  const ok = finalReport.chronologyLogic.valid
                  return (
                    <div style={{ background: ok ? 'rgba(74,222,128,0.07)' : 'rgba(251,191,36,0.07)', border: `1px solid ${ok ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.25)'}`, borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: ok ? '#4ade80' : '#fbbf24', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>🕐 Логіка хронології</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: ok ? '#4ade80' : '#fbbf24', fontFamily: FONT, marginBottom: 4 }}>{ok ? 'Послідовність збережена' : 'Є проблеми'}</div>
                      {finalReport.chronologyLogic.issues.length > 0 && finalReport.chronologyLogic.issues.map((iss, ii) => (
                        <div key={ii} style={{ fontSize: 11, color: '#8899bb', fontFamily: FONT, marginBottom: 2 }}>· {iss}</div>
                      ))}
                      <div style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.4, fontFamily: FONT, marginTop: 2 }}>{finalReport.chronologyLogic.comment}</div>
                    </div>
                  )
                })()}

                {/* Plot uniqueness */}
                {(() => {
                  const total = finalReport.plotUniqueness.uniqueCount + finalReport.plotUniqueness.duplicates
                  const ok = finalReport.plotUniqueness.duplicates === 0
                  return (
                    <div style={{ background: ok ? 'rgba(74,222,128,0.07)' : 'rgba(251,191,36,0.07)', border: `1px solid ${ok ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.25)'}`, borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: ok ? '#4ade80' : '#fbbf24', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>✨ Унікальність сюжетів</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT, marginBottom: 4 }}>
                        <span style={{ color: '#4ade80' }}>{finalReport.plotUniqueness.uniqueCount} унік.</span>
                        {finalReport.plotUniqueness.duplicates > 0 && <span style={{ color: '#fbbf24' }}> · {finalReport.plotUniqueness.duplicates} кліше</span>}
                        {total > 0 && <span style={{ fontSize: 11, color: '#445566' }}> з {total}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.4, fontFamily: FONT }}>{finalReport.plotUniqueness.comment}</div>
                    </div>
                  )
                })()}

                {/* TTS readiness */}
                {(() => {
                  const ok = finalReport.ttsReadiness.needsCleaning === 0
                  return (
                    <div style={{ background: ok ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)', border: `1px solid ${ok ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: ok ? '#4ade80' : '#f87171', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>🎙️ Готовність до озвучки</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT, marginBottom: 4 }}>
                        <span style={{ color: '#4ade80' }}>{finalReport.ttsReadiness.clean} готові</span>
                        {finalReport.ttsReadiness.needsCleaning > 0 && <span style={{ color: '#f87171' }}> · {finalReport.ttsReadiness.needsCleaning} потреб. очищення</span>}
                      </div>
                      {finalReport.ttsReadiness.series.length > 0 && (
                        <div style={{ fontSize: 11, color: '#f87171', fontFamily: FONT, marginBottom: 4 }}>{finalReport.ttsReadiness.series.join(', ')}</div>
                      )}
                      <div style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.4, fontFamily: FONT }}>{finalReport.ttsReadiness.comment}</div>
                    </div>
                  )
                })()}

                {/* Overall quality detail */}
                <div style={{ background: `${scoreColor(finalReport.overallQuality.score)}11`, border: `1px solid ${scoreColor(finalReport.overallQuality.score)}33`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor(finalReport.overallQuality.score), letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>📊 Загальна якість серіалу</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor(finalReport.overallQuality.score), fontFamily: FONT, lineHeight: 1 }}>{finalReport.overallQuality.score}</span>
                    <span style={{ fontSize: 12, color: '#445566', fontFamily: FONT }}>/10</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.4, fontFamily: FONT }}>{finalReport.overallQuality.comment}</div>
                </div>

              </div>

              {/* Needs rework list */}
              {finalReport.needsRework.length > 0 && (
                <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 10 }}>
                    🔧 Серії що потребують доопрацювання ({finalReport.needsRework.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {finalReport.needsRework.map((item, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT, marginBottom: 4 }}>{item.filename}</div>
                        {item.reasons.map((r, ri) => (
                          <div key={ri} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}>
                            <span style={{ color: '#f87171', fontWeight: 700 }}>·</span>{r}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
