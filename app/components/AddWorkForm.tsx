'use client'

import { useState } from 'react'
import { GENRE_OPTIONS } from '@/lib/genres'
import AuthorCoverUpload from './AuthorCoverUpload'

/**
 * «Додати свою історію» в кабінеті автора.
 *
 * Автори питали, чи можна залити старі твори. До 09.09.2026 відповіді не було:
 * редагувати наявний твір і додати обкладинку автор міг, а завести новий — ні.
 *
 * Форма згорнута за замовчуванням: у кабінеті й так багато блоків, а додавання
 * твору — дія рідка. Розгорнутий вигляд свідомо простий: назва, жанр, текст.
 * Обкладинка й публікація — наступним кроком, наявними кнопками біля твору,
 * інакше довелося б робити другу реалізацію завантаження файлів.
 */

const AMBER = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

const field: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: FONT,
  fontSize: '0.92rem',
  color: '#1c1917',
  background: '#f6f1e7',
  border: '1px solid rgba(143,163,196,0.45)',
  borderRadius: 8,
  padding: '9px 11px',
  marginTop: 6,
}

const label: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#8fa3c4',
  fontFamily: FONT,
  display: 'block',
  marginTop: 12,
}

export default function AddWorkForm() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // id щойно створеної історії — щоб одразу тут запропонувати обкладинку,
  // а не відсилати автора шукати твір у переліку внизу сторінки.
  const [newId, setNewId] = useState('')

  async function submit() {
    if (busy) return
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/author/new-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, genre, text }),
      })
      const d = (await res.json()) as { ok?: boolean; error?: string; id?: string }
      if (d?.ok && d.id) {
        setNewId(d.id)
      } else {
        setError(d?.error ?? 'Не вдалося зберегти. Спробуйте ще раз.')
      }
    } catch {
      setError('Не вдалося зберегти. Перевірте зв’язок і спробуйте ще раз.')
    } finally {
      setBusy(false)
    }
  }

  if (newId) {
    return (
      <div style={{
        marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: 12,
        background: 'rgba(239,159,39,0.10)', border: '1px solid rgba(239,159,39,0.4)',
        fontFamily: FONT,
      }}>
        <div style={{ color: '#f5f0e8', fontWeight: 700, marginBottom: 6 }}>
          «{title}» збережено як чернетку
        </div>
        <div style={{ color: '#e8eef7', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 6 }}>
          Тепер додайте обкладинку — історія з обкладинкою помітніша в списку.
          Коли все влаштує, натисніть «Опублікувати» біля твору в переліку нижче.
          Доти його не бачить ніхто, крім вас.
        </div>

        {/* Про формати нічого не пишемо: AuthorCoverUpload має власний рядок
            «JPG, PNG або WebP, до 8 МБ», і два однакові пояснення поспіль
            виглядали як помилка. */}
        {/* Той самий компонент, що й біля кожного твору в переліку: другої
            реалізації завантаження файлу не заводимо. */}
        <AuthorCoverUpload contentId={newId} initialCover={null} />

        {/* Перелік творів нижче — серверний, він відрендерився до створення
            цієї історії й сам її не покаже. Тому обидві кнопки перезавантажують
            сторінку: інакше автор бачить «збережено», гортає вниз і не знаходить
            свого твору. */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              fontFamily: FONT, fontSize: '0.9rem', fontWeight: 700,
              color: '#0a1628', background: AMBER, border: 'none',
              borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
            }}
          >
            Готово — показати мої твори
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              fontFamily: FONT, fontSize: '0.88rem', fontWeight: 700, color: AMBER,
              background: 'transparent', border: '1px solid rgba(239,159,39,0.45)',
              borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
            }}
          >
            Додати ще одну історію
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: 12,
      background: 'rgba(143,163,196,0.10)', border: '1px solid rgba(143,163,196,0.35)',
      fontFamily: FONT,
    }}>
      <div style={{ color: '#f5f0e8', fontWeight: 700, marginBottom: 6 }}>
        Додати свою історію
      </div>
      <div style={{ color: '#e8eef7', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Маєте раніше написані твори? Додайте їх самі — редакція нічого не переписує.
        Історія збережеться як чернетка, і ви самі вирішите, коли її опублікувати.
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            marginTop: 12, fontFamily: FONT, fontSize: '0.9rem', fontWeight: 700,
            color: '#0a1628', background: AMBER, border: 'none',
            borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
          }}
        >
          Додати історію
        </button>
      ) : (
        <div style={{ marginTop: 8 }}>
          <label style={label}>
            Назва
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Як називається ваша історія"
              style={field}
            />
          </label>

          <label style={label}>
            Жанр
            <select value={genre} onChange={e => setGenre(e.target.value)} style={field}>
              <option value="">— виберіть —</option>
              {GENRE_OPTIONS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>

          <label style={label}>
            Текст
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={12}
              placeholder="Вставте текст історії"
              style={{ ...field, resize: 'vertical', lineHeight: 1.6 }}
            />
          </label>

          <div style={{ fontSize: '0.8rem', color: '#8fa3c4', marginTop: 6 }}>
            {text.trim().length > 0
              ? `Знаків: ${text.trim().length}`
              : 'Текст можна вставити з Word — розмітка не потрібна, абзаци збережуться.'}
          </div>

          {error && (
            <div style={{
              marginTop: 12, fontSize: '0.88rem', color: AMBER,
              background: 'rgba(239,159,39,0.12)', border: '1px solid rgba(239,159,39,0.35)',
              borderRadius: 8, padding: '8px 12px', lineHeight: 1.6,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              style={{
                fontFamily: FONT, fontSize: '0.9rem', fontWeight: 700,
                color: '#0a1628', background: AMBER, border: 'none',
                borderRadius: 8, padding: '9px 16px',
                cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? 'Зберігаємо…' : 'Зберегти як чернетку'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                fontFamily: FONT, fontSize: '0.9rem', fontWeight: 600, color: '#8fa3c4',
                background: 'transparent', border: '1px solid rgba(143,163,196,0.35)',
                borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
              }}
            >
              Скасувати
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
