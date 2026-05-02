'use client'

import { useState, useEffect, useRef } from 'react'

const CYCLE_MS = 8 * 60 * 60 * 1000

function getSecondsLeft(): number {
  if (typeof window === 'undefined') return CYCLE_MS / 1000
  const stored = localStorage.getItem('free_view_start')
  const now = Date.now()
  if (!stored) {
    localStorage.setItem('free_view_start', String(now))
    return CYCLE_MS / 1000
  }
  const elapsed = now - Number(stored)
  if (elapsed >= CYCLE_MS) {
    localStorage.setItem('free_view_start', String(now))
    return CYCLE_MS / 1000
  }
  return Math.ceil((CYCLE_MS - elapsed) / 1000)
}

function fmtCountdown(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function FreeViewTimer() {
  const [secs, setSecs] = useState<number>(() => getSecondsLeft())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSecs(getSecondsLeft())
    timerRef.current = setInterval(() => {
      setSecs(getSecondsLeft())
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  return (
    <div style={{ textAlign: 'center', margin: '12px 0 0' }}>
      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
        🕐 Безкоштовний перегляд оновлюється через:
      </div>
      <div style={{
        fontSize: 24, fontWeight: 700, color: '#FFB800',
        fontVariantNumeric: 'tabular-nums', letterSpacing: 2, lineHeight: 1,
        fontFamily: "'Montserrat', Arial, sans-serif",
      }}>
        {fmtCountdown(secs)}
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
        Одна історія безкоштовно кожні 8 годин — або обери план
      </div>
    </div>
  )
}

async function initiatePayment(pkg: { price: string; tier: string; unit: string }) {
  try {
    const res = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseInt(pkg.price) }),
    })
    const json = await res.json()
    if (json.data && json.signature) {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = 'https://www.liqpay.ua/api/3/checkout'
      form.target = '_blank'
      form.style.display = 'none'
      ;[['data', json.data], ['signature', json.signature]].forEach(([name, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
      form.remove()
    } else {
      alert('Помилка створення платежу. Спробуйте ще раз.')
    }
  } catch {
    alert('Помилка з\'єднання. Спробуйте ще раз.')
  }
}

async function initiateInstallment(provider: 'privat' | 'oschadbank') {
  try {
    const endpoint = provider === 'privat'
      ? '/api/payment/installment/privat'
      : '/api/payment/installment/oschadbank'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 891, package: 'Річний', currency: 'UAH' }),
    })
    const data = await res.json()
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl
    } else if (data.formData) {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = provider === 'privat'
        ? 'https://api.privatbank.ua/p24api/ishop'
        : 'https://secure.wayforpay.com/pay'
      form.style.display = 'none'
      Object.entries(data.formData).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = String(value)
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
    } else {
      alert('Помилка створення розстрочки. Спробуйте ще раз.')
    }
  } catch {
    alert('Помилка з\'єднання. Спробуйте ще раз.')
  }
}

function trackPurchase(amount: string) {
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', `purchase_${amount}_uah`, { amount })
    }
  } catch (_) {}
}

interface PaymentModalProps {
  pkg: { price: string; tier: string; unit: string }
  onClose: () => void
}

