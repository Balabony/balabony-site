'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * Сторінка продажу друкованого календаря-планувальника на 2027.
 *
 * Форму збираємо ДО оплати (рішення Богдана 12.09.2026): інакше частина
 * покупців закриє вкладку після платежу, і адресу доведеться випрошувати
 * листами. Дані летять у calendar_orders разом зі створенням замовлення,
 * далі фронт сабмітить приховану форму на LiqPay.
 *
 * Зображення лежать у /public/kalendar/. Це рендери сторінок макета, не
 * фото друкованого виробу — фото зробити варто, воно продає краще.
 *
 * Ціна 550 проти 600 на «Розетці»: там комісія майданчика.
 */

const GOLD   = '#ef9f27'
const GOLD_L = '#FAC775'
const CREAM  = '#f5f0e8'
const TEXT   = '#dbe4f0'
const MUTED  = '#8CA0B8'
const CARD   = '#0f1f38'
const LINE   = 'rgba(239,159,39,.25)'
const SERIF  = "'Lora', Georgia, serif"

const PRICE = 550
const MAX_QTY = 5

const PAGES = [
  { src: '/kalendar/sichen.jpg',       name: 'Січень',
    cap: 'Великі клітинки з місцем для записів і поле «Нотатки» збоку' },
  { src: '/kalendar/traven.jpg',       name: 'Травень',
    cap: 'Свята позначені просто в сітці — державні, церковні й пам’ятні дати' },
  { src: '/kalendar/richnyi-plan.jpg', name: 'Річний план',
    cap: 'Увесь 2027-й на одному аркуші' },
]

const input: React.CSSProperties = {
  width: '100%',
  padding: '.6rem .75rem',
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.15)',
  borderRadius: 8,
  color: CREAM,
  fontSize: '1rem',
  fontFamily: 'inherit',
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '.85rem',
  color: MUTED,
  marginBottom: '.3rem',
}

