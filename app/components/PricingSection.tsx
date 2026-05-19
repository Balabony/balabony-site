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
  const [secs, setSecs] = useState<number>(CYCLE_MS / 1000)
  const [hydrated, setHydrated] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSecs(getSecondsLeft())
    setHydrated(true)
    timerRef.current = setInterval(() => {
      setSecs(getSecondsLeft())
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  return (
    <div className="ptimer">
      <span className="ptimer-text">Нові історії та серії щодня. Наступна оновиться через:</span>
      <span className="ptimer-count">{hydrated ? fmtCountdown(secs) : '—:—:—'}</span>
      <style jsx>{`
        .ptimer {
          background: rgba(255,255,255,0.06);
          border: 1.5px solid #EF9F27;
          border-radius: 14px;
          padding: 16px 22px;
          margin: 0 auto 32px;
          max-width: 720px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 16px;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .ptimer-text { color: #FFFFFF; }
        .ptimer-count {
          font-weight: 700;
          color: #FAC775;
          font-variant-numeric: tabular-nums;
          letter-spacing: 1.2px;
          font-size: 18px;
          font-family: 'Montserrat', Arial, sans-serif;
        }
      `}</style>
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
      body: JSON.stringify({ amount: 890, package: 'Річний', currency: 'UAH' }),
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
      badge: 'БЕЗ ПІДПИСКИ', badgeClass: 'pbadge-gray',
      tier: 'peritem', tierLabel: 'Поштучно',
      price: '9', unit: '₴/шт',
      note: 'Одна історія або одна серія — 9 грн',
      features: [
        { ok: true,  text: 'Купуй без підписки' },
        { ok: true,  text: 'Ідеально, щоб спробувати перед підпискою' },
        { ok: false, text: 'Необмежений доступ' },
      ],
      btnLabel: 'Спробувати',
      featured: false
    },
    {
      badge: 'УБД / ІНВАЛІДНІСТЬ', badgeClass: 'pbadge-gold',
      tier: 'inclusive', tierLabel: 'Пільговий',
      price: '1', unit: '₴/рік',
      note: 'УБД, люди з інвалідністю',
      features: [
        { ok: true,  text: 'Весь контент без обмежень' },
        { ok: true,  text: 'Валідація через Дія' },
        { ok: false, text: 'Без реклами' },
      ],
      btnLabel: 'Підтвердити через Дія',
      featured: false
    },
    {
      badge: 'ПОПУЛЯРНИЙ', badgeClass: 'pbadge-gold',
      tier: 'standard', tierLabel: 'Місячний',
      price: '129', unit: '₴/міс',
      note: 'Перший місяць — 49 ₴ · потім 129 ₴/міс',
      features: [
        { ok: true, text: 'Весь контент без обмежень' },
        { ok: true, text: 'Жодної реклами' },
      ],
      btnLabel: 'Оформити за 129 ₴',
      featured: false
    },
    {
      badge: 'НАЙВИГІДНІШЕ · 42% ВИГОДИ', badgeClass: 'pbadge-best',
      tier: 'annual', tierLabel: 'Річний',
      price: '890', unit: '₴/рік',
      note: 'Всього 74 ₴/міс · Економія 658 ₴',
      features: [
        { ok: true, text: 'Весь контент без обмежень' },
        { ok: true, text: 'Жодної реклами' },
        { ok: true, text: 'Офлайн-завантаження' },
        { ok: true, text: 'Ексклюзивний контент', highlight: true },
      ],
      btnLabel: 'Економте 658 ₴ на рік',
      featured: true
    },
  ]

  return (
    <section id="pricing" className="psection">
      <div className="phead">
        <div className="phead-icon">
          <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
            <rect x="8" y="16" width="40" height="26" rx="5" stroke="#EF9F27" strokeWidth="2.5" fill="none"/>
            <line x1="8" y1="25" x2="48" y2="25" stroke="#EF9F27" strokeWidth="2.5"/>
            <rect x="14" y="33" width="10" height="4" rx="2" fill="#EF9F27"/>
            <rect x="28" y="33" width="6" height="4" rx="2" fill="rgba(239,159,39,0.45)"/>
          </svg>
        </div>
        <div className="phead-text">
          <div className="phead-label">ПІДПИСКИ</div>
          <div className="phead-title">Оберіть свій план</div>
        </div>
      </div>

      <FreeViewTimer />

      <div className="pgrid">
        {plans.map(plan => (
          <div key={plan.tier} className={`pcard ${plan.featured ? 'pcard-featured' : ''}`}>
            {plan.badge && (
              <span className={`pbadge ${plan.badgeClass}`}>{plan.badge}</span>
            )}
            <div className="ptier">{plan.tierLabel}</div>
            <div className="pprice-row">
              <span className="pprice-num">{plan.price}</span>
              <span className="pprice-unit">{plan.unit}</span>
            </div>
            <p className="pnote">{plan.note}</p>
            <div className="pdivider" />
            <ul className="pfeatures">
              {plan.features.map(f => (
                <li key={f.text} className={(f as any).highlight ? 'pfeat-hl' : ''}>
                  <span className={`pmark ${f.ok ? 'ok' : 'no'}`}>{f.ok ? '✓' : '✕'}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>

            {(plan.tier === 'annual' || plan.tier === 'standard') && (
              <div className="pinstall">
                <div className="pinstall-label">Оплата частинами</div>
                <div className="pinstall-desc">
                  Без комісій · {plan.tier === 'annual' ? 'від 149 ₴/міс' : 'від 3 до 6 місяців'}
                </div>
                <div className="pinstall-btns">
                  <button onClick={() => setModal({ price: plan.price, tier: plan.tierLabel, unit: plan.unit })}>ПриватБанк</button>
                  <button onClick={() => setModal({ price: plan.price, tier: plan.tierLabel, unit: plan.unit })}>Ощадбанк</button>
                </div>
              </div>
            )}

            {plan.tier === 'annual' && (
              <p
                onClick={() => {
                  try { if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'click_annual_no_refund_policy') } catch(_) {}
                }}
                className="pannual-note"
              >
                Підписку можна скасувати в будь-який момент. Доступ зберігається до кінця оплаченого періоду.
              </p>
            )}

            <button
              onClick={() => setModal({ price: plan.price, tier: plan.tierLabel, unit: plan.unit })}
              className="pcta"
            >
              {plan.btnLabel}
            </button>
          </div>
        ))}
      </div>

      {modal && <PaymentModal pkg={modal} onClose={() => setModal(null)} />}

      <style jsx>{`
        .psection {
          background: linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%);
          padding: 40px 22px 48px;
          border-radius: 18px;
          margin-bottom: 56px;
          position: relative;
          overflow: hidden;
        }
        .psection::before, .psection::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(239,159,39,0.22), transparent 70%);
          pointer-events: none;
        }
        .psection::before { width: 260px; height: 260px; top: -70px; right: -70px; }
        .psection::after { width: 220px; height: 220px; bottom: -50px; left: -50px; }

        .phead {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 22px;
          position: relative;
          z-index: 1;
          text-align: center;
        }
        .phead-icon {
          width: 60px; height: 60px;
          border-radius: 15px;
          background: rgba(239,159,39,0.12);
          border: 1.5px solid rgba(239,159,39,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .phead-text { text-align: left; }
        .phead-label {
          color: #EF9F27;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2.2px;
          margin-bottom: 4px;
          font-family: 'Montserrat', Arial, sans-serif;
        }
        .phead-title {
          font-family: 'Lora', Georgia, serif;
          color: #FFFFFF;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .pgrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
          position: relative;
          z-index: 1;
        }

        .pcard {
          background: linear-gradient(180deg, #2C1A02 0%, #4A2F0A 100%);
          border: 2px solid #FAC775;
          border-radius: 18px;
          padding: 32px 22px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      border-color 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pcard:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 34px rgba(239, 159, 39, 0.5);
          border-color: #FFD888;
        }
        .pcard-featured {
          background: linear-gradient(180deg, #BA7517 0%, #854F0B 100%);
          border-color: #FAC775;
          border-width: 2.5px;
          animation: pulseGlow 2.6s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(250, 199, 117, 0.55); }
          50% { box-shadow: 0 0 0 14px rgba(250, 199, 117, 0); }
        }

        .pbadge {
          position: absolute;
          top: -13px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.3px;
          padding: 6px 14px;
          border-radius: 14px;
          white-space: nowrap;
          color: #FFFFFF !important;
          font-family: 'Montserrat', Arial, sans-serif;
          animation: badgePulse 2.6s ease-in-out infinite;
        }
        .pbadge-gold { background: #EF9F27; }
        .pbadge-gray { background: #5F5E5A; }
        .pbadge-best {
          background: linear-gradient(90deg, #BA7517 0%, #EF9F27 50%, #BA7517 100%);
          background-size: 200% auto;
          border: 1.5px solid #FFD888;
          box-shadow: 0 4px 14px rgba(239, 159, 39, 0.5);
          font-size: 12px;
          padding: 7px 18px;
          top: -15px;
        }
        @keyframes badgePulse {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-2px); }
        }

        .ptier {
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.8px;
          color: #FAC775 !important;
          margin-bottom: 12px;
          font-family: 'Montserrat', Arial, sans-serif;
        }

        .pprice-row {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .pprice-num {
          font-family: 'Lora', Georgia, serif;
          font-size: 68px;
          font-weight: 700;
          color: #FFFFFF !important;
          line-height: 1;
        }
        .pprice-unit {
          font-size: 17px;
          color: #FAC775 !important;
          font-weight: 700;
          font-family: 'Montserrat', Arial, sans-serif;
        }
        .pnote {
          font-size: 14px;
          color: rgba(255, 248, 234, 0.92) !important;
          line-height: 1.5;
          margin: 10px 12px 16px;
          min-height: 42px;
        }
        .pdivider {
          height: 1px;
          background: rgba(250, 199, 117, 0.3);
          margin: 0 0 16px;
          width: 100%;
        }

        .pfeatures {
          list-style: none;
          padding: 0;
          margin: 0 0 18px;
          flex: 1;
          width: 100%;
        }
        .pfeatures li {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 10px;
          padding: 7px 0;
          font-size: 16px;
          color: #FFF8EA !important;
          line-height: 1.45;
          text-align: left;
          max-width: 220px;
          margin: 0 auto;
        }
        .pmark {
          flex-shrink: 0;
          font-weight: 700;
          width: 18px;
          text-align: center;
          font-size: 17px;
        }
        .pmark.ok { color: #FAC775 !important; }
        .pmark.no { color: #F09595 !important; }
        .pfeat-hl {
          font-weight: 700;
          background: rgba(250, 199, 117, 0.22);
          border: 1px solid rgba(250, 199, 117, 0.5);
          border-radius: 8px;
          padding: 7px 10px !important;
          max-width: 230px !important;
        }
        .pfeat-hl .pmark.ok { color: #FFD888 !important; }
        .pfeat-hl span:last-child { color: #FFFFFF !important; }

        .pinstall {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(250, 199, 117, 0.4);
          border-radius: 12px;
          padding: 12px 14px;
          margin: 0 0 14px;
          width: 100%;
        }
        .pinstall-label {
          font-size: 13px;
          font-weight: 700;
          color: #FAC775 !important;
          margin-bottom: 5px;
          letter-spacing: 0.6px;
          font-family: 'Montserrat', Arial, sans-serif;
        }
        .pinstall-desc {
          font-size: 12px;
          color: rgba(255, 248, 234, 0.88) !important;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .pinstall-btns {
          display: flex;
          gap: 8px;
        }
        .pinstall-btns button {
          flex: 1;
          padding: 9px 6px;
          border-radius: 8px;
          border: 1.5px solid #FAC775;
          background: #EF9F27;
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF !important;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          font-family: 'Montserrat', Arial, sans-serif;
        }
        .pinstall-btns button:hover {
          background: #BA7517;
          color: #FFFFFF !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        }
        .pinstall-btns button:active {
          background: #854F0B;
          color: #FFFFFF !important;
          transform: translateY(0);
        }

        .pannual-note {
          font-size: 11px;
          color: rgba(255, 248, 234, 0.7) !important;
          margin-bottom: 12px;
          line-height: 1.5;
          cursor: pointer;
          text-align: center;
        }

        .pcta {
          display: block;
          padding: 16px 14px;
          border-radius: 12px;
          border: 1.5px solid #FAC775;
          background: #EF9F27;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          width: 100%;
          text-align: center;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          letter-spacing: 0.4px;
          color: #FFFFFF !important;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
          font-family: 'Montserrat', Arial, sans-serif;
          animation: ctaBreath 2.5s ease-in-out infinite;
        }
        .pcta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
          background: #BA7517;
          color: #FFFFFF !important;
          border-color: #FFD888;
        }
        .pcta:active {
          background: #854F0B;
          color: #FFFFFF !important;
          transform: translateY(0);
        }
        @keyframes ctaBreath {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 248, 234, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(255, 248, 234, 0); }
        }

        @media (max-width: 640px) {
          .pgrid { grid-template-columns: 1fr; }
          .pprice-num { font-size: 56px; }
          .phead-title { font-size: 24px; }
        }
      `}</style>
    </section>
  )
}
