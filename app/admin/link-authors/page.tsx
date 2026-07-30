'use client'

import { useEffect, useState } from 'react'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'

type NameRow = { author_name: string; stories: string }
type ProfileRow = {
  user_id: string
  display_name: string | null
  pen_name: string | null
  email: string | null
}

export default function LinkAuthorsPage() {
  const [names, setNames] = useState<NameRow[]>([])
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [chosen, setChosen] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/link-authors', { cache: 'no-store' })
      const d = (await res.json()) as {
        ok: boolean
        error?: string
        names?: NameRow[]
        profiles?: ProfileRow[]
      }
      if (!d.ok) {
        setErr(d.error ?? 'Не вдалося завантажити список')
        return
      }
      setNames(d.names ?? [])
      setProfiles(d.profiles ?? [])
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const label = (p: ProfileRow): string => {
    const main = p.display_name ?? p.email ?? p.user_id.slice(0, 8)
    return p.pen_name ? `${main} (${p.pen_name})` : main
  }

  const link = async (authorName: string) => {
    const userId = chosen[authorName]
    setErr('')
    setNote('')
    if (!userId) {
      setErr(`Оберіть профіль для «${authorName}»`)
      return
    }
    const prof = profiles.find((p) => p.user_id === userId)
    const count = names.find((n) => n.author_name === authorName)?.stories ?? '?'
    if (
      !window.confirm(
        `Привʼязати ${count} історій імені «${authorName}» до профілю ${
          prof ? label(prof) : userId
        }?`
      )
    ) {
      return
    }

    setBusy(authorName)
    try {
      const res = await fetch('/api/admin/link-authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: authorName, user_id: userId }),
      })
      const d = (await res.json()) as { ok: boolean; error?: string; linked?: number }
      if (!d.ok) {
        setErr(d.error ?? 'Привʼязати не вдалося')
        return
      }
      setNote(`«${authorName}» — привʼязано історій: ${d.linked ?? 0}`)
      await load()
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setBusy(null)
    }
  }

  const card = {
    background: NAVY,
    border: `1px solid ${LINE}`,
    borderRadius: 12,
    padding: 20,
  } as const

  return (
    <main
      style={{
        background: NAVY_DEEP,
        padding: '36px 20px 72px',
        fontFamily: FONT,
        color: CREAM,
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>
          Привʼязка авторів
        </h1>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, margin: '0 0 24px' }}>
          Історії з архіву мають імʼя автора, але не привʼязані до акаунта — тому автор
          не бачить їх у кабінеті. Оберіть профіль і привʼяжіть. Один профіль можна
          привʼязати до кількох імен, якщо автор писав під псевдонімами.
        </p>

        {err && (
          <p
            style={{
              color: GOLD,
              fontWeight: 700,
              fontSize: 14.5,
              margin: '0 0 16px',
            }}
          >
            {err}
          </p>
        )}
        {note && (
          <p style={{ color: CREAM, fontSize: 14.5, margin: '0 0 16px' }}>{note}</p>
        )}

        {loading && <p style={{ color: MUTED, fontSize: 15 }}>Завантажую…</p>}

        {!loading && profiles.length === 0 && (
          <div style={card}>
            <p style={{ fontSize: 15, color: CREAM, margin: 0 }}>
              Авторських профілів ще немає. Привʼязувати можна буде після того, як
              автори зареєструють кабінети.
            </p>
          </div>
        )}

        {!loading && names.length === 0 && (
          <div style={card}>
            <p style={{ fontSize: 15, color: CREAM, margin: 0 }}>
              Непривʼязаних історій немає — усі мають автора.
            </p>
          </div>
        )}

        {!loading &&
          names.length > 0 &&
          profiles.length > 0 &&
          names.map((n) => (
            <div key={n.author_name} style={{ ...card, marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: CREAM }}>
                {n.author_name}
              </div>
              <div style={{ fontSize: 14, color: MUTED, margin: '4px 0 14px' }}>
                історій: <strong style={{ color: GOLD }}>{n.stories}</strong>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <select
                  value={chosen[n.author_name] ?? ''}
                  onChange={(e) =>
                    setChosen((prev) => ({ ...prev, [n.author_name]: e.target.value }))
                  }
                  style={{
                    flex: '1 1 240px',
                    background: NAVY_DEEP,
                    color: CREAM,
                    border: `1px solid ${LINE}`,
                    borderRadius: 8,
                    padding: '9px 12px',
                    fontSize: 14.5,
                    fontFamily: FONT,
                  }}
                >
                  <option value="">— профіль —</option>
                  {profiles.map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {label(p)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => void link(n.author_name)}
                  disabled={busy === n.author_name}
                  style={{
                    background: GOLD,
                    color: NAVY_DEEP,
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 20px',
                    fontSize: 14.5,
                    fontWeight: 700,
                    fontFamily: FONT,
                    cursor: busy === n.author_name ? 'default' : 'pointer',
                    opacity: busy === n.author_name ? 0.5 : 1,
                  }}
                >
                  {busy === n.author_name ? 'Привʼязую…' : 'Привʼязати'}
                </button>
              </div>
            </div>
          ))}
      </div>
    </main>
  )
}
