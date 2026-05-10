'use client'

import { useState, useRef, useCallback } from 'react'

const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'
const FONT      = "'Montserrat', Arial, sans-serif"
const IVORY     = '#f5f0e8'
const MUTED     = '#445566'
const LABEL     = '#8899bb'
const RED       = '#f87171'
const GREEN     = '#4ade80'

// ─── Types ───
interface DryRunResultItem {
  filename: string
  slug: string
  title: string
  season: number
  episode: number
  description?: string
  wordCount: number
  warnings?: string[]
  textPreview?: string
}

interface DryRunResponse {
  mode: 'dryRun'
  summary: { total: number; parsed: number; errors: number }
  results: DryRunResultItem[]
  parseErrors?: { filename: string; error: string }[]
}

interface CommitResponse {
  mode: 'commit'
  summary: { total: number; parsed: number; inserted: number; dbErrors: number }
  inserted: { slug: string; title: string }[]
  dbErrors: { slug: string; error: string }[]
}

interface ErrorResponse {
  error: string
}

type ApiResponse = DryRunResponse | CommitResponse | ErrorResponse

function isError(r: ApiResponse): r is ErrorResponse {
  return 'error' in r
}

function isDryRun(r: ApiResponse): r is DryRunResponse {
  return 'mode' in r && r.mode === 'dryRun'
}

function isCommit(r: ApiResponse): r is CommitResponse {
  return 'mode' in r && r.mode === 'commit'
}

// ─── Helpers ───
function uid() { return Math.random().toString(36).slice(2) }
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

interface FileEntry {
  id: string
  file: File
}

