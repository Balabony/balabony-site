'use client'

import { useEffect, useRef, useState } from 'react'
import DescriptionSuggest from './DescriptionSuggest'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', Georgia, serif"

const LIMITS = { description: 160, recap: 600, next_teaser: 200, social_post: 600 } as const
type Field = keyof typeof LIMITS

type Episode = {
  id: string
  title: string
  status: string
  publish_at: string | null
  description: string | null
  recap: string | null
  next_teaser: string | null
  social_post: string | null
}

const FIELDS: { key: Field; label: string; hint: string; rows: number }[] = [
  { key: 'description', label: 'Опис серії', hint: 'Картка в стрічці, прев’ю при поширенні, пошук', rows: 3 },
  { key: 'recap', label: 'Що було раніше', hint: 'Показується на початку наступної серії. Спойлери тут доречні', rows: 4 },
  { key: 'next_teaser', label: 'Анонс наступної', hint: 'Один рядок під кнопкою «Наступна серія». Без спойлерів — тільки гачок', rows: 2 },
  { key: 'social_post', label: 'Пост для соцмереж', hint: 'Публікуєте у себе в день виходу', rows: 4 },
]

const STATUS_LABEL: Record<string, string> = {
  draft: 'Чернетка',
  review: 'На редактурі',
  humanizing: 'Обробка',
  human_review: 'Перевірка',
  approved: 'Схвалено',
  published: 'Опубліковано',
}

