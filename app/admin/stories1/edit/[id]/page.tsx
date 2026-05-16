'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Cropper, { Area, Point } from 'react-easy-crop'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

const CARD_ASPECT = 275 / 175

// 16 жанрів, з великої букви
const GENRES = [
  'Драма',
  'Гумор',
  'Казка',
  'Детектив',
  'Романтика',
  'Трилер',
  'Пригоди',
  'Фантастика',
  'Містика',
  'Історична проза',
  'Сімейна історія',
  'Бойовик',
  'Жахи',
  'Психологія',
  'Біографія',
  'Життєві історії',
]

const CATEGORIES = ['', 'З життя', 'Містика', 'Любов', 'Воєнні', 'Історичні', 'Родинні', 'Гумор', 'Детектив', 'Психологічні', 'Дитячі']

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

type Phase = 'idle' | 'loading' | 'cropping' | 'saving' | 'done' | 'error'

export default function EditStoryPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const [title,         setTitle]         = useState('')
  const [authorName,    setAuthorName]    = useState('')
  const [genre,         setGenre]         = useState(GENRES[0])
  const [category,      setCategory]      = useState('')
  const [text,          setText]          = useState('')
  const [coverUrl,      setCoverUrl]      = useState('')

  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadError, setUploadError] = useState('')

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
        // Якщо жанр з БД є у списку — використовуємо його, інакше беремо перший
        setGenre(GENRES.includes(s.genre ?? '') ? s.genre : GENRES[0])
        setCategory(s.category ?? '')
        setCoverUrl(s.cover_url ?? '')
        setText(s.text ?? '')
        setPhase('idle')
      })
      .catch(() => { setError("Помилка з'єднання"); setPhase('error') })
  }, [id])

  const onCropComplete = useCallback((_areaPct: Area, areaPx: Area) => {
    setCroppedPixels(areaPx)
  }, [])

  const handleFilePick = () => fileRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (id) fd.append('storyId', id)

      const res = await fetch('/api/admin/stories1/upload-cover', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setUploadError(data.error ?? 'Помилка завантаження')
      } else {
        setSourceUrl(data.url)
        setCoverUrl(data.url)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
      }
    } catch {
      setUploadError('Помилка з\'єднання')
    } finally {
      setUploadingPhoto(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setPhase('saving'); setSavedMessage('')
    try {
      let finalCoverUrl = coverUrl

      if (sourceUrl && croppedPixels) {
        setPhase('cropping')
        const cropRes = await fetch('/api/admin/stories1/crop-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceUrl,
            crop: {
              x:      croppedPixels.x,
              y:      croppedPixels.y,
              width:  croppedPixels.width,
              height: croppedPixels.height,
            },
            storyId: id,
          }),
        })
        const cropData = await cropRes.json()
        if (!cropRes.ok || cropData.error) {
          setError(cropData.error ?? 'Не вдалось обрізати'); setPhase('error'); return
        }
        finalCoverUrl = cropData.url
      }

      setPhase('saving')
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
          cover_url: finalCoverUrl || null,
          cover_position: 'center',
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? 'Помилка'); setPhase('error'); return }

      setCoverUrl(finalCoverUrl)
      setSourceUrl(null)
      setCroppedPixels(null)
      setSavedMessage('Збережено!')
      setPhase('done')
      setTimeout(() => setPhase('idle'), 2500)
    } catch {
      setError("Помилка з'єднання"); setPhase('error')
    }
  }

  const startRecrop = () => {
    if (coverUrl) {
      setSourceUrl(coverUrl)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
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

  const showCropper = !!sourceUrl
  const saveButtonLabel =
    phase === 'cropping' ? 'Обрізаю фото…' :
    phase === 'saving'   ? 'Збереження…' :
    '💾 Зберегти зміни'

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

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

        <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', marginBottom: 20, border: '0.5px solid rgba(255,255,255,0.07)' }}>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, display: 'block', marginBottom: 6 }}>Назва історії</label>
            <input style={inputBase} value={title} onChange={e => setTitle(e.target.value)} placeholder="Назва твору" />
          </div>

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

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, display: 'block', marginBottom: 6 }}>Обкладинка історії</label>

            <input type="file" ref={fileRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

            <button type="button" onClick={handleFilePick} disabled={uploadingPhoto}
              style={{ width: '100%', background: uploadingPhoto ? 'rgba(240,165,0,0.45)' : GOLD, color: NAVY_DEEP, border: 'none', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontWeight: 800, cursor: uploadingPhoto ? 'wait' : 'pointer', fontFamily: FONT, marginBottom: 8 }}>
              {uploadingPhoto ? '⏳ Завантажую…' : '📷 Завантажити нове фото'}
            </button>

            {coverUrl && !showCropper && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: 275, margin: '6px auto', borderRadius: 10, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.1)', aspectRatio: '275 / 175', background: '#000' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
                <button type="button" onClick={startRecrop}
                  style={{ width: '100%', background: 'transparent', border: `1px solid ${GOLD}55`, color: GOLD, borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, marginTop: 6 }}>
                  ✂ Перекадрувати наявне фото
                </button>
              </div>
            )}

            {uploadError && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.09)', borderRadius: 8, color: '#f87171', fontFamily: FONT, fontSize: 12 }}>{uploadError}</div>
            )}
          </div>

          {showCropper && sourceUrl && (
            <div style={{ marginBottom: 16, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>
                  Виберіть область для картки
                </div>
                <button type="button" onClick={() => { setSourceUrl(null); setCroppedPixels(null) }}
                  style={{ background: 'transparent', border: `1px solid ${GOLD}55`, color: GOLD, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>
                  ✕ Скасувати
                </button>
              </div>

              <div style={{ position: 'relative', width: '100%', height: 280, borderRadius: 10, overflow: 'hidden', background: '#000', marginBottom: 10 }}>
                <Cropper
                  image={sourceUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={CARD_ASPECT}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  minZoom={1}
                  maxZoom={3}
                  zoomSpeed={0.5}
                  showGrid={true}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#8899bb', fontFamily: FONT }}>🔍 Масштаб</span>
                <span style={{ fontSize: 11, color: GOLD, fontFamily: FONT, fontWeight: 700 }}>{Math.round(zoom * 100)}%</span>
              </div>
              <input type="range" min={1} max={3} step={0.01} value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: GOLD }} />

              <div style={{ fontSize: 11, color: '#445566', marginTop: 10, fontFamily: FONT, lineHeight: 1.5 }}>
                Тягни фото мишкою. Та область, що в рамці — і є картка. Натисни «Зберегти зміни» внизу, щоб обрізати на сервері.
              </div>
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>Текст історії</label>
              {wordCount > 0 && <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>{wordCount} слів · ~{readMin} хв</span>}
            </div>
            <textarea style={{ ...inputBase, height: 360, resize: 'vertical', lineHeight: 1.75 }} value={text} onChange={e => setText(e.target.value)} placeholder="Повний текст історії..." />
          </div>

          <button onClick={handleSave} disabled={phase === 'saving' || phase === 'cropping'} style={{ width: '100%', background: (phase === 'saving' || phase === 'cropping') ? 'rgba(240,165,0,0.45)' : GOLD, color: NAVY_DEEP, border: 'none', borderRadius: 12, padding: '14px 18px', fontSize: 15, fontWeight: 800, cursor: (phase === 'saving' || phase === 'cropping') ? 'wait' : 'pointer', fontFamily: FONT }}>
            {saveButtonLabel}
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
