'use client'

/**
 * app/group/page.tsx — керування груповим доступом (власник).
 *
 * Показує: скільки місць зайнято, перелік учасників, поле запрошення.
 * Усе через /api/plan-group; сторінка нічого не вирішує сама.
 *
 * Свідомо БЕЗ показу учасникам одне одного: цю сторінку бачить лише власник.
 * Учасник свій доступ бачить у профілі, а перелік колег йому ні до чого —
 * і це зайві персональні дані на екрані.
 */

import { useEffect, useState, useCallback } from 'react'

const GOLD = '#ef9f27'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#8899bb'
const FONT = "'Montserrat', Arial, sans-serif"

interface Member {
  inviteId: string
  email: string
  status: 'pending' | 'accepted'
  invitedAt: string
  acceptedAt: string | null
  stale: boolean
}

interface GroupInfo {
  id: string
  kind: string
  kindLabel: string
  seats: number
  used: number
  free: number
  expiresAt: string
}

export default function GroupPage() {
  const [loading, setLoading] = useState(true)
  const [authNeeded, setAuthNeeded] = useState(false)
  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/plan-group')
      if (r.status === 401) { setAuthNeeded(true); return }
      const d = await r.json()
      setGroup(d.group ?? null)
      setMembers(d.members ?? [])
    } catch {
      setMsg({ kind: 'err', text: 'Не вдалося завантажити дані.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const invite = async () => {
    if (!email.trim() || busy) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/plan-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await r.json()
      if (d.ok) {
        setEmail('')
        setMsg({ kind: 'ok', text: d.warning ?? 'Запрошення надіслано.' })
        await load()
      } else {
        setMsg({ kind: 'err', text: d.message ?? 'Не вдалося надіслати запрошення.' })
      }
    } catch {
      setMsg({ kind: 'err', text: 'Не вдалося надіслати запрошення.' })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (m: Member) => {
    const what = m.status === 'accepted'
      ? `Прибрати ${m.email} з доступу? Людина одразу втратить доступ.`
      : `Скасувати запрошення для ${m.email}?`
    if (!confirm(what)) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/plan-group', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: m.inviteId }),
      })
      const d = await r.json()
      if (d.ok) { setMsg({ kind: 'ok', text: 'Готово. Місце звільнилося.' }); await load() }
      else setMsg({ kind: 'err', text: 'Не вдалося виконати.' })
    } catch {
      setMsg({ kind: 'err', text: 'Не вдалося виконати.' })
    } finally {
      setBusy(false)
    }
  }

  const wrap: React.CSSProperties = {
    maxWidth: 640, margin: '0 auto', padding: '28px 20px 60px',
    fontFamily: FONT, color: CREAM,
  }

  if (loading) return <main style={wrap}><p style={{ color: MUTED }}>Завантажуємо…</p></main>

  if (authNeeded) return (
    <main style={wrap}>
      <h1 style={{ fontSize: 24, color: GOLD, marginBottom: 12 }}>Груповий доступ</h1>
      <p style={{ color: MUTED, lineHeight: 1.6 }}>
        Щоб керувати доступом, увійдіть у свій обліковий запис.
      </p>
      <a href="/login" style={{ display: 'inline-block', marginTop: 16, padding: '13px 24px', background: GOLD, color: '#0a1628', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
        Увійти
      </a>
    </main>
  )

  if (!group) return (
    <main style={wrap}>
      <h1 style={{ fontSize: 24, color: GOLD, marginBottom: 12 }}>Груповий доступ</h1>
      <p style={{ color: MUTED, lineHeight: 1.6, marginBottom: 18 }}>
        У вас немає групового пакета. Сімейний доступ дає чотири місця: ви
        і ще троє, у кожного власний обліковий запис із власними закладками.
      </p>
      <a href="/peredplata" style={{ display: 'inline-block', padding: '13px 24px', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
        Подивитися тарифи →
      </a>
    </main>
  )

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 24, color: GOLD, margin: '0 0 6px' }}>{group.kindLabel}</h1>
      <p style={{ color: MUTED, fontSize: 14, margin: '0 0 22px' }}>
        Зайнято {group.used} із {group.seats} місць · діє до{' '}
        {new Date(group.expiresAt).toLocaleDateString('uk-UA')}
      </p>

      {group.free > 0 ? (
        <div style={{ background: NAVY, border: `1px solid ${GOLD}44`, borderRadius: 12, padding: 16, marginBottom: 22 }}>
          <label htmlFor="inv" style={{ display: 'block', fontSize: 13, color: MUTED, marginBottom: 8 }}>
            Пошта людини, якій відкриваєте доступ
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <input
              id="inv"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') invite() }}
              placeholder="pochta@example.com"
              style={{
                flex: '1 1 220px', minWidth: 0, padding: '12px 14px',
                borderRadius: 9, border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.04)', color: CREAM,
                fontSize: 15, fontFamily: FONT,
              }}
            />
            <button
              onClick={invite}
              disabled={busy || !email.trim()}
              style={{
                padding: '12px 22px', borderRadius: 9, border: 'none',
                background: GOLD, color: '#0a1628', fontWeight: 700,
                fontSize: 15, fontFamily: FONT,
                cursor: busy || !email.trim() ? 'default' : 'pointer',
                opacity: busy || !email.trim() ? 0.5 : 1,
              }}
            >
              Запросити
            </button>
          </div>
          <p style={{ fontSize: 12, color: MUTED, margin: '10px 0 0', lineHeight: 1.5 }}>
            Людині прийде лист із посиланням. Увійти треба саме цією поштою.
            Якщо запрошення не приймуть за сім днів — місце звільниться саме.
          </p>
        </div>
      ) : (
        <p style={{ color: MUTED, fontSize: 14, marginBottom: 22 }}>
          Усі місця зайнято. Щоб запросити нового учасника, приберіть когось із переліку.
        </p>
      )}

      {msg && (
        <p role="status" style={{
          fontSize: 14, marginBottom: 18, padding: '10px 14px', borderRadius: 9,
          background: msg.kind === 'ok' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
          color: msg.kind === 'ok' ? '#86efac' : '#fca5a5',
        }}>
          {msg.text}
        </p>
      )}

      {members.length === 0 ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Поки нікого не запрошено.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map((m) => (
            <li key={m.inviteId} style={{
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              background: NAVY, border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '12px 14px',
            }}>
              <span style={{ flex: '1 1 180px', minWidth: 0, wordBreak: 'break-all', fontSize: 15 }}>
                {m.email}
                <span style={{ display: 'block', fontSize: 12, color: MUTED, marginTop: 3 }}>
                  {m.status === 'accepted'
                    ? 'читає'
                    : m.stale
                      ? 'запрошення протухло — місце вільне'
                      : 'запрошення надіслано, чекаємо'}
                </span>
              </span>
              <button
                onClick={() => remove(m)}
                disabled={busy}
                style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: '1px solid rgba(248,113,113,0.5)', background: 'transparent',
                  color: '#fca5a5', cursor: busy ? 'default' : 'pointer', fontFamily: FONT,
                }}
              >
                {m.status === 'accepted' ? 'Прибрати' : 'Скасувати'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