function PaymentModal({ pkg, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [installmentLoading, setInstallmentLoading] = useState<'privat' | 'oschadbank' | null>(null)

  const handlePay = async () => {
    setLoading(true)
    trackPurchase(pkg.price)
    await initiatePayment(pkg)
    setLoading(false)
  }

  const handleInstallment = async (provider: 'privat' | 'oschadbank') => {
    setInstallmentLoading(provider)
    trackPurchase('installment_' + provider)
    await initiateInstallment(provider)
    setInstallmentLoading(null)
  }

  const isDia = pkg.price === '1'
  const isAnnual = pkg.tier === 'Річний'

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}
    >
      <div style={{ background: 'var(--white)', padding: '36px 32px', borderRadius: 24, width: '90%', maxWidth: 420, textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Оплата пакету</h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>{pkg.tier} — {pkg.price} {pkg.unit}</p>

        {isDia ? (
          <>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 13, color: '#0369a1', lineHeight: 1.5 }}>
              🇺🇦 Для отримання доступу за 1 ₴ потрібна верифікація через застосунок Дія
            </div>
            <button onClick={handlePay} disabled={loading} style={{ display: 'block', width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', marginBottom: 10, fontFamily: "'Montserrat', sans-serif" }}>
              {loading ? 'Завантаження...' : '🇺🇦 Підтвердити через Дія'}
            </button>
          </>
        ) : (
          <>
            <div style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#64748b' }}>
              💳 Visa, Mastercard, Apple Pay, Google Pay
            </div>

            {isAnnual && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, cursor: 'pointer', textAlign: 'left' }}>
                <input
                  type="checkbox"
                  id="annual-refund-agree"
                  style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16, cursor: 'pointer' }}
                  onChange={e => {
                    const btn = document.getElementById('pay-btn') as HTMLButtonElement
                    if (btn) btn.disabled = !e.target.checked
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Я погоджуюсь з умовами надання послуг та підтверджую, що оплата за річний період є остаточною і не підлягає поверненню.
                </span>
              </label>
            )}

            <button
              id="pay-btn"
              onClick={handlePay}
              disabled={loading || isAnnual}
              style={{ display: 'block', width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'var(--accent-gold)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', marginBottom: 10, fontFamily: "'Montserrat', sans-serif", opacity: isAnnual ? 0.5 : 1, transition: 'opacity 0.2s' }}
            >
              {loading ? 'Перенаправлення...' : `Оплатити ${pkg.price} ₴`}
            </button>

            {/* Розстрочка — тільки для річного */}
            {isAnnual && (
              <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  Купуй зараз — плати частинами
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
                  Без комісій та переплат · від 3 до 6 місяців · доступ одразу після підтвердження першого платежу
                </div>
                <div style={{ background: '#fff8ed', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>
                  ⚠️ При оплаті частинами також діє правило «Без повернення залишку», оскільки це річний контракт.
                </div>

                {/* ПриватБанк */}
                <button
                  onClick={() => handleInstallment('privat')}
                  disabled={installmentLoading !== null}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '13px 16px', borderRadius: 12, marginBottom: 10,
                    border: '1.5px solid #1B4F9B', background: installmentLoading === 'privat' ? '#e8f0fe' : '#fff',
                    cursor: installmentLoading !== null ? 'wait' : 'pointer',
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {/* ПриватБанк лого */}
                  <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="8" fill="#1B4F9B"/>
                    <text x="20" y="27" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="Arial">П24</text>
                  </svg>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1B4F9B' }}>
                      {installmentLoading === 'privat' ? 'Перенаправлення...' : 'Оплата частинами'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>ПриватБанк · від 149 ₴/міс</div>
                  </div>
                </button>

                {/* Ощадбанк */}
                <button
                  onClick={() => handleInstallment('oschadbank')}
                  disabled={installmentLoading !== null}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '13px 16px', borderRadius: 12, marginBottom: 4,
                    border: '1.5px solid #007A3D', background: installmentLoading === 'oschadbank' ? '#e8f5ee' : '#fff',
                    cursor: installmentLoading !== null ? 'wait' : 'pointer',
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {/* Ощадбанк лого */}
                  <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="8" fill="#007A3D"/>
                    <text x="20" y="27" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="Arial">ОЩД</text>
                  </svg>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#007A3D' }}>
                      {installmentLoading === 'oschadbank' ? 'Перенаправлення...' : 'Ощад-Розстрочка'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Ощадбанк · від 149 ₴/міс</div>
                  </div>
                </button>
              </div>
            )}
          </>
        )}

        <button onClick={onClose} style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'block', width: '100%' }}>
          Скасувати
        </button>
      </div>
    </div>
  )
}

