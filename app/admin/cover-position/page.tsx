'use client'

// Підгонка кадру обкладинок.
//
// Задача: у картці на сайті фото обрізається під 275×159, і при центруванні
// за замовчуванням людям зрізає голови. Тут кадр рухається мишею — саме в тій
// рамці, яку побачить читач, тож підганяємо не «на око», а по факту.
//
// Оригінал фото НЕ чіпаємо: зберігається лише рядок «scale:120 x:-10 y:-25»
// у полі cover_position. Те саме значення читає картка на сайті.

import { useCallback, useEffect, useRef, useState } from 'react'

const GOLD      = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY      = '#0f1e3a'
const CREAM     = '#f5f0e8'
const MUTED     = '#b9c6db'
const FONT      = "'Montserrat', Arial, sans-serif"
const LINE      = 'rgba(143,163,196,0.22)'

// Рамка картки на /stories. Міняти тут, лише якщо змінилась сама картка.
const FRAME_W = 275
const FRAME_H = 159

type Row = {
  id: string
  title: string
  author_name: string | null
  slug: string | null
  cover_url: string | null
  cover_position: string | null
  status: string
  type: string
}

type Frame = { scale: number; x: number; y: number }

const DEFAULT_FRAME: Frame = { scale: 100, x: 0, y: 0 }

/**
 * Скільки відсотків можна зсунути кадр, не оголивши краю.
 *
 * Фото заповнює рамку рівно при масштабі 100%. Кожні зайві 2% масштабу дають
 * 1% запасу з кожного боку — саме на стільки й можна рухати. Інакше з-під фото
 * вилазить чорна смуга.
 */
function maxOffset(scale: number): number {
  return Math.max(0, (scale - 100) / 2)
}

/** Масштаб, за якого такий зсув стає можливим. */
function scaleFor(x: number, y: number): number {
  return 100 + 2 * Math.max(Math.abs(x), Math.abs(y))
}

/** Не даємо кадру виїхати за межі фото. */
function clampFrame(f: Frame): Frame {
  const scale = Math.max(100, Math.min(300, Math.round(f.scale)))
  const m = maxOffset(scale)
  return {
    scale,
    x: Math.round(Math.max(-m, Math.min(m, f.x))),
    y: Math.round(Math.max(-m, Math.min(m, f.y))),
  }
}

/** «scale:120 x:-10 y:-25» → об’єкт. Старі значення («center», «50% 20%») — до замовчування. */
function parseFrame(value: string | null): Frame {
  if (!value) return DEFAULT_FRAME
  const m = value.match(/scale:(-?\d+)\s+x:(-?\d+)\s+y:(-?\d+)/)
  if (!m) return DEFAULT_FRAME
  return clampFrame({
    scale: parseInt(m[1], 10),
    x:     parseInt(m[2], 10),
    y:     parseInt(m[3], 10),
  })
}

function frameToValue(f: Frame): string {
  if (f.scale === 100 && f.x === 0 && f.y === 0) return 'center'
  return `scale:${Math.round(f.scale)} x:${Math.round(f.x)} y:${Math.round(f.y)}`
}

function frameStyle(f: Frame): React.CSSProperties {
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `translate(${f.x}%, ${f.y}%) scale(${f.scale / 100})`,
    transformOrigin: 'center center',
    display: 'block',
  }
}