function dayLabel(iso: string | null): string {
  if (!iso) return 'Дата виходу ще не призначена'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Дата виходу ще не призначена'
  return 'Виходить у ' + d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function EpisodeMetaEditor({ id }: { id: string }) {
  const [ep, setEp] = useState<Episode | null>(null)
  const [vals, setVals] = useState<Record<Field, string>>({
    description: '', recap: '', next_teaser: '', social_post: '',
  })
  const [loadErr, setLoadErr] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/author/episode?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then((d: { ok: boolean; error?: string; episode?: Episode }) => {
        if (!alive) return
        if (!d.ok || !d.episode) { setLoadErr(d.error ?? 'Не вдалося завантажити'); return }
        setEp(d.episode)
        setVals({
          description: d.episode.description ?? '',
          recap: d.episode.recap ?? '',
          next_teaser: d.episode.next_teaser ?? '',
          social_post: d.episode.social_post ?? '',
        })
      })
      .catch(() => { if (alive) setLoadErr('Не вдалося завантажити') })
    return () => { alive = false }
  }, [id])

  const locked = !!ep && ep.status !== 'draft'

  const save = async (submit: boolean) => {
    setBusy(true)
    try {
      const res = await fetch('/api/author/episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...vals, submit }),
      })
      const d = (await res.json()) as { ok: boolean; error?: string }
      if (!d.ok) { setNote(d.error ?? 'Не вдалося зберегти'); return }
      if (submit) {
        setNote('Надіслано на редактуру')
        setEp(p => (p ? { ...p, status: 'review' } : p))
      } else {
        setNote(`Чернетку збережено о ${new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`)
      }
    } catch {
      setNote('Немає зв’язку — спробуйте ще раз')
    } finally {
      setBusy(false)
    }
  }

  const onChange = (f: Field, v: string) => {
    setVals(p => ({ ...p, [f]: v }))
    if (locked) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { void save(false) }, 1500)
  }

  const box: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(143,163,196,0.25)', borderRadius: 8, padding: '10px 12px',
    fontSize: 15, lineHeight: 1.6, color: CREAM, fontFamily: FONT, resize: 'vertical',
  }

  if (loadErr) {
    return <p style={{ color: '#F09595', fontFamily: FONT, fontSize: 15 }}>{loadErr}</p>
  }
  if (!ep) {
    return <p style={{ color: MUTED, fontFamily: FONT, fontSize: 15 }}>Завантажуємо…</p>
  }

  return (
    <div style={{ background: NAVY, border: `1px solid ${GOLD}47`, borderRadius: 12, padding: 20, fontFamily: FONT }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingBottom: 14, borderBottom: '1px solid rgba(143,163,196,0.2)' }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 21, color: CREAM }}>{ep.title}</div>
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 4 }}>{dayLabel(ep.publish_at)}</div>
        </div>
        <span style={{ fontSize: 12, color: locked ? MUTED : GOLD, border: `1px solid ${locked ? 'rgba(143,163,196,0.4)' : 'rgba(239,159,39,0.5)'}`, background: locked ? 'transparent' : 'rgba(239,159,39,0.12)', borderRadius: 20, padding: '5px 12px' }}>
          {locked ? (STATUS_LABEL[ep.status] ?? ep.status) : 'Редагування відкрите'}
        </span>
      </div>

      {FIELDS.map(f => {
        const len = vals[f.key].length
        const lim = LIMITS[f.key]
        const near = len > lim - 20
        return (
          <div key={f.key} style={{ marginTop: 20, paddingLeft: 14, borderLeft: `3px solid ${GOLD}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <label htmlFor={`f-${f.key}`} style={{ fontSize: 16, fontWeight: 700, color: CREAM }}>{f.label}</label>
              <span style={{ fontSize: 13, color: near ? '#FFB347' : MUTED }}>{len} / {lim}</span>
            </div>
            <div style={{ fontSize: 13.5, color: MUTED, margin: '4px 0 8px', lineHeight: 1.5 }}>{f.hint}</div>
            <textarea
              id={`f-${f.key}`}
              value={vals[f.key]}
              maxLength={lim}
              rows={f.rows}
              disabled={locked}
              onChange={e => onChange(f.key, e.target.value)}
              style={{ ...box, opacity: locked ? 0.65 : 1 }}
            />
            {f.key === 'description' && !locked && ep && (
              <DescriptionSuggest contentId={ep.id} onPick={v => onChange('description', v)} />
            )}
            {f.key === 'social_post' && vals.social_post.trim() && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(vals.social_post).then(
                    () => { setCopied(true); setTimeout(() => setCopied(false), 2000) },
                    () => setNote('Не вдалося скопіювати'),
                  )
                }}
                style={{ marginTop: 8, fontSize: 13, color: CREAM, background: 'transparent', border: '1px solid rgba(143,163,196,0.35)', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontFamily: FONT }}
              >
                {copied ? 'Скопійовано' : 'Копіювати'}
              </button>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(143,163,196,0.2)' }}>
        <div style={{ fontSize: 12, color: GOLD, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Як це виглядатиме</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          <div style={{ background: NAVY_DEEP, border: '1px solid rgba(143,163,196,0.18)', borderRadius: 8, padding: '11px 12px' }}>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' }}>Картка в стрічці</div>
            <div style={{ fontSize: 14, color: CREAM, marginTop: 6 }}>{ep.title}</div>
            <div style={{ fontSize: 13, color: '#b9c6db', marginTop: 4, lineHeight: 1.5 }}>{vals.description || '—'}</div>
          </div>
          <div style={{ background: NAVY_DEEP, borderRadius: 8, padding: '11px 12px', borderLeft: `3px solid ${GOLD}` }}>
            <div style={{ fontSize: 11, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>Що було раніше</div>
            <div style={{ fontSize: 13, color: '#d8d2c6', marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>{vals.recap || '—'}</div>
          </div>
          <div style={{ background: NAVY_DEEP, borderRadius: 8, padding: '11px 12px', border: '1px solid #FFB347' }}>
            <div style={{ fontSize: 11, color: MUTED }}>Наступна серія →</div>
            <div style={{ fontSize: 13, color: '#b9c6db', marginTop: 6, lineHeight: 1.5 }}>{vals.next_teaser || '—'}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: MUTED }}>{note || (locked ? 'Правки — через редактора' : 'Чернетка зберігається сама')}</span>
        {!locked && (
          <button
            type="button"
            disabled={busy}
            onClick={() => { void save(true) }}
            style={{ fontSize: 15, color: NAVY_DEEP, background: GOLD, border: 'none', borderRadius: 10, padding: '12px 24px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: FONT }}
          >
            {busy ? 'Надсилаємо…' : 'Надіслати на редактуру'}
          </button>
        )}
      </div>

    </div>
  )
}
