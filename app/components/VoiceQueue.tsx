'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Черга на озвучення: список творів і кнопка «Віддати голос».
 *
 * Голос коштує бали, тому кнопка ніколи не спрацьовує «тихо»: людина бачить
 * і ціну до натискання, і новий баланс після. Якщо балів не вистачає, кнопка
 * не ховається, а пояснює, скільки бракує — інакше читач вирішить, що зламано.
 */

const GOLD = '#ef9f27'
const CREAM = '#f5f0e8'
const TEXT = '#dbe4f0'
const MUTED = '#8899bb'
const CARD = '#0f1e3a'
const LINE = 'rgba(143,163,196,0.22)'

interface Row {
  id: string
  title: string
  slug: string | null
  type: string
  author_name: string | null
  votes: number
}

export default function VoiceQueue({ cost }: { cost: number }) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [balance, setBalance] = useState(0)
  const [queue, setQueue] = useState<Row[]>([])
  const [authors, setAuthors] = useState<{ author_name: string; works: number }[]>([])
  const [picked, setPicked] = useState('')
  const [works, setWorks] = useState<Row[]>([])
  const [loadingWorks, setLoadingWorks] = useState(false)
  const [mine, setMine] = useState<string[]>([])
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/voice-vote')
      const d = await r.json() as {
        authorized?: boolean; balance?: number
        queue?: Row[]; authors?: { author_name: string; works: number }[]; mine?: string[]
      }
      setAuthorized(Boolean(d.authorized))
      setBalance(d.balance ?? 0)
      setQueue(d.queue ?? [])
      setAuthors(d.authors ?? [])
      setMine(d.mine ?? [])
    } catch {
      setNote('Не вдалося завантажити чергу.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Твори обраного автора вантажимо окремим запитом: у каталозі 510 творів,
  // віддавати їх усі одним списком на телефон немає сенсу.
  const loadWorks = useCallback(async (name: string) => {
    if (!name) { setWorks([]); return }
    setLoadingWorks(true)
    try {
      const r = await fetch(`/api/voice-vote?author=${encodeURIComponent(name)}`)
      const d = await r.json() as { works?: Row[]; mine?: string[] }
      setWorks(d.works ?? [])
      if (d.mine) setMine(d.mine)
    } catch {
      setNote('Не вдалося завантажити твори автора.')
    } finally {
      setLoadingWorks(false)
    }
  }, [])

  const vote = async (id: string) => {
    setBusy(id); setNote('')
    try {
      const r = await fetch('/api/voice-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: id }),
      })
      const d = await r.json() as { ok?: boolean; error?: string; balance?: number }
      if (!d.ok) { setNote(d.error ?? 'Не вдалося зарахувати голос.'); return }
      setBalance(d.balance ?? balance - cost)
      await load()
      if (picked) await loadWorks(picked)
    } catch {
      setNote('Не вдалося звʼязатися з сайтом.')
    } finally {
      setBusy('')
    }
  }

  if (loading) return <p style={{ color: MUTED }}>Завантажуємо…</p>

  const card: React.CSSProperties = {
    background: CARD, border: `1px solid ${LINE}`, borderRadius: 12,
    padding: '14px 16px', marginBottom: 10,
  }

  // Шлях залежить від типу: серіали живуть не в /stories. Раніше посилання
  // вело в /stories/<slug> для всього підряд і на серіалах давало 404.
  const workPath = (r: Row) => {
    if (!r.slug) return null
    if (r.type === 'balabony') return `/episodes/${r.slug}`
    if (r.type === 'tysha') return `/tysha/${r.slug}`
    return `/stories/${r.slug}`
  }

  const renderRow = (r: Row, place?: number) => {
    const voted = mine.includes(r.id)
    const enough = balance >= cost
    return (
      <div key={r.id} style={card}>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: '1 1 240px' }}>
            <div style={{ color: CREAM, fontWeight: 600 }}>
              {place ? `${place}. ` : ''}
              {workPath(r)
                ? <a href={workPath(r) as string} style={{ color: CREAM }}>{r.title}</a>
                : r.title}
            </div>
            {r.author_name && (
              <div style={{ color: MUTED, fontSize: '0.85rem', marginTop: 2 }}>{r.author_name}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ color: GOLD, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {r.votes} {r.votes === 1 ? 'голос' : r.votes >= 2 && r.votes <= 4 ? 'голоси' : 'голосів'}
            </div>
            {voted ? (
              <span style={{ color: MUTED, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>ваш голос тут</span>
            ) : (
              <button
                type="button"
                disabled={!authorized || !enough || busy === r.id}
                onClick={() => void vote(r.id)}
                title={!authorized ? 'Увійдіть, щоб голосувати' : !enough ? `Потрібно ${cost} балів` : ''}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: authorized && enough ? GOLD : 'rgba(239,159,39,0.25)',
                  color: authorized && enough ? '#0a1628' : '#8899bb',
                  fontWeight: 700, fontSize: '0.88rem',
                  cursor: authorized && enough ? 'pointer' : 'default',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                {busy === r.id ? '…' : `Голос · ${cost}`}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        ...card,
        background: 'rgba(239,159,39,0.08)', borderColor: 'rgba(239,159,39,0.4)',
        marginBottom: 20,
      }}>
        {authorized ? (
          <span style={{ color: TEXT }}>
            У вас <strong style={{ color: GOLD }}>{balance}</strong> балів. Один голос коштує {cost}.
            {balance < cost && (
              <>
                {' '}Найшвидший спосіб набрати —{' '}
                <a href="/profile" style={{ color: GOLD }}>покликати друга</a>:
                це одразу {cost} балів, тобто цілий голос.
              </>
            )}
          </span>
        ) : (
          <span style={{ color: TEXT }}>
            Щоб голосувати, <a href="/login" style={{ color: GOLD }}>увійдіть у кабінет</a>.
            Бали нараховуються за прочитані серії, відгуки й запрошених друзів.
          </span>
        )}
      </div>

      {note && (
        <p style={{
          color: '#FAC775', background: 'rgba(239,159,39,0.08)',
          padding: '10px 12px', borderRadius: 8, lineHeight: 1.6,
        }}>{note}</p>
      )}

      {queue.length > 0 && (
        <>
          <h2 style={{ color: GOLD, fontSize: '1.2rem', margin: '0 0 12px' }}>Черга зараз</h2>
          {queue.map((r, i) => renderRow(r, i + 1))}
        </>
      )}

      <h2 style={{ color: GOLD, fontSize: '1.2rem', margin: '28px 0 12px' }}>
        Знайти твір
      </h2>
      <p style={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 10px' }}>
        Оберіть автора — і побачите всі його історії, які ще не озвучені.
      </p>
      <select
        value={picked}
        onChange={e => { setPicked(e.target.value); void loadWorks(e.target.value) }}
        style={{
          width: '100%', padding: '11px 12px', borderRadius: 9, marginBottom: 16,
          border: `1px solid ${LINE}`, background: '#0a1628', color: CREAM,
          fontSize: 16, fontFamily: 'inherit', outline: 'none',
        }}
      >
        <option value="">— оберіть автора —</option>
        {authors.map(a => (
          <option key={a.author_name} value={a.author_name}>
            {a.author_name} ({a.works})
          </option>
        ))}
      </select>

      {loadingWorks && <p style={{ color: MUTED }}>Завантажуємо…</p>}
      {!loadingWorks && works.map(r => renderRow(r))}
    </div>
  )
}
