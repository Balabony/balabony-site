'use client'

// app/admin/content/stories/[id]/edit/page.tsx
// Форма редагування одного запису з content (Парочка тощо)
// Дозволяє правити: title, author_name, genre, category, cover (з кропом), text
// Використовує API: GET/PATCH /api/admin/content/[id]

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

const GENRES = ['Драма', 'Гумор', 'Казка', 'Детектив', 'Романтика', 'Трилер', 'Пригоди', 'Фантастика', 'Містика', 'Історична проза', 'Сімейна історія', 'Бойовик', 'Жахи', 'Психологія', 'Біографія', 'Життєві історії']
const CATEGORIES = ['', 'З життя', 'Містика', 'Любов', 'Воєнні', 'Історичні', 'Родинні', 'Гумор', 'Детектив', 'Психологічні', 'Дитячі']

const inputBase: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '10px 13px', color: '#f5f0e8', fontSize: 14,
  fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
}

// ── Primitives ──────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, background: NAVY, borderRadius: 16, padding: '20px 18px', border: '0.5px solid rgba(255,255,255,0.07)' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  )
}

// ── Item type ───────────────────────────────────────────────────────

interface ContentItem {
  id: string
  slug: string | null
  title: string
  author_name: string
  genre: string | null
  category: string | null
  cover_url: string | null
  cover_position: string | null
  status: string
  text: string | null
  type: string | null
  description: string | null
}

interface GetResponse {
  item?: ContentItem
  error?: string
}

interface MutationResponse {
  ok?: boolean
  message?: string
  error?: string
}

