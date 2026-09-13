'use client'

/**
 * app/group/join/page.tsx — прийняття запрошення.
 *
 * Сюди веде посилання з листа. Сторінка нічого не вирішує: шле токен на
 * /api/plan-group/accept і показує, що відповів сервер.
 *
 * Свідомо БЕЗ автоматичного прийняття при завантаженні. Причина: людина
 * могла бути залогінена іншою поштою (спільний комп'ютер, робочий акаунт),
 * і мовчазна прив'язка чужого акаунта до чужого пакета — найгірше, що тут
 * може статися. Тому спершу показуємо, кому адресоване запрошення, і чекаємо
 * натискання.
 */

import { useEffect, useState } from 'react'

const GOLD = '#ef9f27'
const CREAM = '#f5f0e8'
const MUTED = '#8899bb'
const FONT = "'Montserrat', Arial, sans-serif"

export default function JoinPage() {
  const [token, setToken] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [needLogin, setNeedLogin] = useState(false)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token')
    setToken(t)
    if (!t) { setState('error'); setMessage('Посилання неповне. Відкрийте його з листа повністю.') }
  }, [])

  const accept = async () => {
    if (!token) return
    setState('busy'); setMessage(''); setNeedLogin(false)
    try {
      const r = await fetch('/api/plan-group/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const d = await r.json()
      if (d.ok) { setState('done'); return }
      setState('error')
      setMessage(d.message ?? 'Не вдалося прийняти запрошення.')
      if (d.code === 'auth' || d.code === 'wrong_email') setNeedLogin(true)
    } catch {
      setState('error'); setMessage('Не вдалося прийняти запрошення. Спробуйте ще раз.')
    }
  }

  const wrap: React.CSSProperties = {
    maxWidth: 520, margin: '0 auto', padding: '48px 20px 60px',
    fontFamily: FONT, color: CREAM, textAlign: 'center',
  }
  const btn: React.CSSProperties = {
    display: 'inline-block', padding: '14px 28px', borderRadius: 10,
    background: GOLD, color: '#0a1628', fontWeight: 700, fontSize: 16,
    border: 'none', textDecoration: 'none', fontFamily: FONT, cursor: 'pointer',
  }

  if (state === 'done') return (
    <main style={wrap}>
      <h1 style={{ fontSize: 24, color: GOLD, marginBottom: 12 }}>Доступ відкрито</h1>
      <p style={{ color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
        Тепер вам відкриті всі серії й історії. Закладки й місце, де ви
        зупинилися, зберігаються у вашому обліковому записі — ніхто інший
        їх не бачить.
      </p>
      <a href="/" style={btn}>Почати читати →</a>
    </main>
  )

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 24, color: GOLD, marginBottom: 12 }}>Запрошення до Балабонів</h1>
      <p style={{ color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
        Вам відкривають доступ до понад 900 історій і до серіалів. У вас буде
        власний обліковий запис із власними закладками.
      </p>

      {message && (
        <p role="status" style={{
          fontSize: 14, lineHeight: 1.6, marginBottom: 20, padding: '12px 16px',
          borderRadius: 9, background: 'rgba(248,113,113,0.12)', color: '#fca5a5',
        }}>
          {message}
        </p>
      )}

      {needLogin ? (
        <a href="/login" style={btn}>Увійти</a>
      ) : (
        <button onClick={accept} disabled={state === 'busy' || !token} style={{
          ...btn, opacity: state === 'busy' || !token ? 0.5 : 1,
        }}>
          {state === 'busy' ? 'Приймаємо…' : 'Прийняти запрошення'}
        </button>
      )}

      <p style={{ fontSize: 12, color: MUTED, marginTop: 22, lineHeight: 1.6 }}>
        Увійти треба саме тією поштою, на яку прийшов лист.
      </p>
    </main>
  )
}
