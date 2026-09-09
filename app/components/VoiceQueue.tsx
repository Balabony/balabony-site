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
  const [candidates, setCandidates] = useState<Row[]>([])
  const [mine, setMine] = useState<string[]>([])
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/voice-vote')
      const d = await r.json() as {
        authorized?: boolean; balance?: number
        queue?: Row[]; candidates?: Row[]; mine?: string[]
      }
      setAuthorized(Boolean(d.authorized))
      setBalance(d.balance ?? 0)
      setQueue(d.queue ?? [])
      setCandidates(d.candidates ?? [])
      setMine(d.mine ?? [])
    } catch {
      setNote('Не вдалося завантажити чергу.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

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

  const renderRow = (r: Row, place?: number) => {
    const voted = mine.includes(r.id)
    const enough = balance >= cost
    return (
      <div key={r.id} style={card}>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: '1 1 240px' }}>
            <div style={{ color: CREAM, fontWeight: 600 }}>
              {place ? `${place}. ` : ''}
              {r.slug
                ? <a href={`/stories/${r.slug}`} style={{ color: CREAM }}>{r.title}</a>
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
        {queue.length > 0 ? 'Інші твори' : 'За що можна проголосувати'}
      </h2>
      {candidates
        .filter(c => !queue.some(q => q.id === c.id))
        .map(r => renderRow(r))}
    </div>
  )
}