export default function KalendarPage() {
  const [i, setI]         = useState(0)
  const [qty, setQty]     = useState(1)
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState('')
  const [form, setForm]   = useState({
    buyerName: '', buyerPhone: '', buyerEmail: '',
    npCity: '', npBranch: '', comment: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function order() {
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/kalendar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, qty }),
      })
      const d = await res.json()
      if (!res.ok) {
        setErr(d?.error || 'Не вдалося створити замовлення')
        setBusy(false)
        return
      }
      // Приховану форму сабмітимо самі — LiqPay приймає лише POST.
      const f = document.createElement('form')
      f.method = 'POST'
      f.action = 'https://www.liqpay.ua/api/3/checkout'
      f.acceptCharset = 'utf-8'
      for (const [k, v] of Object.entries({ data: d.data, signature: d.signature })) {
        const inp = document.createElement('input')
        inp.type = 'hidden'; inp.name = k; inp.value = String(v)
        f.appendChild(inp)
      }
      document.body.appendChild(f)
      f.submit()
    } catch {
      setErr('Не вдалося зв’язатися із сервером. Спробуйте ще раз.')
      setBusy(false)
    }
  }

  return (
    <main style={{ background: '#0a1628', minHeight: '100vh', padding: '1.5rem 1rem 4rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', color: TEXT, lineHeight: 1.7 }}>

        {/* Заголовки — золотом, текст — світлим. Золото тут несе ієрархію,
            а не прикрасу: три рівні (золото / кремовий / приглушений) */}
        <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.4rem,4vw,2rem)', color: GOLD_L,
                     fontWeight: 400, margin: '.5rem 0 .75rem' }}>
          Фірмовий подарунковий настінний календар-планувальник на 2027 рік
        </h1>
        <p style={{ fontSize: '1.05rem', marginBottom: '.9rem' }}>
          Формат А3, 15 сторінок, поле для нотаток на кожному місяці.
          Наш власний — від макета до друку.
        </p>

        {/* ── Гортання сторінок ─────────────────────────────
            Обводка золотом: зовнішня рамка кольору бренду, всередині
            вузьке біле паспарту. Це потрібно не лише для краси — сам
            макет календаря бірюзовий, і без золотої рамки знімок
            випадає з палітри сайту. */}
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12,
                      padding: '.85rem', margin: '1.5rem 0 .75rem' }}>
          <div style={{
            border: `2px solid ${GOLD}`,
            borderRadius: 10,
            padding: 6,
            background: 'rgba(239,159,39,.08)',
            boxShadow: '0 0 0 1px rgba(255,255,255,.06) inset',
          }}>
            <div style={{ background: '#fff', borderRadius: 4, overflow: 'hidden',
                          aspectRatio: '1190/842',
                          boxShadow: '0 2px 14px rgba(0,0,0,.35)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PAGES[i].src} alt={`Календар 2027, ${PAGES[i].name}`}
                   style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '.7rem', minHeight: '2.6em' }}>
            <b style={{ display: 'block', color: GOLD_L, fontWeight: 500 }}>{PAGES[i].name}</b>
            <span style={{ fontSize: '.92rem' }}>{PAGES[i].cap}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '.75rem', marginTop: '.6rem' }}>
            <button onClick={() => setI((i - 1 + PAGES.length) % PAGES.length)}
                    aria-label="Попередня сторінка" style={btn}>←</button>
            <div style={{ display: 'flex', gap: 8 }}>
              {PAGES.map((_, k) => (
                <span key={k} onClick={() => setI(k)} role="button" tabIndex={0}
                      aria-label={`Сторінка ${k + 1}`}
                      onKeyDown={e => { if (e.key === 'Enter') setI(k) }}
                      style={{ width: 10, height: 10, borderRadius: '50%', cursor: 'pointer',
                               background: k === i ? GOLD : 'rgba(255,255,255,.18)' }} />
              ))}
            </div>
            <button onClick={() => setI((i + 1) % PAGES.length)}
                    aria-label="Наступна сторінка" style={btn}>→</button>
          </div>
        </div>

        {/* ── Ціна й форма ──────────────────────────────────── */}
        <div style={{ background: CARD, border: `1px solid rgba(239,159,39,.55)`,
                      borderRadius: 12, padding: '1.25rem', margin: '2rem 0' }}>
          {/* Перекреслені 600 читалися як «стара ціна, яку ми знизили».
              Насправді це ціна на чужому майданчику — там комісія.
              Кажемо прямо, без викреслювання. */}
          <div style={{ fontSize: '2rem', color: GOLD_L, fontWeight: 500 }}>
            {PRICE * qty} грн
          </div>
          {qty === 1 && (
            <p style={{ color: MUTED, fontSize: '.95rem', margin: '.2rem 0 0' }}>
              На «Розетці» — дорожче, 600 грн.
            </p>
          )}
          <p style={{ margin: '.4rem 0 .9rem' }}>
            Купуючи календар, ви підтримуєте роботу платформи.
          </p>

          <div style={{ display: 'grid', gap: '.85rem',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div>
              <label style={label} htmlFor="nm">Прізвище та ім’я одержувача</label>
              <input id="nm" style={input} value={form.buyerName} onChange={set('buyerName')} />
            </div>
            <div>
              <label style={label} htmlFor="ph">Телефон</label>
              <input id="ph" style={input} placeholder="0XX XXX XX XX"
                     value={form.buyerPhone} onChange={set('buyerPhone')} />
            </div>
            <div>
              <label style={label} htmlFor="ct">Місто</label>
              <input id="ct" style={input} value={form.npCity} onChange={set('npCity')} />
            </div>
            <div>
              <label style={label} htmlFor="br">Відділення Нової пошти</label>
              <input id="br" style={input} placeholder="№ 12"
                     value={form.npBranch} onChange={set('npBranch')} />
            </div>
            <div>
              <label style={label} htmlFor="em">Пошта, щоб надіслати номер накладної</label>
              <input id="em" style={input} value={form.buyerEmail} onChange={set('buyerEmail')} />
            </div>
            <div>
              <label style={label} htmlFor="qt">Кількість</label>
              <input id="qt" type="number" min={1} max={MAX_QTY} style={input} value={qty}
                     onChange={e => setQty(Math.max(1, Math.min(MAX_QTY, Number(e.target.value) || 1)))} />
            </div>
          </div>

          {err && (
            <p style={{ color: '#ff9b9b', marginTop: '.85rem', marginBottom: 0 }}>{err}</p>
          )}

          <button onClick={order} disabled={busy}
                  style={{ marginTop: '1rem', background: GOLD, color: '#2a1a02', border: 0,
                           borderRadius: 8, padding: '.7rem 1.5rem', fontSize: '1.05rem',
                           fontWeight: 500, cursor: busy ? 'default' : 'pointer',
                           opacity: busy ? .6 : 1 }}>
            {busy ? 'Готуємо оплату…' : 'Замовити'}
          </button>

          <p style={{ color: MUTED, fontSize: '.9rem', marginTop: '.85rem', marginBottom: 0 }}>
            Оплата карткою. Доставка Новою поштою за тарифами перевізника, оплачує отримувач.
            Дані потрібні лише для відправлення — як ми з ними поводимось, написано в{' '}
            <Link href="/legal/privacy" style={{ color: GOLD_L }}>політиці конфіденційності</Link>.
          </p>
        </div>

        <h2 style={h2}>Що всередині</h2>
        <ul style={ul}>
          <li>12 місяців — великі клітинки з місцем для записів, поле «Нотатки» збоку</li>
          <li>Річний план — увесь 2027-й на одному аркуші</li>
          <li>Календар свят — державні, церковні, професійні та міжнародні</li>
          <li>План відпочинку на 2028 рік</li>
        </ul>

        <h2 style={h2}>Характеристики</h2>
        <ul style={ul}>
          <li>Формат: 29,7 × 42 см (А3), альбомна орієнтація</li>
          <li>Сторінок: 15</li>
          <li>Кріплення: пружина</li>
          <li>Матеріал: папір</li>
          <li>Тип паперу: офсетний</li>
          <li>Країна-виробник: Україна</li>
        </ul>

        <p style={{ color: MUTED, fontSize: '.9rem' }}>
          Календар-планувальник є твором, захищеним авторським правом.
        </p>
      </div>
    </main>
  )
}

const btn: React.CSSProperties = {
  font: 'inherit',
  cursor: 'pointer',
  background: 'rgba(239,159,39,.10)',
  color: GOLD_L,
  border: '1px solid rgba(239,159,39,.55)',
  borderRadius: 8,
  padding: '.45rem 1rem',
}

const h2: React.CSSProperties = {
  fontFamily: SERIF, fontSize: '1.25rem', color: GOLD_L,
  fontWeight: 400, margin: '2rem 0 .6rem',
}

const ul: React.CSSProperties = { margin: '0 0 .9rem', paddingLeft: '1.2rem' }
