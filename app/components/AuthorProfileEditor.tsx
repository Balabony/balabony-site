'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Фото і біографія автора — блок у кабінеті.
 *
 * Досі і те, й інше заводила редакція вручну. На двох десятках авторів це
 * означало, що сторінка автора оновлюється тільки тоді, коли до цього
 * дійдуть руки Богдана.
 *
 * Фото показується одразу і одразу стає публічним — модерації немає
 * свідомо, бо черга перевірки повернула б ту саму ручну роботу.
 *
 * Повзунок «Положення кадру» зʼявився тому, що автоматична обрізка по
 * обличчю на портретах у пів зросту садила голову надто низько, а
 * виправити це в кабінеті було нічим.
 */

const BRAND = {
  amber: '#ef9f27',
  ink: '#f5f0e8',
  text: '#e8eef7',
  muted: '#b9c6db',
  line: 'rgba(143,163,196,0.22)',
  card: '#0f1e3a',
}
const SERIF = 'Georgia, "Times New Roman", serif'
const MAX_BIO = 1200

export default function AuthorProfileEditor({
  initialAvatar,
  initialBio,
  initialPosition,
  hasSource,
  displayName,
}: {
  initialAvatar?: string | null
  initialBio?: string | null
  initialPosition?: number | null
  hasSource?: boolean
  displayName: string
}) {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar ?? null)
  const [bio, setBio] = useState(initialBio ?? '')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [position, setPosition] = useState<number>(initialPosition ?? 50)
  const [preview, setPreview] = useState<string | null>(null)
  const [source, setSource] = useState<boolean>(Boolean(hasSource))
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Прев'ю живе рівно стільки, скільки вибраний файл: інакше блоб висить
  // у памʼяті до перезавантаження сторінки.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const onPick = () => {
    const file = inputRef.current?.files?.[0]
    if (preview) URL.revokeObjectURL(preview)
    setPreview(file ? URL.createObjectURL(file) : null)
    setMsg(null)
    setErr(null)
  }

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  // У прев'ю показуємо необрізаний файл із тим самим object-position, який
  // піде на сервер. Уже збережений аватар — квадрат, його зсувати нічим,
  // тому для нього прев'ю не рухається.
  const shown = preview ?? avatar
  const movable = Boolean(preview) || source

  const save = async () => {
    const file = inputRef.current?.files?.[0]
    setErr(null)
    setMsg(null)

    if (file && !consent) {
      setErr('Підтвердіть згоду на публікацію фото')
      return
    }

    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('bio', bio)
      fd.append('avatar_position', String(position))
      if (file) {
        fd.append('file', file)
        fd.append('photo_consent', 'yes')
      }

      const res = await fetch('/api/author/profile', { method: 'POST', body: fd })
      const d = (await res.json()) as {
        ok?: boolean
        avatar_url?: string | null
        avatar_position?: number | null
        error?: string
      }

      if (d?.ok) {
        if (d.avatar_url) {
          setAvatar(d.avatar_url)
          setSource(true)
        }
        if (typeof d.avatar_position === 'number') setPosition(d.avatar_position)
        if (inputRef.current) inputRef.current.value = ''
        if (preview) URL.revokeObjectURL(preview)
        setPreview(null)
        setConsent(false)
        setMsg('Збережено. Зміни вже на вашій сторінці.')
      } else {
        setErr(d?.error ?? 'Не вдалося зберегти')
      }
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        background: BRAND.card,
        border: `1px solid ${BRAND.line}`,
        borderRadius: 14,
        padding: '1.3rem 1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: '1.2rem',
          color: BRAND.ink,
          margin: '0 0 4px',
        }}
      >
        Ваша сторінка автора
      </h2>
      <p style={{ color: BRAND.muted, fontSize: '0.85rem', margin: '0 0 18px', lineHeight: 1.6 }}>
        Фото і кілька рядків про себе. Це бачать читачі, коли ви поширюєте
        посилання на свою сторінку.
      </p>

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt=""
            style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: preview ? `50% ${position}%` : '50% 50%',
              border: `2px solid ${BRAND.amber}66`,
              flexShrink: 0,
            }}
          />
        ) : (
          <span
            aria-hidden
            style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: 'rgba(239,159,39,0.14)',
              border: `1px solid ${BRAND.amber}66`,
              color: BRAND.amber,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </span>
        )}

        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPick}
            style={{ color: BRAND.text, fontSize: '0.85rem', maxWidth: '100%' }}
          />

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              margin: '12px 0 0',
              fontSize: '0.8rem',
              lineHeight: 1.55,
              color: BRAND.muted,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: 3, flexShrink: 0 }}
            />
            <span>
              Я даю згоду на публікацію цього фото на моїй сторінці автора та
              підтверджую, що маю право його використовувати.
            </span>
          </label>
        </div>
      </div>

      {/* Положення кадру. Показуємо тільки коли є що рухати: або вибрано новий
          файл, або в базі лежить оригінал попереднього. */}
      {movable && (
        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: BRAND.muted,
              marginBottom: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Положення кадру
          </label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: BRAND.muted }}>вище</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              style={{ flex: '1 1 200px', accentColor: BRAND.amber, maxWidth: 320 }}
            />
            <span style={{ fontSize: '0.78rem', color: BRAND.muted }}>нижче</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: BRAND.muted, margin: '8px 0 0', lineHeight: 1.55 }}>
            {preview
              ? 'Кружечок ліворуч показує, як обріжеться. Посуньте й натисніть «Зберегти».'
              : 'Посуньте й натисніть «Зберегти» — фото обріжеться наново з оригіналу.'}
          </p>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: BRAND.muted,
            marginBottom: 7,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          Про себе
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
          rows={4}
          placeholder="Звідки ви, про що пишете, що для вас важливо. Кілька речень."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(143,163,196,0.08)',
            border: `1px solid ${BRAND.line}`,
            borderRadius: 10,
            color: BRAND.text,
            fontSize: '0.92rem',
            lineHeight: 1.6,
            padding: '10px 12px',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: '0.75rem', color: BRAND.muted, marginTop: 5 }}>
          {bio.length} / {MAX_BIO}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#0a1628',
            background: BRAND.amber,
            border: 'none',
            borderRadius: 9,
            padding: '10px 20px',
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.7 : 1,
            minHeight: 40,
          }}
        >
          {busy ? 'Збереження…' : 'Зберегти'}
        </button>

        {msg && <span style={{ fontSize: '0.84rem', color: '#7ddca4', fontWeight: 600 }}>{msg}</span>}
        {err && <span style={{ fontSize: '0.84rem', color: '#ff9d9d', fontWeight: 600 }}>{err}</span>}
      </div>
    </div>
  )
}
