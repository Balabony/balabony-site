'use client'

import { useRef, useState } from 'react'

// 05.11.2026 (скарги авторів): фото з телефона часто 5–12 МБ, а сервер (Vercel) приймає
// до 4,5 МБ — завантаження падало з «Немає звʼязку». Стискаємо в браузері до JPEG ≤2000 px.
async function shrinkImage(file: File): Promise<File> {
  const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (okType && file.size <= 2 * 1024 * 1024) return file
  let bmp: ImageBitmap
  try {
    bmp = await createImageBitmap(file)
  } catch {
    throw new Error('Не вдалося відкрити фото. Збережіть його як JPG і спробуйте ще раз.')
  }
  const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k)
  c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88))
  if (!blob) throw new Error('Не вдалося стиснути фото. Спробуйте інше зображення.')
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}

/**
 * Заміна обкладинки твору в кабінеті автора.
 *
 * Згорнутий стан — це просто «Змінити фото»: у кабінеті десятки творів,
 * і розгорнута форма під кожним перетворила б список на полотно.
 *
 * Галочка про права стоїть перед кнопкою, а не після: автор має прочитати
 * її до того, як завантажив, а не дізнатися постфактум.
 */

const BRAND = {
  amber: '#ef9f27',
  ink: '#f5f0e8',
  text: '#e8eef7',
  muted: '#b9c6db',
  line: 'rgba(143,163,196,0.22)',
}

export default function AuthorCoverUpload({
  contentId,
  initialCover,
}: {
  contentId: string
  initialCover?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [cover, setCover] = useState<string | null>(initialCover ?? null)
  const [rights, setRights] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const upload = async () => {
    const file = inputRef.current?.files?.[0]
    setErr(null)
    setMsg(null)

    if (!file) {
      setErr('Виберіть файл')
      return
    }
    if (!rights) {
      setErr('Підтвердіть права на зображення')
      return
    }

    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('content_id', contentId)
      fd.append('file', await shrinkImage(file))
      fd.append('rights_confirmed', 'yes')

      const res = await fetch('/api/author/cover', { method: 'POST', body: fd })
      const d = (await res.json()) as { ok?: boolean; cover_url?: string; error?: string }

      if (d?.ok && d.cover_url) {
        setCover(d.cover_url)
        setMsg('Обкладинку оновлено')
        if (inputRef.current) inputRef.current.value = ''
        setRights(false)
      } else {
        setErr(d?.error ?? 'Не вдалося завантажити')
      }
    } catch (e) {
      setErr(e instanceof Error && e.message.startsWith('Не вдалося') ? e.message : 'Немає звʼязку з сервером')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            // У кабінеті таких карток сотні (у Богдана 206), а на екрані
            // видно три-чотири. Без lazy браузер тягнув усі обкладинки
            // одразу при відкритті сторінки. width/height атрибутами, а не
            // лише в style: браузер резервує місце до завантаження.
            loading="lazy"
            decoding="async"
            width={44}
            height={44}
            style={{
              width: 44,
              height: 44,
              objectFit: 'cover',
              borderRadius: 8,
              border: `1px solid ${BRAND.line}`,
            }}
          />
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: BRAND.amber,
            background: 'none',
            border: '1px solid rgba(239,159,39,0.45)',
            borderRadius: 8,
            padding: '7px 13px',
            cursor: 'pointer',
            minHeight: 36,
          }}
        >
          {open ? 'Згорнути' : cover ? 'Змінити фото' : 'Додати фото'}
        </button>

        {msg && (
          <span style={{ fontSize: '0.82rem', color: '#7ddca4', fontWeight: 600 }}>{msg}</span>
        )}
      </div>

      {open && (
        <div
          style={{
            marginTop: 10,
            padding: '12px 14px',
            border: `1px solid ${BRAND.line}`,
            borderRadius: 10,
            background: 'rgba(143,163,196,0.07)',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ color: BRAND.text, fontSize: '0.85rem', maxWidth: '100%' }}
          />

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              margin: '12px 0',
              fontSize: '0.82rem',
              lineHeight: 1.55,
              color: BRAND.muted,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={rights}
              onChange={(e) => setRights(e.target.checked)}
              style={{ marginTop: 3, flexShrink: 0 }}
            />
            <span>
              Це моє зображення або я маю право його публікувати. Я розумію, що за
              чуже фото відповідаю особисто.
            </span>
          </label>

          <button
            type="button"
            onClick={upload}
            disabled={busy}
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#0a1628',
              background: BRAND.amber,
              border: 'none',
              borderRadius: 8,
              padding: '9px 16px',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
              minHeight: 38,
            }}
          >
            {busy ? 'Завантаження…' : 'Зберегти обкладинку'}
          </button>

          {err && (
            <div style={{ marginTop: 9, fontSize: '0.82rem', color: '#ff9d9d', fontWeight: 600 }}>
              {err}
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: '0.76rem', color: BRAND.muted, lineHeight: 1.55 }}>
            JPG, PNG, WebP або фото з телефона. Велике фото зменшиться автоматично.
            Нова обкладинка зʼявляється на сайті одразу.
          </div>
        </div>
      )}
    </div>
  )
}
