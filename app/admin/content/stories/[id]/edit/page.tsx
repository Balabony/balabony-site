'use client'

// app/admin/content/stories/[id]/edit/page.tsx
// Форма редагування одного запису з content (Парочка тощо)
// Дозволяє правити: title, author_name, genre, category, cover (з кропом), text
// Використовує API: GET/PATCH /api/admin/content/[id]

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { analyzeEpisode } from '@/lib/episode-metrics'
import EditorialTools from '@/components/admin/EditorialTools'

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
  is_premium: boolean | null
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
  const [expandLoading, setExpandLoading] = useState(false)
  const [expandError,   setExpandError]   = useState('')
  const [titleSuggestLoading, setTitleSuggestLoading] = useState(false)
  const [titleSuggestions,    setTitleSuggestions]    = useState<string[]>([])

  const [item,         setItem]         = useState<ContentItem | null>(null)
  const [title,        setTitle]        = useState('')
  const [author,       setAuthor]       = useState('')
  const [genre,        setGenre]        = useState('')
  const [category,     setCategory]     = useState('')
  const [description,  setDescription]  = useState('')
  const [text,         setText]         = useState('')
  const [coverUrl,     setCoverUrl]     = useState('')
  const [coverPosition, setCoverPosition] = useState('center')
  const [isPremium,     setIsPremium]     = useState(false)


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
        setIsPremium(it.is_premium === true)
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
          is_premium:     isPremium,
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

  // Дотягнути закоротку серію до 1350–1500 слів (той самий маршрут, що у формі)
  const expandAI = async () => {
    if (!text.trim()) return
    setExpandLoading(true); setExpandError('')
    try {
      const res = await fetch('/api/admin/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => '')
        setExpandError(msg || 'Помилка розширення')
        return
      }
      const before = text
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setText(acc)
      }
      acc += decoder.decode()
      const cleaned = acc
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/ +\n/g, '\n')
        .trim()
      // Захист: ніколи не замінюємо наявний текст на коротший/порожній результат
      // (якщо стрім збійнув — лишаємо те, що було, а не псуємо запис)
      if (cleaned.length < before.trim().length) {
        setText(before)
        setExpandError('Розширення повернуло коротший текст — залишено попередній варіант. Спробуйте ще раз.')
      } else {
        setText(cleaned)
      }
    } catch {
      setExpandError("Помилка з'єднання з API")
    } finally {
      setExpandLoading(false)
    }
  }

  // Запропонувати назви серії на базі тексту
  const suggestTitles = async () => {
    if (!text.trim()) return
    setTitleSuggestLoading(true); setTitleSuggestions([])
    try {
      const res = await fetch('/api/admin/suggest-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json() as { titles?: string[]; error?: string }
      if (data.titles?.length) setTitleSuggestions(data.titles)
    } catch { /* тихо */ } finally {
      setTitleSuggestLoading(false)
    }
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
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={suggestTitles}
                disabled={titleSuggestLoading || !text.trim()}
                style={{
                  fontSize: 12, fontWeight: 700, fontFamily: FONT,
                  color: GOLD, background: 'transparent',
                  border: `1px solid ${GOLD}`, borderRadius: 8, padding: '6px 12px',
                  cursor: titleSuggestLoading || !text.trim() ? 'default' : 'pointer',
                  opacity: !text.trim() ? 0.5 : 1,
                }}>
                {titleSuggestLoading ? 'Думаю над назвами…' : '✨ Запропонувати назви (AI)'}
              </button>
              {titleSuggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {titleSuggestions.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTitle(t)}
                      style={{
                        fontSize: 12, fontFamily: FONT, color: '#f5f0e8',
                        background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.30)',
                        borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

          {(() => {
            const m = analyzeEpisode(text)
            const color = m.ok ? '#2d8f4e' : (m.lengthState === 'ok' || m.structureOk) ? '#d4a017' : '#d94545'
            const chip = (label: string, good: boolean) => (
              <span style={{
                fontSize: 12, fontWeight: 700, fontFamily: FONT,
                color: good ? '#9ae6b4' : '#fca5a5',
                background: good ? 'rgba(45,143,78,0.14)' : 'rgba(217,69,69,0.14)',
                border: `1px solid ${good ? 'rgba(45,143,78,0.4)' : 'rgba(217,69,69,0.4)'}`,
                borderRadius: 999, padding: '3px 10px',
              }}>{good ? '✓' : '✗'} {label}</span>
            )
            return (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 13, fontWeight: 800, fontFamily: FONT, color: '#fff',
                    background: color, borderRadius: 999, padding: '4px 12px',
                  }}>
                    ≈ {m.minutes} хв · {m.words} слів
                  </span>
                  {chip('9–10 хв', m.lengthState === 'ok')}
                  {chip('гачок', m.hasHook)}
                  {chip('висновок', m.hasConclusion)}
                  {chip('діалоги', m.hasDialogue)}
                </div>
                {m.hints.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#cbd5e1', fontSize: 12, fontFamily: FONT, lineHeight: 1.6 }}>
                    {m.hints.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}
                {m.lengthState === 'short' && (
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={expandAI}
                      disabled={expandLoading}
                      style={{
                        fontSize: 13, fontWeight: 800, fontFamily: FONT,
                        color: '#1a1205', background: expandLoading ? '#caa24a' : GOLD,
                        border: 'none', borderRadius: 10, padding: '9px 16px',
                        cursor: expandLoading ? 'default' : 'pointer',
                      }}>
                      {expandLoading ? 'Дотягую обсяг…' : '↑ Дотягнути обсяг (додати діалоги)'}
                    </button>
                    {expandError && (
                      <div style={{ fontSize: 12, color: '#f87171', marginTop: 8, fontFamily: FONT }}>{expandError}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </SectionCard>

        {/* SECTION: Доступ */}
        <SectionCard title="Доступ до серії">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div
              onClick={() => setIsPremium(v => !v)}
              style={{ width: 40, height: 22, borderRadius: 11, background: isPremium ? GOLD : 'rgba(255,255,255,0.1)', border: `1px solid ${isPremium ? GOLD : 'rgba(255,255,255,0.15)'}`, position: 'relative', flexShrink: 0, transition: 'background 0.2s', cursor: 'pointer' }}
            >
              <div style={{ position: 'absolute', top: 2, left: isPremium ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: 14, color: isPremium ? GOLD : '#8899bb', fontFamily: FONT, fontWeight: isPremium ? 700 : 400 }}>🔒 Закрита серія — тільки для річних підписників</span>
          </label>
          <div style={{ fontSize: 11, color: '#667799', fontFamily: FONT, marginTop: 8, lineHeight: 1.5 }}>
            Якщо увімкнено — серію бачать лише річні підписники; решті показується превʼю із закликом оформити річну. Не забудь «Зберегти зміни».
          </div>
        </SectionCard>

        {/* SECTION: Редакторські інструменти */}
        <SectionCard title="Редакторські інструменти">
          <EditorialTools
            text={text}
            genre={genre}
            title={title}
            authorName={author}
            onApply={setText}
            showAnalysis={true}
          />
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
