'use client'

/**
 * /dlia-orhanizatsiy — корпоративний і бібліотечний доступ.
 *
 * СТОРІНКА СВІДОМО НЕ ПІДКЛЮЧЕНА: на неї немає посилань ні в меню, ні в
 * підвалі, ні в прайсі, ні в карті сайту, і вона закрита в robots.ts.
 * Причина — заявка на balabony.com як другий домен у Google Ad Grants.
 * Оглядач, що побачить на домені форму для юросіб із ЄДРПОУ й актами,
 * може прочитати сайт як комерційний, а не місійний, — рівно через це
 * ми прибрали /poslugy.
 *
 * ЯК УВІМКНУТИ після відповіді Google: прибрати '/dlia-orhanizatsiy' з
 * disallow у app/robots.ts, додати рядок у app/sitemap.ts і посилання в
 * підвалі поруч із «Голоси платформи».
 *
 * Оплата тут навмисно НЕ карткою: юрособи платять за рахунком, тому форма
 * збирає реквізити, а рахунок і акт виписуються поза сайтом.
 */

import { useState } from 'react'

const GOLD = '#ef9f27'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#8899bb'
const FONT = "'Montserrat', Arial, sans-serif"

type Kind = 'corporate' | 'library'

const PACKS: { kind: Kind; title: string; seats: number; price: string; note: string }[] = [
  {
    kind: 'corporate',
    title: 'Корпоративний',
    seats: 25,
    price: '8 900 ₴ на рік',
    note: 'Для компаній, які відкривають читання працівникам. 356 ₴ за особу на рік — менше ніж 30 ₴ на місяць.',
  },
  {
    kind: 'library',
    title: 'Бібліотечний',
    seats: 50,
    price: '8 900 ₴ на рік',
    note: 'Соціальна ціна для публічних бібліотек, шкіл і культурних центрів: удвічі більше місць за ту саму суму.',
  },
]

export default function ForOrganizationsPage() {
  const [kind, setKind] = useState<Kind>('corporate')
  const [form, setForm] = useState({
    orgName: '', edrpou: '', contactName: '', contactEmail: '', contactPhone: '', note: '',
  })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const submit = async () => {
    if (busy) return
    setBusy(true); setErr(null)
    try {
      const r = await fetch('/api/plan-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, ...form }),
      })
      const d = await r.json()
      if (d.ok) setDone(true)
      else setErr(d.message ?? 'Не вдалося надіслати заявку.')
    } catch {
      setErr('Не вдалося надіслати заявку. Напишіть на nazar@balabony.com.')
    } finally { setBusy(false) }
  }

  const wrap: React.CSSProperties = {
    maxWidth: 680, margin: '0 auto', padding: '32px 20px 60px',
    fontFamily: FONT, color: CREAM,
  }
  const input: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 9,
    border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)',
    color: CREAM, fontSize: 15, fontFamily: FONT, marginBottom: 12,
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: 13, color: MUTED, marginBottom: 6,
  }

  if (done) return (
    <main style={{ ...wrap, textAlign: 'center', paddingTop: 60 }}>
      <h1 style={{ fontSize: 24, color: GOLD, marginBottom: 14 }}>Заявку прийнято</h1>
      <p style={{ color: MUTED, lineHeight: 1.7 }}>
        Ми надішлемо рахунок на вказану пошту. Після надходження коштів
        доступ відкриється, і контактна особа отримає лист із посиланням
        на керування місцями.
      </p>
    </main>
  )

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 26, color: GOLD, margin: '0 0 10px' }}>Доступ для організацій</h1>
      <p style={{ color: MUTED, lineHeight: 1.7, margin: '0 0 24px' }}>
        Один пакет — доступ для всієї команди або для читачів вашої установи.
        У кожного власний обліковий запис: свої закладки, своя історія читання.
        Місцями керує одна людина з вашого боку — додає й прибирає людей сама.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26 }}>
        {PACKS.map((p) => (
          <button
            key={p.kind}
            type="button"
            onClick={() => setKind(p.kind)}
            style={{
              textAlign: 'left', padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
              background: NAVY, fontFamily: FONT, color: CREAM,
              border: kind === p.kind ? `2px solid ${GOLD}` : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', marginBottom: 6 }}>
              <strong style={{ fontSize: 17, flex: '1 1 auto' }}>{p.title}</strong>
              <span style={{ color: GOLD, fontWeight: 700 }}>{p.price}</span>
            </div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>{p.seats} місць</div>
            <div style={{ fontSize: 14, color: '#c8d4e8', lineHeight: 1.6 }}>{p.note}</div>
          </button>
        ))}
      </div>

      <h2 style={{ fontSize: 18, color: GOLD, margin: '0 0 14px' }}>Реквізити для рахунку</h2>

      <label style={label} htmlFor="org">Назва організації *</label>
      <input id="org" style={input} value={form.orgName} onChange={set('orgName')} />

      <label style={label} htmlFor="edrpou">ЄДРПОУ</label>
      <input id="edrpou" style={input} value={form.edrpou} onChange={set('edrpou')} />

      <label style={label} htmlFor="cn">Контактна особа *</label>
      <input id="cn" style={input} value={form.contactName} onChange={set('contactName')} />

      <label style={label} htmlFor="ce">Пошта *</label>
      <input id="ce" type="email" style={input} value={form.contactEmail} onChange={set('contactEmail')} />

      <label style={label} htmlFor="cp">Телефон</label>
      <input id="cp" style={input} value={form.contactPhone} onChange={set('contactPhone')} />

      <label style={label} htmlFor="nt">Що варто знати</label>
      <textarea id="nt" rows={4} style={{ ...input, resize: 'vertical' }} value={form.note}
        onChange={set('note')} />

      {err && (
        <p role="status" style={{
          fontSize: 14, padding: '11px 14px', borderRadius: 9, marginBottom: 14,
          background: 'rgba(248,113,113,0.12)', color: '#fca5a5',
        }}>{err}</p>
      )}

      <button onClick={submit} disabled={busy} style={{
        width: '100%', padding: '15px 20px', borderRadius: 10, border: 'none',
        background: GOLD, color: '#0a1628', fontWeight: 700, fontSize: 16,
        fontFamily: FONT, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
      }}>
        {busy ? 'Надсилаємо…' : 'Надіслати заявку'}
      </button>

      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, marginTop: 18 }}>
        Оплата за рахунком, безготівковим переказом. Рахунок і акт виконаних
        робіт надсилаємо на вказану пошту. Доступ відкривається після
        надходження коштів.
      </p>
    </main>
  )
}