// ─── Page ───
export default function ImportBalabonyPage() {
  const [entries, setEntries]   = useState<FileEntry[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list)
      .filter(f => f.name.toLowerCase().endsWith('.docx'))
      .filter(f => !f.name.startsWith('~$'))
    if (arr.length === 0) return
    setEntries(prev => {
      const existing = new Set(prev.map(e => `${e.file.name}_${e.file.size}`))
      const fresh = arr
        .filter(f => !existing.has(`${f.name}_${f.size}`))
        .map(file => ({ id: uid(), file }))
      return [...prev, ...fresh]
    })
    setResponse(null)
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  function removeEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function clearAll() {
    setEntries([])
    setResponse(null)
  }

  async function send(dryRun: boolean) {
    if (entries.length === 0) return
    if (!dryRun) {
      const ok = window.confirm(
        `Імпортувати ${entries.length} файл(ів) у БД? Дію не можна скасувати.`,
      )
      if (!ok) return
    }
    setLoading(true)
    setResponse(null)
    try {
      const fd = new FormData()
      fd.append('dryRun', dryRun ? 'true' : 'false')
      entries.forEach((e, i) => fd.append(`file${i}`, e.file))
      const res = await fetch('/api/admin/import-balabony', {
        method: 'POST',
        body: fd,
      })
      const data = (await res.json()) as ApiResponse
      setResponse(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setResponse({ error: `Помилка мережі: ${msg}` })
    } finally {
      setLoading(false)
    }
  }

  const totalSize = entries.reduce((s, e) => s + e.file.size, 0)

  return (
    <div style={{
      minHeight: '100vh',
      background: NAVY_DEEP,
      color: IVORY,
      fontFamily: FONT,
      padding: '24px 16px 80px',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Heading */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: LABEL,
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
          }}>
            Адміністрування
          </div>
          <h1 style={{
            fontSize: 24, fontWeight: 600, color: IVORY,
            margin: 0, fontFamily: FONT,
          }}>
            Імпорт серій Балабонів
          </h1>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
            Завантажте .docx файли. Спершу зробіть Dry-run для перевірки парсингу,
            потім Commit для запису в БД.
          </div>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            cursor: 'pointer',
            background: dragOver ? 'rgba(240,165,0,0.06)' : 'rgba(255,255,255,0.02)',
            border: `1px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 16,
            padding: '32px 20px',
            textAlign: 'center',
            marginBottom: 16,
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: IVORY, marginBottom: 6 }}>
            Перетягніть .docx файли сюди або клацніть для вибору
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>
            Можна додавати кілька файлів одразу. Тимчасові файли (~$*.docx) ігноруються.
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".docx"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {/* File list */}
        {entries.length > 0 && (
          <div style={{
            background: NAVY,
            borderRadius: 16,
            border: '0.5px solid rgba(255,255,255,0.07)',
            padding: '16px 18px',
            marginBottom: 16,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 12,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: LABEL,
                letterSpacing: 0.8, textTransform: 'uppercase',
              }}>
                Файли в черзі · {entries.length} · {formatBytes(totalSize)}
              </div>
              <button
                onClick={clearAll}
                disabled={loading}
                style={{
                  fontSize: 11, color: RED, background: 'none', border: 'none',
                  cursor: loading ? 'default' : 'pointer', fontFamily: FONT,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Очистити все
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entries.map(e => (
                <div key={e.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  fontSize: 13,
                }}>
                  <span style={{ color: IVORY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.file.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ color: MUTED, fontSize: 11 }}>{formatBytes(e.file.size)}</span>
                    <button
                      onClick={() => removeEntry(e.id)}
                      disabled={loading}
                      style={{
                        fontSize: 11, color: RED, background: 'none', border: 'none',
                        cursor: loading ? 'default' : 'pointer', fontFamily: FONT,
                        opacity: loading ? 0.5 : 1,
                      }}
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => send(true)}
            disabled={loading || entries.length === 0}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              color: IVORY,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              cursor: (loading || entries.length === 0) ? 'default' : 'pointer',
              opacity: (loading || entries.length === 0) ? 0.5 : 1,
            }}
          >
            {loading ? 'Обробка…' : 'Dry-run (перевірка)'}
          </button>
          <button
            onClick={() => send(false)}
            disabled={loading || entries.length === 0}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: GOLD,
              border: 'none',
              borderRadius: 10,
              color: NAVY_DEEP,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 700,
              cursor: (loading || entries.length === 0) ? 'default' : 'pointer',
              opacity: (loading || entries.length === 0) ? 0.5 : 1,
            }}
          >
            {loading ? 'Імпорт…' : 'Commit (запис у БД)'}
          </button>
        </div>

        {/* Response */}
        {response && (
          <div style={{
            background: NAVY,
            borderRadius: 16,
            border: '0.5px solid rgba(255,255,255,0.07)',
            padding: '18px 20px',
          }}>
            {isError(response) && (
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: RED,
                  letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
                }}>
                  Помилка
                </div>
                <div style={{ fontSize: 13, color: IVORY }}>{response.error}</div>
              </div>
            )}

            {isDryRun(response) && (
              <ResultDryRun data={response} />
            )}

            {isCommit(response) && (
              <ResultCommit data={response} />
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Result: Dry-run ───
function ResultDryRun({ data }: { data: DryRunResponse }) {
  const { summary, results, parseErrors } = data
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: LABEL,
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
      }}>
        Dry-run · перегляд
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
        <Stat label="Усього" value={summary.total} />
        <Stat label="Розпарсено" value={summary.parsed} color={GREEN} />
        <Stat label="Помилок парсингу" value={summary.errors} color={summary.errors > 0 ? RED : MUTED} />
      </div>

      {parseErrors && parseErrors.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: RED, marginBottom: 6 }}>
            Не вдалося розпарсити:
          </div>
          {parseErrors.map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: IVORY, marginBottom: 4 }}>
              <span style={{ color: MUTED }}>{e.filename}:</span> {e.error}
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <ResultsTable rows={results.map(r => ({
          slug: r.slug,
          title: r.title,
          extra: `S${r.season}E${r.episode} · ${r.wordCount} слів`,
        }))} />
      )}
    </div>
  )
}

// ─── Result: Commit ───
function ResultCommit({ data }: { data: CommitResponse }) {
  const { summary, inserted, dbErrors } = data
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700,
        color: dbErrors.length > 0 ? RED : GREEN,
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
      }}>
        Commit · {dbErrors.length > 0 ? 'часткова помилка' : 'успіх'}
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
        <Stat label="Усього" value={summary.total} />
        <Stat label="Розпарсено" value={summary.parsed} />
        <Stat label="Записано" value={summary.inserted} color={GREEN} />
        <Stat label="Помилок БД" value={summary.dbErrors} color={summary.dbErrors > 0 ? RED : MUTED} />
      </div>

      {dbErrors.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: RED, marginBottom: 6 }}>
            Помилки записування:
          </div>
          {dbErrors.map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: IVORY, marginBottom: 4 }}>
              <span style={{ color: MUTED }}>{e.slug}:</span> {e.error}
            </div>
          ))}
        </div>
      )}

      {inserted.length > 0 && (
        <ResultsTable rows={inserted.map(r => ({
          slug: r.slug,
          title: r.title,
        }))} />
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: LABEL,
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || IVORY }}>{value}</div>
    </div>
  )
}

function ResultsTable({ rows }: { rows: { slug: string; title: string; extra?: string }[] }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: LABEL,
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
      }}>
        Серії ({rows.length})
      </div>
      <div style={{
        maxHeight: 400, overflow: 'auto',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8,
      }}>
        {rows.map((r, i) => (
          <div key={r.slug + i} style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr auto',
            gap: 12,
            padding: '8px 12px',
            fontSize: 12,
            borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <span style={{ color: GOLD, fontFamily: 'monospace' }}>{r.slug}</span>
            <span style={{ color: IVORY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
            {r.extra && <span style={{ color: MUTED, fontSize: 11 }}>{r.extra}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
