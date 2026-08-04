'use client'

import { useEffect, useMemo, useState } from 'react'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'

type NameRow = { author_name: string; stories: string; consent: string | null }

/** Підпис і колір для стану згоди на публікацію в Балабонах. */
function consentBadge(status: string | null): { text: string; color: string; bg: string } {
  if (status === 'given')    return { text: 'згода є',            color: '#7ddba0', bg: 'rgba(125,219,160,0.12)' }
  if (status === 'refused')  return { text: 'згоду не надано',    color: '#ff8b8b', bg: 'rgba(255,139,139,0.14)' }
  if (status === 'revoked')  return { text: 'згоду відкликано',   color: '#ff8b8b', bg: 'rgba(255,139,139,0.14)' }
  if (status === 'pending')  return { text: 'згода очікується',   color: '#f0c674', bg: 'rgba(240,198,116,0.12)' }
  return { text: 'згоди не зафіксовано', color: '#b9c6db', bg: 'rgba(185,198,219,0.10)' }
}

const isBlocked = (status: string | null): boolean =>
  status === 'refused' || status === 'revoked'
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
  const [query, setQuery] = useState('')

  // Імен у списку понад сотня, і сортовані вони за кількістю історій — тож
  // потрібне ім'я може лежати в самому низу. Порівнюємо без регістру й без
  // апострофів: у базі вони трапляються і як ʼ, і як ', і як ’, а людина
  // набирає той, що є на її клавіатурі.
  const normalize = (t: string): string =>
    t.toLowerCase().replace(/[ʼ'’`]/g, '').trim()

  const visible = useMemo(() => {
    const q = normalize(query)
    if (!q) return names
    return names.filter((n) => normalize(n.author_name).includes(q))
  }, [names, query])

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
    const row = names.find((n) => n.author_name === authorName)
    const count = row?.stories ?? '?'
    if (isBlocked(row?.consent ?? null)) {
      setErr(
        `«${authorName}» — згоди на публікацію в Балабонах немає. Привʼязка заблокована.`
      )
      return
    }
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

        {!loading && names.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук за іменем — почніть друкувати"
              style={{
                width: '100%',
                background: NAVY,
                color: CREAM,
                border: `1px solid ${LINE}`,
                borderRadius: 8,
                padding: '11px 14px',
                fontSize: 15.5,
                fontFamily: FONT,
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: 13.5, color: MUTED, margin: '8px 2px 0' }}>
              {query
                ? `Знайдено: ${visible.length} з ${names.length}`
                : `Усього імен: ${names.length}`}
            </p>
          </div>
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

        {!loading && names.length > 0 && visible.length === 0 && (
          <div style={card}>
            <p style={{ fontSize: 15, color: CREAM, margin: 0 }}>
              За запитом «{query}» нічого не знайшлося. Спробуйте частину імені або
              лише прізвище.
            </p>
          </div>
        )}

        {!loading &&
          names.length > 0 &&
          profiles.length > 0 &&
          visible.map((n) => (
            <div key={n.author_name} style={{ ...card, marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: CREAM }}>
                {n.author_name}
              </div>
              <div style={{ fontSize: 14, color: MUTED, margin: '4px 0 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span>
                  історій: <strong style={{ color: GOLD }}>{n.stories}</strong>
                </span>
                <span
                  style={{
                    fontSize: 12, fontWeight: 700, borderRadius: 999,
                    padding: '3px 10px',
                    color: consentBadge(n.consent).color,
                    background: consentBadge(n.consent).bg,
                  }}
                >
                  {consentBadge(n.consent).text}
                </span>
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
                  disabled={busy === n.author_name || isBlocked(n.consent)}
                  title={isBlocked(n.consent) ? 'Згоди на публікацію в Балабонах немає' : undefined}
                  style={{
                    background: isBlocked(n.consent) ? 'rgba(255,139,139,0.15)' : GOLD,
                    color: isBlocked(n.consent) ? '#ff8b8b' : NAVY_DEEP,
                    border: isBlocked(n.consent) ? '1px solid rgba(255,139,139,0.4)' : 'none',
                    borderRadius: 8,
                    padding: '9px 20px',
                    fontSize: 14.5,
                    fontWeight: 700,
                    fontFamily: FONT,
                    cursor: busy === n.author_name || isBlocked(n.consent) ? 'not-allowed' : 'pointer',
                    opacity: busy === n.author_name ? 0.5 : 1,
                  }}
                >
                  {isBlocked(n.consent)
                    ? 'Заблоковано'
                    : busy === n.author_name
                      ? 'Привʼязую…'
                      : 'Привʼязати'}
                </button>
              </div>
            </div>
          ))}
      </div>
    </main>
  )
}