export default function CoverPositionPage() {
  const [rows, setRows]       = useState<Row[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState('')
  const [q, setQ]             = useState('')
  const [only, setOnly]       = useState<'all' | 'unset'>('all')
  const [type, setType]       = useState('story')

  const [active, setActive]   = useState<Row | null>(null)
  const [frame, setFrame]     = useState<Frame>(DEFAULT_FRAME)
  const [saving, setSaving]   = useState(false)
  const [note, setNote]       = useState('')
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput]   = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const dragRef = useRef<{ startX: number; startY: number; base: Frame } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const params = new URLSearchParams({ q, only, type, limit: '60' })
      const r = await fetch(`/api/admin/cover-position?${params.toString()}`)
      if (!r.ok) throw new Error(r.status === 401 ? 'Потрібен вхід в адмінку' : `Помилка ${r.status}`)
      const j = await r.json() as { rows: Row[]; total: number }
      setRows(j.rows)
      setTotal(j.total)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не вдалось завантажити список')
    } finally {
      setLoading(false)
    }
  }, [q, only, type])

  useEffect(() => { void load() }, [load])

  function open(row: Row) {
    setActive(row)
    setFrame(parseFrame(row.cover_position))
    setNote('')
  }

  // Перетягування: рух миші в пікселях переводимо у відсотки рамки, тому
  // кадр рухається рівно за курсором незалежно від масштабу.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, base: frame }
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (!d) return
    const dx = ((e.clientX - d.startX) / FRAME_W) * 100
    const dy = ((e.clientY - d.startY) / FRAME_H) * 100
    const wantX = d.base.x + dx
    const wantY = d.base.y + dy
    // Якщо запасу бракує — збільшуємо фото рівно настільки, щоб зсув став
    // можливим. Так кадр іде за курсором, а порожнеча не зʼявляється.
    const needed = scaleFor(wantX, wantY)
    setFrame(clampFrame({
      scale: Math.max(d.base.scale, needed),
      x: wantX,
      y: wantY,
    }))
  }
  function onPointerUp() { dragRef.current = null }

  /**
   * Заміна фото. Після успіху оновлюємо адресу в списку і скидаємо кадр:
   * нова картинка — нове кадрування, старий зсув до неї не пасує.
   */
  async function replaceCover(payload: FormData) {
    if (!active) return
    setUploading(true)
    setNote('')
    try {
      payload.set('content_id', active.id)
      const r = await fetch('/api/admin/cover-upload', { method: 'POST', body: payload })
      const j = await r.json() as { ok?: boolean; cover_url?: string; error?: string }
      if (!r.ok || !j.cover_url) throw new Error(j.error ?? `Помилка ${r.status}`)

      const fresh = j.cover_url
      setRows(prev => prev.map(x => (x.id === active.id ? { ...x, cover_url: fresh, cover_position: 'center' } : x)))
      setActive(prev => (prev ? { ...prev, cover_url: fresh, cover_position: 'center' } : prev))
      setFrame(DEFAULT_FRAME)
      setUrlInput('')
      if (fileRef.current) fileRef.current.value = ''
      setNote('Фото замінено')
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Не вдалось замінити фото')
    } finally {
      setUploading(false)
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const fd = new FormData()
    fd.set('file', f)
    void replaceCover(fd)
  }

  function onUseUrl() {
    if (!/^https?:\/\//i.test(urlInput.trim())) {
      setNote('Посилання має починатися з http:// або https://')
      return
    }
    const fd = new FormData()
    fd.set('source_url', urlInput.trim())
    void replaceCover(fd)
  }

  async function save() {
    if (!active) return
    setSaving(true)
    setNote('')
    try {
      const value = frameToValue(frame)
      const r = await fetch(`/api/admin/content/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_position: value }),
      })
      if (!r.ok) throw new Error(`Помилка ${r.status}`)
      setRows(prev => prev.map(x => (x.id === active.id ? { ...x, cover_position: value } : x)))
      setActive(prev => (prev ? { ...prev, cover_position: value } : prev))
      setNote('Збережено')
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Не вдалось зберегти')
    } finally {
      setSaving(false)
    }
  }

  const btn: React.CSSProperties = {
    background: 'transparent', color: CREAM, border: `1px solid ${LINE}`,
    borderRadius: 8, padding: '9px 14px', fontSize: 13, fontFamily: FONT, cursor: 'pointer',
  }
  const btnMain: React.CSSProperties = {
    ...btn, background: GOLD, color: NAVY_DEEP, border: 'none', fontWeight: 700,
  }

  return (
    <div style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT, minHeight: '100dvh', padding: '22px 16px 120px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Кадр обкладинки</h1>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '0 0 18px', maxWidth: 720 }}>
          Картка на сайті обрізає фото під {FRAME_W}×{FRAME_H}. Тут видно рівно той кадр, який
          побачить читач: тягніть фото мишею, щоб обличчя не зрізало. Оригінал не змінюється —
          зберігається тільки положення.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Назва або автор"
            style={{ ...btn, minWidth: 240, cursor: 'text' }}
          />
          <select value={type} onChange={e => setType(e.target.value)} style={{ ...btn, background: NAVY }}>
            <option value="story">Історії</option>
            <option value="balabony">Серії «Балабони»</option>
            <option value="tysha">«Тиша»</option>
            <option value="all">Усе</option>
          </select>
          <select value={only} onChange={e => setOnly(e.target.value as 'all' | 'unset')} style={{ ...btn, background: NAVY }}>
            <option value="all">Усі обкладинки</option>
            <option value="unset">Тільки неналаштовані</option>
          </select>
          <span style={{ fontSize: 12.5, color: MUTED }}>
            {loading ? 'Завантаження…' : `Показано ${rows.length} із ${total}`}
          </span>
        </div>

        {err && (
          <div style={{ border: '1px solid rgba(255,139,139,0.5)', background: 'rgba(255,139,139,0.12)', color: '#ffb3b3', borderRadius: 10, padding: '12px 14px', fontSize: 13, marginBottom: 16 }}>
            {err}
          </div>
        )}

        {!loading && rows.length === 0 && !err && (
          <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', color: MUTED, fontSize: 13.5 }}>
            За цим запитом нічого немає. Спробуйте інший фільтр або порожній пошук.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(275px, 100%), 1fr))', gap: 16 }}>
          {rows.map(row => {
            const f = parseFrame(row.cover_position)
            const tuned = Boolean(row.cover_position && row.cover_position !== 'center')
            return (
              <button
                key={row.id}
                onClick={() => open(row)}
                style={{
                  textAlign: 'left', background: NAVY, border: `1px solid ${active?.id === row.id ? GOLD : LINE}`,
                  borderRadius: 12, padding: 8, cursor: 'pointer', fontFamily: FONT, color: CREAM,
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: FRAME_H, overflow: 'hidden', background: '#000', borderRadius: 8 }}>
                  {row.cover_url && <img src={row.cover_url} alt="" style={frameStyle(f)} />}
                  <span style={{
                    position: 'absolute', top: 8, left: 8, fontSize: 11, fontWeight: 700,
                    padding: '3px 8px', borderRadius: 6, lineHeight: 1,
                    background: tuned ? 'rgba(125,219,160,0.16)' : 'rgba(185,198,219,0.14)',
                    color: tuned ? '#7ddba0' : MUTED,
                  }}>
                    {tuned ? 'налаштовано' : 'за замовчуванням'}
                  </span>
                </div>
                <div style={{ padding: '10px 5px 4px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{row.author_name ?? '—'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3, lineHeight: 1.35 }}>{row.title}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(4,10,20,0.82)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: NAVY, border: `1px solid ${LINE}`, borderRadius: 16, padding: 20,
              width: 'min(560px, 100%)', maxHeight: '92dvh', overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{active.author_name ?? '—'}</div>
            <div style={{ fontSize: 16, fontWeight: 800, margin: '4px 0 16px', lineHeight: 1.3 }}>{active.title}</div>

            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                position: 'relative', width: FRAME_W, height: FRAME_H, margin: '0 auto',
                overflow: 'hidden', background: '#000', borderRadius: 8,
                cursor: 'grab', touchAction: 'none', userSelect: 'none',
                boxShadow: `0 0 0 1px ${LINE}`,
              }}
            >
              {active.cover_url && <img src={active.cover_url} alt="" draggable={false} style={frameStyle(frame)} />}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: MUTED, marginTop: 8 }}>
              Тягніть фото мишею просто в рамці
            </div>

            <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12.5, color: MUTED }}>Наближення — {frame.scale}%</span>
                <input
                  type="range" min={100} max={300} step={1} value={frame.scale}
                  onChange={e => setFrame(clampFrame({ ...frame, scale: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: GOLD }}
                />
                {frame.scale === 100 && (
                  <span style={{ fontSize: 11.5, color: MUTED }}>
                    Щоб рухати кадр, спершу трохи наблизьте фото — інакше рухати нема куди.
                  </span>
                )}
              </label>
              <label style={{ display: 'grid', gap: 6, opacity: maxOffset(frame.scale) === 0 ? 0.45 : 1 }}>
                <span style={{ fontSize: 12.5, color: MUTED }}>Ліворуч / праворуч — {frame.x}%</span>
                <input
                  type="range"
                  min={-Math.round(maxOffset(frame.scale))}
                  max={Math.round(maxOffset(frame.scale))}
                  step={1}
                  value={frame.x}
                  disabled={maxOffset(frame.scale) === 0}
                  onChange={e => setFrame(clampFrame({ ...frame, x: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: GOLD }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6, opacity: maxOffset(frame.scale) === 0 ? 0.45 : 1 }}>
                <span style={{ fontSize: 12.5, color: MUTED }}>Вгору / вниз — {frame.y}%</span>
                <input
                  type="range"
                  min={-Math.round(maxOffset(frame.scale))}
                  max={Math.round(maxOffset(frame.scale))}
                  step={1}
                  value={frame.y}
                  disabled={maxOffset(frame.scale) === 0}
                  onChange={e => setFrame(clampFrame({ ...frame, y: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: GOLD }}
                />
              </label>
            </div>

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${LINE}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Замінити фото</div>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, margin: '0 0 10px' }}>
                Якщо знімок не пасує до історії. Нове фото стає обкладинкою одразу,
                кадр скидається на початковий. Попереднє фото лишається в сховищі.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPickFile}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{ ...btn, opacity: uploading ? 0.6 : 1 }}
                >
                  {uploading ? 'Завантажую…' : 'Вибрати файл'}
                </button>
                <span style={{ fontSize: 12, color: MUTED }}>JPG, PNG або WebP, до 8 МБ</span>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="або посилання на зображення"
                  disabled={uploading}
                  style={{ ...btn, flex: '1 1 240px', cursor: 'text' }}
                />
                <button onClick={onUseUrl} disabled={uploading || !urlInput.trim()} style={{ ...btn, opacity: uploading || !urlInput.trim() ? 0.5 : 1 }}>
                  Взяти
                </button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: MUTED, marginTop: 14, fontFamily: 'monospace' }}>
              {frameToValue(frame)}
            </div>

            {note && (
              <div style={{ marginTop: 12, fontSize: 13, color: (note === 'Збережено' || note === 'Фото замінено') ? '#7ddba0' : '#ffb3b3' }}>
                {note}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <button onClick={save} disabled={saving} style={{ ...btnMain, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Зберігаю…' : 'Зберегти кадр'}
              </button>
              <button onClick={() => setFrame(DEFAULT_FRAME)} style={btn}>Скинути</button>
              {active.slug && (
                <a
                  href={`https://balabony.com/stories/${active.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...btn, textDecoration: 'none', display: 'inline-block' }}
                >
                  Відкрити на сайті
                </a>
              )}
              <button onClick={() => setActive(null)} style={{ ...btn, marginLeft: 'auto' }}>Закрити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
