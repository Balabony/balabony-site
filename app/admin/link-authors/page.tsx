'use client'

import { useEffect, useState } from 'react'

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
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/link-authors', { cache: 'no-store' })
      const data = (await res.json()) as {
        ok: boolean
        error?: string
        names?: NameRow[]
        profiles?: ProfileRow[]
      }
      if (!data.ok) {
        setNote(data.error ?? 'Не вдалося завантажити список')
        return
      }
      setNames(data.names ?? [])
      setProfiles(data.profiles ?? [])
    } catch {
      setNote('Немає зв’язку з сервером')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function label(p: ProfileRow): string {
    const main = p.display_name ?? p.email ?? p.user_id.slice(0, 8)
    return p.pen_name ? `${main} (${p.pen_name})` : main
  }

  async function link(authorName: string) {
    const userId = chosen[authorName]
    if (!userId) {
      setNote(`Оберіть профіль для «${authorName}»`)
      return
    }
    const prof = profiles.find((p) => p.user_id === userId)
    const count = names.find((n) => n.author_name === authorName)?.stories ?? '?'
    const ok = window.confirm(
      `Прив’язати ${count} історій імені «${authorName}» до профілю ${prof ? label(prof) : userId}?`
    )
    if (!ok) return

    setBusy(authorName)
    setNote('')
    try {
      const res = await fetch('/api/admin/link-authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: authorName, user_id: userId }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string; linked?: number }
      if (!data.ok) {
        setNote(data.error ?? 'Прив’язати не вдалося')
        return
      }
      setNote(`Прив’язано історій: ${data.linked ?? 0} — «${authorName}»`)
      await load()
    } catch {
      setNote('Немає зв’язку з сервером')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1524] px-4 py-10 text-slate-200">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-wide text-amber-400">
          Прив’язка авторів
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Історії з архіву мають ім’я автора, але не прив’язані до акаунта — тому автор
          не бачить їх у кабінеті. Оберіть профіль і прив’яжіть. Один профіль можна
          прив’язати до кількох імен, якщо автор писав під псевдонімами.
        </p>

        {note && (
          <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {note}
          </div>
        )}

        {loading && <p className="mt-8 text-slate-400">Завантажую…</p>}

        {!loading && profiles.length === 0 && (
          <div className="mt-8 rounded-xl border border-white/10 bg-[#132238] p-6 text-slate-300">
            Авторських профілів ще немає. Прив’язувати можна буде після того, як автори
            зареєструють кабінети.
          </div>
        )}

        {!loading && names.length === 0 && (
          <div className="mt-8 rounded-xl border border-white/10 bg-[#132238] p-6 text-slate-300">
            Непов’язаних історій немає — усі мають автора.
          </div>
        )}

        {!loading && names.length > 0 && profiles.length > 0 && (
          <ul className="mt-8 space-y-3">
            {names.map((n) => (
              <li
                key={n.author_name}
                className="rounded-xl border border-white/10 bg-[#132238] p-4 sm:flex sm:items-center sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg text-slate-100">{n.author_name}</div>
                  <div className="text-sm text-slate-400">
                    історій: <span className="text-amber-400">{n.stories}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 sm:mt-0">
                  <select
                    value={chosen[n.author_name] ?? ''}
                    onChange={(e) =>
                      setChosen((prev) => ({ ...prev, [n.author_name]: e.target.value }))
                    }
                    className="max-w-[15rem] flex-1 rounded-lg border border-white/15 bg-[#0b1524] px-3 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
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
                    className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-[#0b1524] transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-50"
                  >
                    {busy === n.author_name ? 'Прив’язую…' : 'Прив’язати'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