export default function PricingSection() {
  const [modal, setModal] = useState<{ price: string; tier: string; unit: string } | null>(null)

  const plans = [
    {
      badge: 'УБД / ІНВАЛІДНІСТЬ', badgeBg: 'var(--accent-gold)',
      tier: 'inclusive', tierLabel: 'Пільговий',
      price: '1', unit: '₴/рік',
      note: 'УБД, люди з інвалідністю',
      features: [
        { ok: true,  text: 'Весь контент без обмежень' },
        { ok: true,  text: 'Валідація через Дія' },
        { ok: false, text: 'Відеореклама перед кожною серією' },
      ],
      btnLabel: '🇺🇦 Підтвердити через Дія',
      btnBg: 'var(--bg-deep)', featured: false
    },
    {
      badge: 'ПОПУЛЯРНИЙ', badgeBg: 'var(--accent-gold)',
      tier: 'standard', tierLabel: 'Місячний',
      price: '99', unit: '₴/міс',
      note: 'Скасування в будь-який час в один клік',
      features: [
        { ok: true, text: 'Весь контент без обмежень' },
        { ok: true, text: 'Жодної реклами' },
      ],
      btnLabel: 'Оформити за 99 ₴',
      btnBg: 'var(--accent-gold)', featured: true
    },
    {
      badge: '25% ВИГОДИ', badgeBg: 'var(--accent-gold)',
      tier: 'annual', tierLabel: 'Річний',
      price: '891', unit: '₴/рік',
      note: 'Всього 74 ₴/міс · Економія 297 ₴',
      features: [
        { ok: true, text: 'Весь контент без обмежень' },
        { ok: true, text: 'Жодної реклами' },
        { ok: true, text: 'Офлайн-завантаження' },
      ],
      btnLabel: 'Отримати рік за ціною шести місяців',
      btnBg: 'var(--accent-gold)', featured: false
    },
  ]

  return (
    <section id="pricing" style={{ marginBottom: 56 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-gold)', display: 'block', marginBottom: 8 }}>
        Підписки
      </span>
      <h2 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 700, color: '#FFFFFF', marginBottom: 28 }}>
        Оберіть свій план доступу
      </h2>

      <div style={{ background: 'var(--bg-deep)', color: '#f8fafc', borderRadius: 14, padding: '16px 24px', marginBottom: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#ef9f27' }}>1 Сезон = 20 Серій</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Кожні 8 годин — нова безкоштовна історія для тебе. Без реєстрації.</div>
        <FreeViewTimer />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
      }}>
        {plans.map(plan => (
          <div key={plan.tier} style={{
            background: 'var(--white)',
            border: `2px solid ${plan.featured ? 'var(--accent-gold)' : 'var(--border)'}`,
            borderRadius: 18, padding: '36px 28px',
            display: 'flex', flexDirection: 'column', position: 'relative'
          }}>
            {plan.badge && (
              <span style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: '3px 12px',
                borderRadius: 20, whiteSpace: 'nowrap', color: '#fff', background: plan.badgeBg
              }}>{plan.badge}</span>
            )}
            <div style={{ fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--accent-gold)', marginBottom: 10 }}>
              {plan.tierLabel}
            </div>
            <div style={{ fontFamily: "'Lora', serif", fontSize: 72, fontWeight: 600, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>
              {plan.price} <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--muted)' }}>{plan.unit}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 0 14px', lineHeight: 1.5 }}>
              {plan.note}
            </p>
            <div style={{ height: 1, background: 'var(--border)', margin: '0 0 14px' }} />
            <ul style={{ listStyle: 'none', marginBottom: 20, padding: 0, flex: 1 }}>
              {plan.features.map(f => (
                <li key={f.text} style={{ fontSize: 16, color: 'var(--text)', padding: '5px 0', display: 'flex', alignItems: 'flex-start', gap: 7, lineHeight: 1.4 }}>
                  <span style={{ color: f.ok ? 'var(--accent-gold)' : '#ef4444', fontWeight: 800, flexShrink: 0 }}>{f.ok ? '✓' : '×'}</span>
                  {f.text}
                </li>
              ))}
            </ul>

            {/* Розстрочка — мінібанер під річним тарифом */}
            {plan.tier === 'annual' && (
              <div style={{
                background: 'linear-gradient(135deg, #f0f7ff 0%, #f0fdf4 100%)',
                border: '1px solid #e2e8f0', borderRadius: 12,
                padding: '12px 14px', marginBottom: 14,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                  💳 Оплата частинами
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, lineHeight: 1.5 }}>
                  Купуй зараз — плати частинами. Без комісій та переплат.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setModal({ price: plan.price, tier: plan.tierLabel, unit: plan.unit })}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 10px', borderRadius: 8,
                      border: '1.5px solid #1B4F9B', background: '#fff',
                      cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                      <rect width="40" height="40" rx="8" fill="#1B4F9B"/>
                      <text x="20" y="27" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="Arial">П24</text>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1B4F9B' }}>Частинами</span>
                  </button>
                  <button
                    onClick={() => setModal({ price: plan.price, tier: plan.tierLabel, unit: plan.unit })}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 10px', borderRadius: 8,
                      border: '1.5px solid #007A3D', background: '#fff',
                      cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                      <rect width="40" height="40" rx="8" fill="#007A3D"/>
                      <text x="20" y="27" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="Arial">ОЩД</text>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#007A3D' }}>Розстрочка</span>
                  </button>
                </div>
              </div>
            )}

            {plan.tier === 'annual' && (
              <p
                onClick={() => {
                  try { if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'click_annual_no_refund_policy') } catch(_) {}
                }}
                style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5, cursor: 'pointer', textAlign: 'center' }}
              >
                ⚠️ Дострокове скасування з поверненням залишку неможливе.
              </p>
            )}
            <button
              onClick={() => setModal({ price: plan.price, tier: plan.tierLabel, unit: plan.unit })}
              style={{ display: 'block', textAlign: 'center', padding: 14, borderRadius: 9, fontSize: 18, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: "'Montserrat', sans-serif", minHeight: 52, background: plan.btnBg, color: '#fff' }}
            >{plan.btnLabel}</button>
          </div>
        ))}
      </div>

      {modal && <PaymentModal pkg={modal} onClose={() => setModal(null)} />}
    </section>
  )
}
