'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Сторінка після повернення з LiqPay.
 *
 * LiqPay редіректить сюди одразу, а вебхук може прийти на секунду пізніше,
 * тому статус перепитуємо кілька разів, перш ніж сказати «щось не так».
 * Адресу тут не показуємо — тільки статус.
 */

const GOLD_L = '#FAC775'
const CREAM  = '#f5f0e8'
const TEXT   = '#dbe4f0'
const MUTED  = '#8CA0B8'
const SERIF  = "'Lora', Georgia, serif"

export default function Success() {
  const [state, setState] = useState<'checking' | 'paid' | 'pending' | 'failed'>('checking')
  const [qty, setQty]     = useState(1)

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('order_id')
    if (!orderId) { setState('failed'); return }

    let tries = 0
    let stop = false

    const check = async () => {
      try {
        const r = await fetch(`/api/kalendar/confirm?order_id=${encodeURIComponent(orderId)}`)
        const d = await r.json()
        if (stop) return
        if (d?.qty) setQty(d.qty)
        if (d?.status === 'paid')      { setState('paid');   return }
        if (d?.status === 'cancelled') { setState('failed'); return }
      } catch { /* мережа моргнула — просто спробуємо ще */ }
      tries += 1
      if (tries < 6) setTimeout(check, 1500)
      else if (!stop) setState('pending')
    }
    check()
    return () => { stop = true }
  }, [])

  return (
    <main style={{ background: '#0a1628', minHeight: '100vh', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: 620, margin: '0 auto', color: TEXT, lineHeight: 1.75 }}>
        {state === 'checking' && <p style={{ color: MUTED }}>Перевіряємо оплату…</p>}

        {state === 'paid' && (
          <>
            <h1 style={h1}>Дякуємо, замовлення прийнято</h1>
            <p>
              {qty > 1 ? `Календарі (${qty} шт.)` : 'Календар'} виходять з друку
              наприкінці жовтня 2026 року — відправимо Новою поштою одразу після цього,
              на вказане відділення. Номер накладної надійде на вашу пошту,
              а якщо ви її не залишили — зателефонуємо.
            </p>
            <p style={{ color: MUTED }}>
              Питання щодо замовлення — <a href="mailto:nazar@balabony.com" style={{ color: GOLD_L }}>nazar@balabony.com</a>.
            </p>
          </>
        )}

        {state === 'pending' && (
          <>
            <h1 style={h1}>Оплата ще обробляється</h1>
            <p>
              Банк іноді підтверджує платіж із затримкою. Якщо кошти списано,
              замовлення вже в нас — нічого робити не треба, ми зв’яжемося з вами.
            </p>
            <p style={{ color: MUTED }}>
              Якщо за годину нічого не сталося, напишіть на{' '}
              <a href="mailto:nazar@balabony.com" style={{ color: GOLD_L }}>nazar@balabony.com</a>.
            </p>
          </>
        )}

        {state === 'failed' && (
          <>
            <h1 style={h1}>Оплата не пройшла</h1>
            <p>Кошти не списано. Можна спробувати ще раз.</p>
            <p><Link href="/kalendar" style={{ color: GOLD_L }}>Повернутися до календаря</Link></p>
          </>
        )}
      </div>
    </main>
  )
}

const h1: React.CSSProperties = {
  fontFamily: SERIF, fontSize: '1.6rem', color: GOLD_L,
  fontWeight: 400, margin: '0 0 .9rem',
}
