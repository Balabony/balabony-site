'use client'

import { useState, useRef, useCallback } from 'react'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#f0a500'
const NAVY = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

const CHARACTERS = ['Дід Панас', 'Балабон', 'Зайченя Оксанка', 'Оповідач', 'Інший персонаж']
const SEASONS    = ['Сезон 1', 'Сезон 2', 'Сезон 3']
const GENRES     = ['Казка', 'Пригода', 'Природа', 'Сімейна', 'Освітня', 'Детективна']

// ── Reusable primitives ──────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '10px 13px', color: '#f5f0e8', fontSize: 14,
  fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children, right }: { label: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>{label}</span>
        {right && <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>{right}</span>}
      </div>
      {children}
    </div>
  )
}

function SectionCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, background: NAVY, borderRadius: 16, padding: '20px 18px', border: '0.5px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: NAVY_DEEP, flexShrink: 0, fontFamily: FONT }}>
          {n}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function StoriesAdminPage() {
  const [title,     setTitle]     = useState('')
  const [season,    setSeason]    = useState(SEASONS[0])
  const [episode,   setEpisode]   = useState('1')
  const [character, setCharacter] = useState(CHARACTERS[0])
  const [genre,     setGenre]     = useState(GENRES[0])
  const [summary,   setSummary]   = useState('')
  const [text,      setText]      = useState('')
  const [imgSrc,    setImgSrc]    = useState('')
  const [urlDraft,  setUrlDraft]  = useState('')
  const [dragOver,  setDragOver]  = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const fileRef = useRef<HTMLInputElement>(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const readMin   = Math.ceil(wordCount / 180) || 0

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => { setImgSrc(ev.target?.result as string); setUrlDraft('') }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) loadFile(f)
  }, [loadFile])

  const handleUrlChange = (val: string) => {
    setUrlDraft(val)
    const trimmed = val.trim()
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) setImgSrc(trimmed)
    else if (!trimmed) setImgSrc('')
  }

  const epNum = episode.padStart(2, '0')

  const exportText = (): string => {
    const lines = [
      '══════════════════════════════',
      `📖  ${title || '(без назви)'}`,
      `📺  ${season} · Серія ${epNum}`,
      `👤  ${character} · ${genre}`,
    ]
    if (summary) lines.push(`\n📝  ${summary}`)
    lines.push('══════════════════════════════', '', text)
    return lines.join('\n')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText())
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2500)
    } catch { /* clipboard blocked */ }
  }

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const fileBase = `s${season.slice(-1)}_ep${epNum}_${(title || 'story').substring(0, 32).replace(/\s+/g, '_').replace(/[^\w_]/g, '')}`

  const handleDownloadTxt = () => downloadBlob(exportText(), `${fileBase}.txt`, 'text/plain;charset=utf-8')

  const handleDownloadJson = () => {
    const payload = { title, season, episode, character, genre, summary, text, coverUrl: urlDraft || (imgSrc.startsWith('http') ? imgSrc : ''), wordCount, createdAt: new Date().toISOString() }
    downloadBlob(JSON.stringify(payload, null, 2), `${fileBase}.json`, 'application/json;charset=utf-8')
  }

  const selectStyle: React.CSSProperties = { ...inputBase, appearance: 'none', cursor: 'pointer' }
  const isEmpty = !title && !text

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* ── Admin header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4 L4 16 L10 13 L16 16 L16 4 Z" stroke={NAVY_DEEP} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="7" y1="8" x2="13" y2="8" stroke={NAVY_DEEP} strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="7" y1="11" x2="11" y2="11" stroke={NAVY_DEEP} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 2, fontFamily: FONT }}>
              Balabony · Адмін панель
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>Редактор серій</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#445566', fontFamily: FONT }}>
            {wordCount > 0 && <span style={{ color: GOLD }}>{wordCount} слів</span>}
          </div>
        </div>

        {/* ━━━ SECTION 1 — Story Details ━━━ */}
        <SectionCard n={1} title="Деталі серії">

          <Field label="Назва серії">
            <input
              style={inputBase} value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Наприклад: Балабон і Темний ліс"
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Сезон">
              <select style={selectStyle} value={season} onChange={e => setSeason(e.target.value)}>
                {SEASONS.map(s => <option key={s} value={s} style={{ background: NAVY }}>{s}</option>)}
              </select>
            </Field>
            <Field label="Серія №">
              <input style={inputBase} type="number" min={1} max={999} value={episode} onChange={e => setEpisode(e.target.value)} />
            </Field>
            <Field label="Жанр">
              <select style={selectStyle} value={genre} onChange={e => setGenre(e.target.value)}>
                {GENRES.map(g => <option key={g} value={g} style={{ background: NAVY }}>{g}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Персонаж">
            <select style={selectStyle} value={character} onChange={e => setCharacter(e.target.value)}>
              {CHARACTERS.map(c => <option key={c} value={c} style={{ background: NAVY }}>{c}</option>)}
            </select>
          </Field>

          <Field label="Короткий опис / тизер">
            <textarea
              style={{ ...inputBase, height: 68, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="2–3 речення, які читач побачить у превʼю..."
              value={summary} onChange={e => setSummary(e.target.value)}
            />
          </Field>

          <Field label="Текст серії" right={`${wordCount} слів · ${text.length} символів · ~${readMin} хв`}>
            <textarea
              style={{ ...inputBase, height: 300, resize: 'vertical', lineHeight: 1.75 }}
              placeholder="Вставте або введіть повний текст серії..."
              value={text} onChange={e => setText(e.target.value)}
            />
          </Field>

        </SectionCard>

        {/* ━━━ SECTION 2 — Cover Photo ━━━ */}
        <SectionCard n={2} title="Фото обкладинки">

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 12, padding: '30px 20px', textAlign: 'center', cursor: 'pointer',
              background: dragOver ? 'rgba(240,165,0,0.06)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s', marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 30, marginBottom: 8 }}>🖼</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f0e8', marginBottom: 4, fontFamily: FONT }}>
              Перетягніть фото сюди або клікніть
            </div>
            <div style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>PNG · JPG · WEBP · до 10 МБ</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
          </div>

          {/* URL input — auto-applies on paste/type */}
          <div style={{ marginBottom: imgSrc ? 14 : 0 }}>
            <input
              style={inputBase}
              placeholder="Або вставте URL зображення..."
              value={urlDraft}
              onChange={e => handleUrlChange(e.target.value)}
              onPaste={e => {
                const pasted = e.clipboardData.getData('text')
                handleUrlChange(pasted)
              }}
            />
          </div>

          {/* Image preview */}
          {imgSrc && (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt="cover preview" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.6) 0%, transparent 40%)' }} />
              <button
                onClick={() => { setImgSrc(''); setUrlDraft('') }}
                style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          )}

        </SectionCard>

        {/* ━━━ SECTION 3 — Preview & Export ━━━ */}
        <SectionCard n={3} title="Превʼю та Експорт">

          {/* ── Story preview card ── */}
          <div style={{ background: NAVY_DEEP, border: `1px solid rgba(240,165,0,0.2)`, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>

            {imgSrc && (
              <div style={{ position: 'relative', height: 200 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt="story cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,1) 0%, rgba(10,22,40,0.3) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 16, left: 18, right: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 5, fontFamily: FONT }}>
                    {season} · Серія {epNum}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT, lineHeight: 1.2 }}>
                    {title || '(без назви)'}
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding: '16px 18px 20px' }}>
              {!imgSrc && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 5, fontFamily: FONT }}>
                    {season} · Серія {epNum}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', marginBottom: 12, fontFamily: FONT }}>
                    {title || '(без назви)'}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>{character} · {genre}</span>
              </div>

              {summary && (
                <p style={{ fontSize: 14, color: '#c8d4e8', lineHeight: 1.7, margin: '0 0 14px', fontFamily: FONT, fontStyle: 'italic', borderLeft: `2px solid rgba(240,165,0,0.35)`, paddingLeft: 12 }}>
                  {summary}
                </p>
              )}

              {text ? (
                <div style={{ paddingTop: 12, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#445566', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: FONT }}>
                    Уривок тексту · {wordCount} слів · ~{readMin} хв
                  </div>
                  <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.75, margin: 0, fontFamily: FONT, maxHeight: 120, overflow: 'hidden' }}>
                    {text.substring(0, 350)}{text.length > 350 ? '…' : ''}
                  </p>
                </div>
              ) : isEmpty ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#334455', fontSize: 13, fontFamily: FONT }}>
                  Заповніть Секцію 1, щоб побачити превʼю
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Export buttons ── */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>

            <button onClick={handleCopy} style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: GOLD, color: NAVY_DEEP, border: 'none', borderRadius: 12, padding: '13px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke={NAVY_DEEP} strokeWidth="1.5"/>
                <path d="M10.5 5.5 L10.5 3.5 Q10.5 2.5 9.5 2.5 L2.5 2.5 Q1.5 2.5 1.5 3.5 L1.5 10.5 Q1.5 11.5 2.5 11.5 L4.5 11.5" stroke={NAVY_DEEP} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {copyState === 'copied' ? '✓ Скопійовано!' : 'Скопіювати текст'}
            </button>

            <button onClick={handleDownloadTxt} style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', color: '#f5f0e8', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 12, padding: '13px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2 L8 10" stroke="#f5f0e8" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M5 7.5 L8 11 L11 7.5" stroke="#f5f0e8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 13.5 L13.5 13.5" stroke="#f5f0e8" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Завантажити .txt
            </button>

            <button onClick={handleDownloadJson} style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', color: '#8899bb', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 2 L3 14 L13 14 L13 6 L9 2 Z" stroke="#8899bb" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M9 2 L9 6 L13 6" stroke="#8899bb" strokeWidth="1.4" strokeLinejoin="round"/>
                <line x1="5.5" y1="9" x2="10.5" y2="9" stroke="#8899bb" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="5.5" y1="11.5" x2="8.5" y2="11.5" stroke="#8899bb" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Завантажити .json
            </button>

          </div>

          {/* ── Stats row ── */}
          <div style={{ display: 'flex', gap: 4, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
            {[
              { label: 'Слів',          val: wordCount > 0 ? wordCount.toLocaleString('uk') : '—' },
              { label: 'Символів',      val: text.length > 0 ? text.length.toLocaleString('uk') : '—' },
              { label: 'Хв читання',    val: readMin > 0 ? `~${readMin}` : '—' },
              { label: 'Фото',          val: imgSrc ? '✓' : '—', accent: !!imgSrc },
              { label: 'Тизер',         val: summary ? '✓' : '—', accent: !!summary },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', flex: '1 1 60px', padding: '6px 4px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.accent ? '#4ade80' : GOLD, fontFamily: FONT, lineHeight: 1.2 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#445566', fontFamily: FONT, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

        </SectionCard>

      </div>
    </div>
  )
}