// ── Page ────────────────────────────────────────────────────────────

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [phase,   setPhase]   = useState<'loading' | 'editing' | 'saving' | 'error'>('loading')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const [item,         setItem]         = useState<ContentItem | null>(null)
  const [title,        setTitle]        = useState('')
  const [author,       setAuthor]       = useState('')
  const [genre,        setGenre]        = useState('')
  const [category,     setCategory]     = useState('')
  const [description,  setDescription]  = useState('')
  const [text,         setText]         = useState('')
  const [coverUrl,     setCoverUrl]     = useState('')
  const [coverPosition, setCoverPosition] = useState('center')

  const [uploadingCover, setUploadingCover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Завантаження ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/admin/content/${id}`)
      .then(r => r.json())
      .then((data: GetResponse) => {
        if (data.error || !data.item) {
          setError(data.error ?? 'Не знайдено')
          setPhase('error')
          return
        }
        const it = data.item
        setItem(it)
        setTitle(it.title ?? '')
        setAuthor(it.author_name ?? '')
        setGenre(it.genre ?? '')
        setCategory(it.category ?? '')
        setDescription(it.description ?? '')
        setText(it.text ?? '')
        setCoverUrl(it.cover_url ?? '')
        setCoverPosition(it.cover_position ?? 'center')
        setPhase('editing')
      })
      .catch(() => { setError("Помилка з'єднання"); setPhase('error') })
  }, [id])

  // ── Завантаження нового фото ─────────────────────────────────────
  const handleCoverUpload = useCallback(async (file: File) => {
    setUploadingCover(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/stories1/upload-cover', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || data.error || !data.url) {
        setError(data.error ?? 'Помилка завантаження фото')
        return
      }
      setCoverUrl(data.url)
      setSuccess('Фото завантажено. Не забудьте зберегти зміни.')
    } catch {
      setError("Помилка завантаження фото")
    } finally {
      setUploadingCover(false)
    }
  }, [])

  // ── Збереження ────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setPhase('saving')
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:          title.trim(),
          author_name:    author.trim(),
          genre:          genre || null,
          category:       category || null,
          description:    description.trim() || null,
          text:           text,
          cover_url:      coverUrl || null,
          cover_position: coverPosition,
        }),
      })
      const data = await res.json() as MutationResponse
      if (!res.ok || data.error) {
        setError(data.error ?? 'Помилка збереження')
        setPhase('editing')
        return
      }
      setSuccess('Зміни збережено')
      setPhase('editing')
    } catch {
      setError("Помилка з'єднання")
      setPhase('editing')
    }
  }, [id, title, author, genre, category, description, text, coverUrl, coverPosition])

  // ── Видалення ─────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!item) return
    if (!confirm(`Видалити "${item.title}"? Цю дію не можна скасувати.`)) return
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' })
      const data = await res.json() as MutationResponse
      if (!res.ok || data.error) {
        setError(data.error ?? 'Помилка видалення')
        return
      }
      router.push('/admin/content/stories')
    } catch {
      setError("Помилка з'єднання")
    }
  }, [id, item, router])

  // ── States: loading / error ───────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#8899bb', fontFamily: FONT, padding: 40, textAlign: 'center' }}>
        Завантаження…
      </div>
    )
  }

  if (phase === 'error' && !item) {
    return (
      <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: 40 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: 16, color: '#f87171' }}>
          ⚠ {error}
        </div>
        <div style={{ maxWidth: 720, margin: '20px auto 0' }}>
          <a href="/admin/content/stories" style={{ color: GOLD, fontFamily: FONT, textDecoration: 'none' }}>← До списку</a>
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Back link */}
        <div style={{ marginBottom: 12 }}>
          <a href="/admin/content/stories" style={{ color: '#8899bb', fontFamily: FONT, fontSize: 13, textDecoration: 'none' }}>← До списку</a>
        </div>

        {/* Header */}
        <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', marginBottom: 20, border: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 11, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', fontFamily: FONT }}>Редагування</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f5f0e8', marginTop: 4, fontFamily: FONT }}>{item?.title}</div>
          {item?.slug && (
            <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4, fontFamily: FONT }}>
              <a href={`/stories/${item.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: GOLD, textDecoration: 'none' }}>
                Подивитись на сайті ↗
              </a>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div style={{ marginBottom: 16, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: 12, color: '#f87171', fontSize: 13, fontFamily: FONT }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{ marginBottom: 16, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 12, padding: 12, color: '#4ade80', fontSize: 13, fontFamily: FONT }}>
            ✓ {success}
          </div>
        )}

        {/* SECTION: Cover */}
        <SectionCard title="Обкладинка">
          {coverUrl && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: 10,
                background: `url(${coverUrl}) ${coverPosition}/cover`,
                border: '1px solid rgba(255,255,255,0.08)',
              }} />
              <div style={{ fontSize: 11, color: '#445566', marginTop: 6, fontFamily: FONT, wordBreak: 'break-all' }}>{coverUrl}</div>
            </div>
          )}

          <Field label="Завантажити нове фото">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleCoverUpload(f)
              }}
              disabled={uploadingCover}
              style={{ ...inputBase, padding: '8px 10px' }}
            />
            {uploadingCover && <div style={{ marginTop: 6, fontSize: 12, color: GOLD, fontFamily: FONT }}>Завантаження…</div>}
          </Field>

          <Field label="Позиція кадрування (cover_position)">
            <select value={coverPosition} onChange={e => setCoverPosition(e.target.value)} style={inputBase}>
              <option value="center">center (центр)</option>
              <option value="top">top (верх)</option>
              <option value="bottom">bottom (низ)</option>
              <option value="left">left (ліво)</option>
              <option value="right">right (право)</option>
              <option value="top left">top left</option>
              <option value="top right">top right</option>
              <option value="bottom left">bottom left</option>
              <option value="bottom right">bottom right</option>
            </select>
          </Field>

          <Field label="Або вкажіть URL вручну">
            <input type="text" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} style={inputBase} placeholder="https://…" />
          </Field>
        </SectionCard>

        {/* SECTION: Метадані */}
        <SectionCard title="Інформація">
          <Field label="Назва">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputBase} />
          </Field>

          <Field label="Автор">
            <input type="text" value={author} onChange={e => setAuthor(e.target.value)} style={inputBase} />
          </Field>

          <Field label="Жанр">
            <select value={genre} onChange={e => setGenre(e.target.value)} style={inputBase}>
              <option value="">— Не вказано —</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>

          <Field label="Категорія (тег)">
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputBase}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c || '— Не вказано —'}</option>)}
            </select>
          </Field>

          <Field label="Опис / тізер">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputBase, resize: 'vertical', minHeight: 70 }}
            />
          </Field>
        </SectionCard>

        {/* SECTION: Текст */}
        <SectionCard title="Текст історії">
          <Field label={`Контент (${text.length} символів)`}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={15}
              style={{ ...inputBase, resize: 'vertical', minHeight: 280, fontFamily: 'Georgia, serif', lineHeight: 1.6 }}
            />
          </Field>
        </SectionCard>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          <button
            onClick={handleSave}
            disabled={phase === 'saving' || uploadingCover}
            style={{
              flex: 1,
              minWidth: 180,
              background: GOLD,
              color: NAVY_DEEP,
              padding: '12px 20px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 800,
              border: 'none',
              cursor: phase === 'saving' ? 'wait' : 'pointer',
              fontFamily: FONT,
              opacity: phase === 'saving' || uploadingCover ? 0.6 : 1,
            }}
          >
            {phase === 'saving' ? 'Збереження…' : 'Зберегти зміни'}
          </button>

          <button
            onClick={handleDelete}
            disabled={phase === 'saving'}
            style={{
              background: 'rgba(248,113,113,0.1)',
              color: '#f87171',
              padding: '12px 20px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              border: '1px solid rgba(248,113,113,0.3)',
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            Видалити
          </button>
        </div>

      </div>
    </div>
  )
}
