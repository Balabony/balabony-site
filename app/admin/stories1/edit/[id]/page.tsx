'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

const GENRES = ['оповідання', 'гумор', 'драма', 'казка', 'пригода', 'історична проза']
const CATEGORIES = ['', 'З життя', 'Містика', 'Любов', 'Воєнні', 'Історичні', 'Родинні', 'Гумор', 'Детектив', 'Психологічні', 'Дитячі']

// Варіанти зсуву обкладинки (фокус видимої частини при кропі)
const COVER_POSITIONS: { value: string, label: string }[] = [
  { value: 'top',          label: 'Верх (обличчя зверху)' },
  { value: 'center 25%',   label: 'Верхня чверть' },
  { value: 'center',       label: 'Центр (за замовч.)' },
  { value: 'center 75%',   label: 'Нижня чверть' },
  { value: 'bottom',       label: 'Низ' },
]

const inputBase: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '10px 13px', color: '#f5f0e8', fontSize: 14,
  fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
}

interface StoryFull {
  id:              string
  slug:            string
  title:           string
  author_name:     string
  genre:           string
  category:        string | null
  text:            string
  cover_url:       string | null
  cover_position:  string | null
}

type Phase = 'idle' | 'loading' | 'saving' | 'done' | 'error'

export default function EditStoryPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  // Стан
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  // Поля форми
  const [title,         setTitle]         = useState('')
  const [authorName,    setAuthorName]    = useState('')
  const [genre,         setGenre]         = useState(GENRES[0])
  const [category,      setCategory]      = useState('')
  const [text,          setText]          = useState('')
  const [coverUrl,      setCoverUrl]      = useState('')
  const [coverPosition, setCoverPosition] = useState('center')

  // Завантаження поточних даних
  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/stories1/update?id=${encodeURIComponent(id)}`, { method: 'GET' })
      .then(r => r.json())
      .then((data: { story?: StoryFull, error?: string }) => {
        if (data.error || !data.story) {
          setError(data.error ?? 'Історію не знайдено')
          setPhase('error')
          return
        }
        const s = data.story
        setTitle(s.title ?? '')
        setAuthorName(s.author_name ?? '')
        setGenre(s.genre ?? GENRES[0])
        setCategory(s.category ?? '')
        setCoverUrl(s.cover_url ?? '')
        setCoverPosition(s.cover_position ?? 'center')
        setText(s.text ?? '')
        setPhase('idle')
      })
      .catch(() => { setError("Помилка з'єднання"); setPhase('error') })
  }, [id])

  // Збереження
  const handleSave = async () => {
    setPhase('saving'); setSavedMessage('')
    try {
      const res = await fetch('/api/admin/stories1/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title,
          author_name: authorName,
          genre,
          category: category || null,
          text,
          cover_url: coverUrl || null,
          cover_position: coverPosition,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? 'Помилка'); setPhase('error'); return }
      setSavedMessage('Збережено!')
      setPhase('done')
      setTimeout(() => setPhase('idle'), 2000)
    } catch {
      setError("Помилка з'єднання"); setPhase('error')
    }
  }

  // Завантаження фото
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    try {
      const reader = new FileReader()
      reader.onload = ev => {
        const base64 = ev.target?.result as string
        setCoverUrl(base64)
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch {
      alert("Помилка завантаження")
      setUploadingPhoto(false)
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const readMin   = Math.ceil(wordCount / 180) || 0

  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Завантаження…
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', marginBottom: 20, border: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', fontFamily: FONT }}>Admin · Edit</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f5f0e8', marginTop: 4, fontFamily: FONT }}>Редагувати історію</div>
          </div>
          <a href="/admin/stories1/list" style={{ fontSize: 12, color: '#8899bb', textDecoration: 'none', fontFamily: FONT }}>← Назад до списку</a>
        </div>

        {phase === 'error' && (
          <div style={{ padding: 16, background: 'rgba(239,68,68,0.09)', borderRadius: 12, color: '#f87171', fontFamily: FONT, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Форма */}
        <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', marginBottom: 20, border: '0.5px solid rgba(255,255,255,0.07)' }}>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, display: 'block', marginBottom: 6 }}>Назва історії</label>
            <input style={inputBase} value={title} onChange={e => setTitle(e.target.value)} placeholder="Назва твору" />
          </div>

          {/* Author + Genre */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, display: 'block', marginBottom: 6 }}>Автор</label>
              <input style={inputBase} value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Ім'я та прізвище" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, display: 'block', marginBottom: 6 }}>Жанр</label>
              <select style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }} value={genre} onChange={e => setGenre(e.target.value)}>
                {GENRES.map(g => <option key={g} value={g} style={{ background: NAVY }}>{g}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, display: 'block', marginBottom: 6 }}>Категорія</label>
            <select style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="" style={{ background: NAVY }}>— Без категорії —</option>
              {CATEGORIES.filter(c => c).map(c => <option key={c} value={c} style={{ background: NAVY }}>{c}</option>)}
            </select>
          </div>

          {/* Cover URL */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, display: 'block', marginBottom: 6 }}>URL обкладинки</label>
            <input style={inputBase} value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." />
            {coverUrl && (
              <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt="preview" style={{ width: '100%', height: 200, objectFit: 'cover', objectPosition: coverPosition, display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
            <div style={{ fontSize: 11, color: '#445566', marginTop: 6, fontFamily: FONT }}>
              Завантажте файл у Supabase Storage → covers, потім скопіюйте Public URL сюди
            </div>
          </div>

          {/* Cover Position */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, display: 'block', marginBottom: 6 }}>Зсув обкладинки (де фокус)</label>
            <select style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }} value={coverPosition} onChange={e => setCoverPosition(e.target.value)}>
              {COVER_POSITIONS.map(p => <option key={p.value} value={p.value} style={{ background: NAVY }}>{p.label}</option>)}
            </select>
            <div style={{ fontSize: 11, color: '#445566', marginTop: 6, fontFamily: FONT }}>
              Як кадрувати фото на картці. Для портретів обличчя зверху — обирай «Верх» або «Верхня чверть».
            </div>
          </div>

          {/* Text */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>Текст історії</label>
              {wordCount > 0 && <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>{wordCount} слів · ~{readMin} хв</span>}
            </div>
            <textarea style={{ ...inputBase, height: 360, resize: 'vertical', lineHeight: 1.75 }} value={text} onChange={e => setText(e.target.value)} placeholder="Повний текст історії..." />
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={phase === 'saving'} style={{ width: '100%', background: phase === 'saving' ? 'rgba(240,165,0,0.45)' : GOLD, color: NAVY_DEEP, border: 'none', borderRadius: 12, padding: '14px 18px', fontSize: 15, fontWeight: 800, cursor: phase === 'saving' ? 'wait' : 'pointer', fontFamily: FONT }}>
            {phase === 'saving' ? 'Збереження…' : '💾 Зберегти зміни'}
          </button>

          {phase === 'done' && savedMessage && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, color: '#4ade80', fontFamily: FONT, fontSize: 13, textAlign: 'center' }}>
              ✓ {savedMessage}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
