'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const FONT       = "'Montserrat', Arial, sans-serif"
const GOLD       = '#f0a500'
const NAVY       = '#0f1e3a'
const NAVY_DEEP  = '#0a1628'
const JAMENDO_ID = 'a4f04bbe'

const GENRES = ['Казка', 'Оповідання', 'Детектив', 'Пригода', 'Романтика', 'Фантастика', 'Інше']

const MOODS = [
  { label: 'Весела',       tags: 'happy folk acoustic' },
  { label: 'Ностальгічна', tags: 'melancholic ambient piano' },
  { label: 'Пригодницька', tags: 'adventure orchestral' },
  { label: 'Зустріч',      tags: 'romantic acoustic guitar' },
]

interface JTrack {
  id: string
  name: string
  duration: number
  artist_name: string
  audio: string
  image: string
}

interface AnalysisResult {
  rating: number
  emotion: string
  complexity: string
  recommendedAge: string
  tags: string[]
  teaser: string
  improvements: string[]
}

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

function fmtDur(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function StoriesAdminPage() {
  const router = useRouter()

  // story fields
  const [title,        setTitle]        = useState('')
  const [season,       setSeason]       = useState('')
  const [episode,      setEpisode]      = useState('')
  const [character,    setCharacter]    = useState('')
  const [genre,        setGenre]        = useState(GENRES[0])
  const [summary,      setSummary]      = useState('')
  const [text,         setText]         = useState('')
  const [styleContext, setStyleContext] = useState('')

  // AI generation
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError,   setAiError]   = useState('')

  // AI analysis
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [analyzeError,   setAnalyzeError]   = useState('')
  const [analysis,       setAnalysis]       = useState<AnalysisResult | null>(null)

  // photo
  const [imgSrc,   setImgSrc]   = useState('')
  const [urlDraft, setUrlDraft] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // music
  const [mood,          setMood]          = useState(MOODS[0].label)
  const [tracks,        setTracks]        = useState<JTrack[]>([])
  const [musicLoading,  setMusicLoading]  = useState(false)
  const [musicError,    setMusicError]    = useState('')
  const [playingId,     setPlayingId]     = useState<string | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<JTrack | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)

  // export
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const fileRef  = useRef<HTMLInputElement>(null)
  const musicRef = useRef<HTMLAudioElement>(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const readMin   = Math.ceil(wordCount / 180) || 0

  // ── Photo handlers ────────────────────────────────────────────────────────

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
    const t = val.trim()
    if (t.startsWith('http://') || t.startsWith('https://')) setImgSrc(t)
    else if (!t) setImgSrc('')
  }

  // ── Jamendo music ─────────────────────────────────────────────────────────

  const searchJamendo = async () => {
    const moodObj = MOODS.find(m => m.label === mood)
    if (!moodObj) return
    setMusicLoading(true); setTracks([]); setMusicError(''); setSelectedTrack(null)
    const audio = musicRef.current
    if (audio) { audio.pause(); setPlayingId(null); setIsAudioPlaying(false) }
    try {
      const u = new URL('https://api.jamendo.com/v3.0/tracks/')
      u.searchParams.set('client_id', JAMENDO_ID)
      u.searchParams.set('format', 'json')
      u.searchParams.set('limit', '5')
      u.searchParams.set('tags', moodObj.tags)
      u.searchParams.set('audioformat', 'mp32')
      const res = await fetch(u.toString())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: { results: JTrack[] } = await res.json()
      const results = data.results ?? []
      setTracks(results)
      if (results.length === 0) setMusicError('Нічого не знайдено. Спробуйте іншу настрій.')
    } catch {
      setMusicError('Помилка пошуку. Перевірте з\'єднання та спробуйте знову.')
    } finally {
      setMusicLoading(false)
    }
  }

  const togglePlay = (track: JTrack) => {
    const audio = musicRef.current
    if (!audio) return
    if (playingId === track.id) {
      if (audio.paused) { audio.play().catch(() => {}); setIsAudioPlaying(true) }
      else              { audio.pause(); setIsAudioPlaying(false) }
    } else {
      audio.src = track.audio
      audio.play().catch(() => {})
      setPlayingId(track.id)
      setIsAudioPlaying(true)
    }
  }

  // ── AI generation ────────────────────────────────────────────────────────

  const generateAI = async () => {
    setAiLoading(true); setAiError('')
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, season, episode, character, genre, summary, styleContext }),
      })
      const data = await res.json() as { text?: string; error?: string }
      if (!res.ok || data.error) { setAiError(data.error ?? 'Помилка генерації'); return }
      setText(data.text ?? '')
    } catch {
      setAiError("Помилка з'єднання з API")
    } finally {
      setAiLoading(false)
    }
  }

  // ── AI analysis ──────────────────────────────────────────────────────────

  const analyzeText = async () => {
    setAnalyzeLoading(true); setAnalyzeError(''); setAnalysis(null)
    try {
      const res = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json() as AnalysisResult & { error?: string }
      if (!res.ok || data.error) { setAnalyzeError(data.error ?? 'Помилка аналізу'); return }
      setAnalysis(data)
    } catch {
      setAnalyzeError("Помилка з'єднання з API")
    } finally {
      setAnalyzeLoading(false)
    }
  }

  // ── Export helpers ────────────────────────────────────────────────────────

  const epNum = episode ? episode.padStart(2, '0') : ''
  const seasonEpLabel = [season, epNum ? `Серія ${epNum}` : ''].filter(Boolean).join(' · ')

  const exportText = (): string => {
    const lines = [
      '══════════════════════════════',
      `📖  ${title || '(без назви)'}`,
    ]
    if (seasonEpLabel) lines.push(`📺  ${seasonEpLabel}`)
    lines.push(`👤  ${character || '—'} · ${genre}`)
    if (selectedTrack) lines.push(`🎵  ${selectedTrack.name} — ${selectedTrack.artist_name}`)
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

  const slug = (title || 'story').substring(0, 32).replace(/\s+/g, '_').replace(/[^\w_]/g, '')
  const fileBase = [season && `s${season.replace(/\D/g, '')}`, epNum && `ep${epNum}`, slug].filter(Boolean).join('_')

  const handleDownloadTxt  = () => downloadBlob(exportText(), `${fileBase}.txt`, 'text/plain;charset=utf-8')
  const handleDownloadJson = () => {
    const payload = {
      title, season, episode, character, genre, summary, text,
      coverUrl: urlDraft || (imgSrc.startsWith('http') ? imgSrc : ''),
      music: selectedTrack ? { id: selectedTrack.id, name: selectedTrack.name, artist: selectedTrack.artist_name, url: selectedTrack.audio } : null,
      wordCount, createdAt: new Date().toISOString(),
    }
    downloadBlob(JSON.stringify(payload, null, 2), `${fileBase}.json`, 'application/json;charset=utf-8')
  }

  const selectStyle: React.CSSProperties = { ...inputBase, appearance: 'none', cursor: 'pointer' }
  const isEmpty = !title && !text

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <audio ref={musicRef} onEnded={() => setIsAudioPlaying(false)} />
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
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 2, fontFamily: FONT }}>Адмін панель</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>Редактор історій</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT }}>
            {wordCount > 0 && <span style={{ fontSize: 12, color: GOLD }}>{wordCount} слів</span>}
            <button
              onClick={() => router.push('/admin/reviews')}
              style={{ fontSize: 12, fontWeight: 600, color: GOLD, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}
            >
              ⭐ Відгуки
            </button>
            <button
              onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login') }}
              style={{ fontSize: 12, fontWeight: 600, color: '#8899bb', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}
            >
              Вийти
            </button>
          </div>
        </div>

        {/* ━━━ SECTION 1 — Story Details ━━━ */}
        <SectionCard n={1} title="Деталі серії">
          <Field label="Назва серії">
            <input style={inputBase} value={title} onChange={e => setTitle(e.target.value)} placeholder="Наприклад: Балабон і Темний ліс" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Сезон" right="необов'язково">
              <input style={inputBase} value={season} onChange={e => setSeason(e.target.value)} placeholder="Напр.: 1" />
            </Field>
            <Field label="Серія №" right="необов'язково">
              <input style={inputBase} type="number" min={1} max={999} value={episode} onChange={e => setEpisode(e.target.value)} placeholder="Напр.: 5" />
            </Field>
            <Field label="Жанр">
              <select style={selectStyle} value={genre} onChange={e => setGenre(e.target.value)}>
                {GENRES.map(g => <option key={g} value={g} style={{ background: NAVY }}>{g}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Персонаж">
            <input style={inputBase} value={character} onChange={e => setCharacter(e.target.value)} placeholder="Ім'я персонажа або автора" />
          </Field>
          <Field label="Короткий опис / тизер">
            <textarea style={{ ...inputBase, height: 68, resize: 'vertical', lineHeight: 1.6 }} placeholder="2–3 речення, які читач побачить у превʼю..." value={summary} onChange={e => setSummary(e.target.value)} />
          </Field>
          <Field label="Стиль та контекст">
            <textarea
              style={{ ...inputBase, height: 120, resize: 'vertical', lineHeight: 1.65 }}
              placeholder="Вставте уривки попередніх серій або опишіть стиль, атмосферу, ключові деталі. Claude використає це для збереження єдиного голосу і стилю..."
              value={styleContext}
              onChange={e => setStyleContext(e.target.value)}
            />
          </Field>

          {/* AI generate button */}
          <button
            onClick={generateAI}
            disabled={aiLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              background: aiLoading ? 'rgba(240,165,0,0.45)' : 'linear-gradient(135deg, #f0a500 0%, #e8920a 100%)',
              color: NAVY_DEEP, border: 'none', borderRadius: 12,
              padding: '14px 18px', fontSize: 14, fontWeight: 700,
              cursor: aiLoading ? 'wait' : 'pointer', fontFamily: FONT, marginBottom: 16,
              boxShadow: aiLoading ? 'none' : '0 2px 12px rgba(240,165,0,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {aiLoading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" stroke={NAVY_DEEP} strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                </svg>
                Claude пише…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1 L10 6 L15 6 L11 9.5 L12.5 14.5 L8 11.5 L3.5 14.5 L5 9.5 L1 6 L6 6 Z" fill={NAVY_DEEP} opacity="0.9"/>
                </svg>
                Згенерувати текст (Claude AI)
              </>
            )}
          </button>

          {aiError && (
            <div style={{ fontSize: 13, color: '#f87171', marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: FONT }}>
              {aiError}
            </div>
          )}

          <Field label="Текст серії" right={`${wordCount} слів · ${text.length} символів · ~${readMin} хв`}>
            <textarea style={{ ...inputBase, height: 300, resize: 'vertical', lineHeight: 1.75 }} placeholder="Вставте або введіть повний текст серії, або згенеруйте через Claude AI вище..." value={text} onChange={e => setText(e.target.value)} />
          </Field>

          {/* ── ШІ Аналіз ──────────────────────────────────────────────────── */}
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 12 }}>
              ШІ Аналіз
            </div>

            <button
              onClick={analyzeText}
              disabled={analyzeLoading || !text.trim()}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                background: analyzeLoading
                  ? 'rgba(99,102,241,0.45)'
                  : !text.trim()
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: !text.trim() ? '#445566' : '#fff',
                border: 'none', borderRadius: 12,
                padding: '14px 18px', fontSize: 14, fontWeight: 700,
                cursor: analyzeLoading ? 'wait' : !text.trim() ? 'not-allowed' : 'pointer',
                fontFamily: FONT, marginBottom: 14,
                boxShadow: !text.trim() || analyzeLoading ? 'none' : '0 2px 12px rgba(99,102,241,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {analyzeLoading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke="#fff" strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                  </svg>
                  Аналізую…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="#fff" strokeWidth="1.4"/>
                    <path d="M5.5 8.5l2 2 3.5-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Проаналізувати текст (Gemini AI)
                </>
              )}
            </button>

            {analyzeError && (
              <div style={{ fontSize: 13, color: '#f87171', marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: FONT }}>
                {analyzeError}
              </div>
            )}

            {analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Row: Rating · Emotion · Complexity · Age */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>📊 Оцінка</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: FONT, lineHeight: 1 }}>{analysis.rating}</span>
                      <span style={{ fontSize: 13, color: '#8899bb', fontFamily: FONT }}>/10</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#fb923c', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>💚 Емоційність</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: FONT, textTransform: 'capitalize' }}>{analysis.emotion}</div>
                  </div>

                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>📖 Складність</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: FONT, textTransform: 'capitalize' }}>{analysis.complexity}</div>
                  </div>

                  <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>👤 Вік аудиторії</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: FONT }}>{analysis.recommendedAge}</div>
                  </div>
                </div>

                {/* Tags */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 8 }}>🏷️ Авто-теги</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {analysis.tags.map((tag, i) => (
                      <span key={i} style={{ fontSize: 12, fontWeight: 600, color: GOLD, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 20, padding: '4px 12px', fontFamily: FONT }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Teaser */}
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>💬 Пропонований тизер</div>
                    <button
                      onClick={() => setSummary(analysis.teaser)}
                      style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                    >
                      Застосувати тизер
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: '#c8d4e8', lineHeight: 1.65, margin: 0, fontFamily: FONT }}>{analysis.teaser}</p>
                </div>

                {/* Improvements */}
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 8 }}>💡 Рекомендації по покращенню</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {analysis.improvements.map((tip, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}>
                        <span style={{ color: '#f87171', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>·</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            )}
          </div>
        </SectionCard>

        {/* ━━━ SECTION 2 — Cover Photo ━━━ */}
        <SectionCard n={2} title="Фото обкладинки">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{ border: `1.5px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.15)'}`, borderRadius: 12, padding: '30px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(240,165,0,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s', marginBottom: 14 }}
          >
            <div style={{ fontSize: 30, marginBottom: 8 }}>🖼</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f0e8', marginBottom: 4, fontFamily: FONT }}>Перетягніть фото сюди або клікніть</div>
            <div style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>PNG · JPG · WEBP · до 10 МБ</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
          </div>
          <div style={{ marginBottom: imgSrc ? 14 : 0 }}>
            <input style={inputBase} placeholder="Або вставте URL зображення..." value={urlDraft}
              onChange={e => handleUrlChange(e.target.value)}
              onPaste={e => handleUrlChange(e.clipboardData.getData('text'))}
            />
          </div>
          {imgSrc && (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt="cover preview" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.6) 0%, transparent 40%)' }} />
              <button onClick={() => { setImgSrc(''); setUrlDraft('') }} style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
            </div>
          )}
        </SectionCard>

        {/* ━━━ SECTION 3 — Jamendo Music ━━━ */}
        <SectionCard n={3} title="Музика для серії">

          {/* Mood chips + search button */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {MOODS.map(m => (
              <button key={m.label} onClick={() => setMood(m.label)} style={{
                background: mood === m.label ? GOLD : 'rgba(255,255,255,0.07)',
                color: mood === m.label ? NAVY_DEEP : '#c8d4e8',
                border: `1px solid ${mood === m.label ? GOLD : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 20, padding: '7px 16px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
              }}>
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={searchJamendo}
            disabled={musicLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: musicLoading ? 'rgba(240,165,0,0.5)' : GOLD,
              color: NAVY_DEEP, border: 'none', borderRadius: 12,
              padding: '13px 18px', fontSize: 14, fontWeight: 700,
              cursor: musicLoading ? 'wait' : 'pointer', fontFamily: FONT, marginBottom: 16,
            }}
          >
            {musicLoading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" stroke={NAVY_DEEP} strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                </svg>
                Пошук…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke={NAVY_DEEP} strokeWidth="1.8"/>
                  <line x1="11" y1="11" x2="14.5" y2="14.5" stroke={NAVY_DEEP} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                Знайти музику
              </>
            )}
          </button>

          {/* Error */}
          {musicError && (
            <div style={{ fontSize: 13, color: '#f87171', textAlign: 'center', padding: '10px', background: 'rgba(239,68,68,0.08)', borderRadius: 10, marginBottom: 10, fontFamily: FONT }}>
              {musicError}
            </div>
          )}

          {/* Track list */}
          {tracks.map(track => {
            const isPlaying  = playingId === track.id && isAudioPlaying
            const isPaused   = playingId === track.id && !isAudioPlaying
            const isSelected = selectedTrack?.id === track.id
            return (
              <div key={track.id} onClick={() => setSelectedTrack(track)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 12, cursor: 'pointer', marginBottom: 8,
                background: isSelected ? 'rgba(240,165,0,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? GOLD : 'rgba(255,255,255,0.08)'}`,
                transition: 'all 0.15s',
              }}>

                {/* Play/pause button */}
                <button
                  onClick={e => { e.stopPropagation(); togglePlay(track) }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    background: isPlaying ? 'rgba(240,165,0,0.25)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${isPlaying || isPaused ? GOLD : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isPlaying ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="1.5" y="1.5" width="3" height="9" rx="1" fill={GOLD}/>
                      <rect x="7.5" y="1.5" width="3" height="9" rx="1" fill={GOLD}/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <polygon points="2.5,1.5 11,6 2.5,10.5" fill={isPaused ? GOLD : '#8899bb'}/>
                    </svg>
                  )}
                </button>

                {/* Track info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? GOLD : '#f5f0e8', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {track.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2, fontFamily: FONT }}>
                    {track.artist_name}
                    {track.duration > 0 && <span style={{ marginLeft: 8, color: '#445566' }}>· {fmtDur(track.duration)}</span>}
                  </div>
                </div>

                {/* Selected badge */}
                {isSelected && (
                  <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, fontFamily: FONT, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6 L5 9 L10 3" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Вибрано
                  </div>
                )}
              </div>
            )
          })}

          {/* Selected track summary */}
          {selectedTrack && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, padding: '10px 14px', background: 'rgba(240,165,0,0.07)', borderRadius: 10, border: `0.5px solid rgba(240,165,0,0.25)` }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 13V6l8-2v7" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="2.5" cy="13" r="1.5" stroke={GOLD} strokeWidth="1.4"/>
                <circle cx="10.5" cy="11" r="1.5" stroke={GOLD} strokeWidth="1.4"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: GOLD, fontFamily: FONT }}>{selectedTrack.name}</span>
                <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}> — {selectedTrack.artist_name}</span>
              </div>
              <button onClick={() => { setSelectedTrack(null) }} style={{ background: 'none', border: 'none', color: '#445566', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          )}

        </SectionCard>

        {/* ━━━ SECTION 4 — Preview & Export ━━━ */}
        <SectionCard n={4} title="Превʼю та Експорт">

          {/* Story preview card */}
          <div style={{ background: NAVY_DEEP, border: `1px solid rgba(240,165,0,0.2)`, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
            {imgSrc && (
              <div style={{ position: 'relative', height: 200 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt="story cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,1) 0%, rgba(10,22,40,0.3) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 16, left: 18, right: 18 }}>
                  {seasonEpLabel && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 5, fontFamily: FONT }}>{seasonEpLabel}</div>}
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT, lineHeight: 1.2 }}>{title || '(без назви)'}</div>
                </div>
              </div>
            )}
            <div style={{ padding: '16px 18px 20px' }}>
              {!imgSrc && (
                <>
                  {seasonEpLabel && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 5, fontFamily: FONT }}>{seasonEpLabel}</div>}
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', marginBottom: 12, fontFamily: FONT }}>{title || '(без назви)'}</div>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>{character} · {genre}</span>
              </div>
              {selectedTrack && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 10V5l6-1.5v5" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="1.5" cy="10" r="1" fill={GOLD}/>
                    <circle cx="7.5" cy="8.5" r="1" fill={GOLD}/>
                  </svg>
                  <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>{selectedTrack.name} — {selectedTrack.artist_name}</span>
                </div>
              )}
              {summary && (
                <p style={{ fontSize: 14, color: '#c8d4e8', lineHeight: 1.7, margin: '0 0 14px', fontFamily: FONT, fontStyle: 'italic', borderLeft: `2px solid rgba(240,165,0,0.35)`, paddingLeft: 12 }}>{summary}</p>
              )}
              {text ? (
                <div style={{ paddingTop: 12, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#445566', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: FONT }}>Уривок тексту · {wordCount} слів · ~{readMin} хв</div>
                  <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.75, margin: 0, fontFamily: FONT, maxHeight: 120, overflow: 'hidden' }}>{text.substring(0, 350)}{text.length > 350 ? '…' : ''}</p>
                </div>
              ) : isEmpty ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#334455', fontSize: 13, fontFamily: FONT }}>Заповніть Секцію 1, щоб побачити превʼю</div>
              ) : null}
            </div>
          </div>

          {/* Export buttons */}
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

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 4, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
            {[
              { label: 'Слів',       val: wordCount > 0 ? wordCount.toLocaleString('uk') : '—' },
              { label: 'Символів',   val: text.length > 0 ? text.length.toLocaleString('uk') : '—' },
              { label: 'Хв читання', val: readMin > 0 ? `~${readMin}` : '—' },
              { label: 'Фото',       val: imgSrc ? '✓' : '—',           accent: !!imgSrc },
              { label: 'Музика',     val: selectedTrack ? '✓' : '—',    accent: !!selectedTrack },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', flex: '1 1 60px', padding: '6px 4px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.accent ? '#4ade80' : GOLD, fontFamily: FONT, lineHeight: 1.2 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#445566', fontFamily: FONT, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

        </SectionCard>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
