'use client'

/**
 * BALABONY — PricingSection v25 (FINAL, продакшн-готовий)
 *
 * Новий дизайн (структура з 4-х планів + утилітарний рядок + подарунки)
 * + існуюча логіка оплати з бекапу 19.05.2026 (LiqPay, ПриватБанк, Ощадбанк).
 *
 * Структура файлу:
 *   1. Константи + утиліти (FreeViewTimer, форматування)
 *   2. Функції оплати (initiatePayment, initiateInstallment, trackPurchase)
 *   3. PaymentModal (з підтримкою ДІЯ, річної згоди, банків)
 *   4. Дані планів (PLANS, GIFTS)
 *   5. Головний компонент PricingSection
 *   6. Sub-компоненти (PlanCard, GiftSection, GiftIcon, SectionLabel)
 *   7. Стилі (styled-jsx)
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ═════════════════════════════════════════════════════════════════════
// 1. FREE VIEW TIMER (8-годинний цикл нових історій)
// ═════════════════════════════════════════════════════════════════════

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

// ═════════════════════════════════════════════════════════════════════
// 2. ФУНКЦІЇ ОПЛАТИ (з бекапу 19.05.2026 — не чіпати)
// ═════════════════════════════════════════════════════════════════════

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

async function initiateInstallment(
  provider: 'privat' | 'oschadbank',
  amount: number,
  packageLabel: string
) {
  try {
    const endpoint = provider === 'privat'
      ? '/api/payment/installment/privat'
      : '/api/payment/installment/oschadbank'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, package: packageLabel, currency: 'UAH' }),
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

// ═════════════════════════════════════════════════════════════════════
// 3. PAYMENT MODAL
// ═════════════════════════════════════════════════════════════════════

interface PaymentModalProps {
  pkg: { price: string; tier: string; unit: string }
  onClose: () => void
}

function PaymentModal({ pkg, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [installmentLoading, setInstallmentLoading] = useState<'privat' | 'oschadbank' | null>(null)
  const [agreed, setAgreed] = useState(false)

  const handlePay = async () => {
    setLoading(true)
    trackPurchase(pkg.price)
    await initiatePayment(pkg)
    setLoading(false)
  }

  const handleInstallment = async (provider: 'privat' | 'oschadbank') => {
    setInstallmentLoading(provider)
    trackPurchase('installment_' + provider)
    await initiateInstallment(provider, parseInt(pkg.price), pkg.tier)
    setInstallmentLoading(null)
  }

  const isDia = pkg.price === '1'
  // План вважається "річним" якщо у його назві є слово "Річний"
  // (підходить як для звичайного, так і для сімейного річного)
  const isAnnual = pkg.tier.includes('Річний')
  const canInstallment = isAnnual // оплата частинами лише для річних планів

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        padding: '16px',
      }}
    >
      <div style={{
        background: 'var(--white, #fff)',
        padding: '36px 32px',
        borderRadius: 24,
        width: '90%',
        maxWidth: 420,
        textAlign: 'center',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h3 style={{
          fontFamily: "'Lora', serif",
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 6,
        }}>
          Оплата пакету
        </h3>
        <p style={{
          fontSize: 14,
          color: 'var(--muted, #64748b)',
          marginBottom: 24,
        }}>
          {pkg.tier} — {pkg.price} {pkg.unit}
        </p>

        {isDia ? (
          <>
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
              fontSize: 13,
              color: '#0369a1',
              lineHeight: 1.5,
            }}>
              Для отримання доступу за 1 ₴ потрібна верифікація через застосунок Дія
            </div>
            <button
              onClick={handlePay}
              disabled={loading}
              style={{
                display: 'block',
                width: '100%',
                padding: 14,
                borderRadius: 12,
                border: 'none',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                marginBottom: 10,
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              {loading ? 'Завантаження...' : 'Підтвердити через Дія'}
            </button>
          </>
        ) : (
          <>
            <div style={{
              background: '#fafafa',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 13,
              color: '#64748b',
            }}>
              Visa, Mastercard, Apple Pay, Google Pay
            </div>

            {isAnnual && (
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 16,
                cursor: 'pointer',
                textAlign: 'left',
              }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{
                    marginTop: 2,
                    flexShrink: 0,
                    width: 16,
                    height: 16,
                    cursor: 'pointer',
                  }}
                />
                <span style={{
                  fontSize: 12,
                  color: 'var(--muted, #64748b)',
                  lineHeight: 1.5,
                }}>
                  Я погоджуюсь з умовами надання послуг та підтверджую, що скасування автопродовження можливе будь-коли,
                  але оплачений рік залишається доступним до кінця періоду без повернення коштів.
                </span>
              </label>
            )}

            <button
              onClick={handlePay}
              disabled={loading || (isAnnual && !agreed)}
              style={{
                display: 'block',
                width: '100%',
                padding: 14,
                borderRadius: 12,
                border: 'none',
                background: 'var(--accent-gold, #EF9F27)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                marginBottom: 10,
                fontFamily: "'Montserrat', sans-serif",
                opacity: (isAnnual && !agreed) ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Перенаправлення...' : `Оплатити ${pkg.price} ₴`}
            </button>

            {canInstallment && (
              <div style={{
                marginTop: 20,
                borderTop: '1px solid var(--border, #e2e8f0)',
                paddingTop: 20,
              }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text, #1a1a1a)',
                  marginBottom: 6,
                }}>
                  Купуй зараз — плати частинами
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'var(--muted, #64748b)',
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}>
                  Без комісій та переплат · від 3 до 6 місяців · доступ одразу після першого платежу
                </div>
                <div style={{
                  background: '#fff8ed',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 14,
                  fontSize: 11,
                  color: '#92400e',
                  lineHeight: 1.5,
                }}>
                  При оплаті частинами також діє правило «Без повернення залишку», оскільки це річний контракт.
                </div>

                <button
                  onClick={() => handleInstallment('privat')}
                  disabled={installmentLoading !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 12,
                    marginBottom: 10,
                    border: '1.5px solid #1B4F9B',
                    background: installmentLoading === 'privat' ? '#e8f0fe' : '#fff',
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
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      ПриватБанк · {pkg.tier.includes('Сімейний') ? 'від 232 ₴/міс' : 'від 148 ₴/міс'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleInstallment('oschadbank')}
                  disabled={installmentLoading !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 12,
                    marginBottom: 4,
                    border: '1.5px solid #007A3D',
                    background: installmentLoading === 'oschadbank' ? '#e8f5ee' : '#fff',
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
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Ощадбанк · {pkg.tier.includes('Сімейний') ? 'від 232 ₴/міс' : 'від 148 ₴/міс'}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            background: 'none',
            border: 'none',
            color: 'var(--muted, #64748b)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: "'Montserrat', sans-serif",
            display: 'block',
            width: '100%',
          }}
        >
          Скасувати
        </button>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════
// 4. ТИПИ І ДАНІ
// ═════════════════════════════════════════════════════════════════════

type PaymentPkg = { price: string; tier: string; unit: string }

interface PlanConfig {
  tier: string          // службова назва (для logiki: 'monthly', 'annual', ...)
  tierLabel: string     // для відображення і для PaymentModal
  name: string
  price: string         // як рядок, бо initiatePayment приймає рядок
  priceLabel: string    // "129 ₴"
  priceSuffix: string   // "/міс"
  unit: string          // "₴/міс" — передається в PaymentModal
  subline?: string
  perks: { text: string; highlight?: boolean }[]
  cta: string
  ctaStyle: 'outline' | 'primary-glow'
  cancelMain: string
  cancelSub: string
  hasInstallments: boolean
  installmentFrom?: number
  featured?: boolean
  badge?: string
}

interface GiftConfig {
  tier: string
  period: string
  price: number
  priceLabel: string  // "1 390 ₴"
  saveAmount?: number
  isFamily?: boolean
  description?: string
  unit: string
}

const PLANS: PlanConfig[] = [
  {
    tier: 'monthly',
    tierLabel: 'Місячний',
    name: 'Місячний',
    price: '129',
    priceLabel: '129 ₴',
    priceSuffix: '/міс',
    unit: '₴/міс',
    subline: 'Перший місяць — 49 ₴, далі 129 ₴',
    perks: [
      { text: 'Жодної реклами' },
      { text: 'Офлайн-завантаження' },
      { text: 'Усі відкриті серії Балабонів' },
    ],
    cta: 'Підписатись',
    ctaStyle: 'outline',
    cancelMain: 'Скасуй коли хочеш',
    cancelSub: 'доступ до кінця місяця',
    hasInstallments: false,
  },
  {
    tier: 'annual',
    tierLabel: 'Річний',
    name: 'Річний',
    price: '890',
    priceLabel: '890 ₴',
    priceSuffix: '/рік',
    unit: '₴/рік',
    subline: 'Всього 74 ₴/міс · економія 658 ₴',
    perks: [
      { text: 'Жодної реклами' },
      { text: 'Офлайн-завантаження' },
      { text: 'Усі відкриті серії Балабонів' },
      { text: 'Закриті серії Балабонів', highlight: true },
      { text: 'Тиждень для знайомства', highlight: true },
    ],
    cta: 'Спробувати тиждень',
    ctaStyle: 'primary-glow',
    cancelMain: 'Скасуй автопродовження коли хочеш',
    cancelSub: 'оплачений рік залишається твоїм',
    hasInstallments: true,
    installmentFrom: 148,
    featured: true,
    badge: 'НАЙВИГІДНІШЕ · 42%',
  },
  {
    tier: 'family-monthly',
    tierLabel: 'Сімейний місячний',
    name: 'Сімейний місячний',
    price: '199',
    priceLabel: '199 ₴',
    priceSuffix: '/міс',
    unit: '₴/міс',
    subline: '50 ₴ на особу · до 4 акаунтів',
    perks: [
      { text: 'Жодної реклами для всіх' },
      { text: 'Офлайн-завантаження' },
      { text: 'Усі відкриті серії Балабонів' },
      { text: 'До 4 акаунтів у родині' },
    ],
    cta: 'Підписатись',
    ctaStyle: 'outline',
    cancelMain: 'Скасуй коли хочеш',
    cancelSub: 'доступ до кінця місяця',
    hasInstallments: false,
  },
  {
    tier: 'family-annual',
    tierLabel: 'Сімейний річний',
    name: 'Сімейний річний',
    price: '1390',
    priceLabel: '1 390 ₴',
    priceSuffix: '/рік',
    unit: '₴/рік',
    subline: 'Всього 29 ₴ на особу/міс · економія 998 ₴',
    perks: [
      { text: 'Жодної реклами для всіх' },
      { text: 'Офлайн-завантаження' },
      { text: 'Усі відкриті серії Балабонів' },
      { text: 'До 4 акаунтів у родині' },
      { text: 'Закриті серії Балабонів', highlight: true },
      { text: 'Тиждень для знайомства', highlight: true },
    ],
    cta: 'Спробувати тиждень',
    ctaStyle: 'primary-glow',
    cancelMain: 'Скасуй автопродовження коли хочеш',
    cancelSub: 'оплачений рік залишається твоїм',
    hasInstallments: true,
    installmentFrom: 232,
    featured: true,
    badge: 'НАЙВИГІДНІШЕ · 42%',
  },
]

const GIFTS_INDIVIDUAL: GiftConfig[] = [
  { tier: 'gift-1m', period: '1 місяць', price: 129, priceLabel: '129 ₴', unit: '₴ (подарунок)' },
  { tier: 'gift-3m', period: '3 місяці', price: 349, priceLabel: '349 ₴', saveAmount: 38, unit: '₴ (подарунок)' },
  { tier: 'gift-6m', period: '6 місяців', price: 699, priceLabel: '699 ₴', saveAmount: 75, unit: '₴ (подарунок)' },
  { tier: 'gift-1y', period: 'Рік', price: 890, priceLabel: '890 ₴', saveAmount: 658, unit: '₴ (подарунок)' },
]

const GIFT_FAMILY: GiftConfig = {
  tier: 'gift-family-1y',
  period: 'Сімейний річний',
  price: 1390,
  priceLabel: '1 390 ₴',
  saveAmount: 998,
  isFamily: true,
  description: 'До 4 акаунтів',
  unit: '₴ (подарунок)',
}

// ═════════════════════════════════════════════════════════════════════
// 5. ГОЛОВНИЙ КОМПОНЕНТ
// ═════════════════════════════════════════════════════════════════════

export default function PricingSection() {
  const [modal, setModal] = useState<PaymentPkg | null>(null)

  const openPaymentForPlan = useCallback((plan: PlanConfig) => {
    setModal({
      price: plan.price,
      tier: plan.tierLabel,
      unit: plan.unit,
    })
  }, [])

  const openPaymentForOneTime = useCallback(() => {
    setModal({ price: '9', tier: 'Поштучно', unit: '₴/шт' })
  }, [])

  const openPaymentForConcessional = useCallback(() => {
    setModal({ price: '1', tier: 'Пільговий', unit: '₴/рік' })
  }, [])

  const openPaymentForGift = useCallback((gift: GiftConfig) => {
    setModal({
      price: String(gift.price),
      tier: `Подарунок · ${gift.period}`,
      unit: gift.unit,
    })
  }, [])

  const handleGiftCtaClick = useCallback(() => {
    // Перехід на дедиковану сторінку подарунків (буде в Пріоритеті 2)
    if (typeof window !== 'undefined') {
      window.location.href = '/gift'
    }
  }, [])

  return (
    <section id="pricing" className="bb-pricing-wrap">

      {/* HEADER */}
      <header className="bb-pricing-header">
        <div className="bb-pricing-eyebrow">Підписка</div>
        <h2 className="bb-pricing-title">
          Обери <span className="bb-pricing-accent">свій план</span>
        </h2>
        <p className="bb-pricing-subtitle">Платиш лише за те, що читаєш</p>
      </header>

      {/* FREE VIEW TIMER */}
      <FreeViewTimer />

      {/* UTILITY ROW */}
      <div className="bb-pricing-util-row">
        <button
          type="button"
          className="bb-pricing-util"
          onClick={openPaymentForOneTime}
        >
          <div className="bb-pricing-util-info">
            <div className="bb-pricing-util-name">Без підписки</div>
            <div className="bb-pricing-util-sub">Одна історія або серія</div>
          </div>
          <div className="bb-pricing-util-price">9 ₴</div>
        </button>

        <button
          type="button"
          className="bb-pricing-util"
          onClick={openPaymentForConcessional}
        >
          <div className="bb-pricing-util-info">
            <div className="bb-pricing-util-name">Пільговий доступ</div>
            <div className="bb-pricing-util-sub">
              <span>УБД, ВПО або інвалідність</span>
              <span className="bb-pricing-diya-tag">Валідація через ДІЯ</span>
            </div>
          </div>
          <div className="bb-pricing-util-price-wrap">
            <span className="bb-pricing-util-price">1 ₴</span>
            <span className="bb-pricing-util-period">/ рік</span>
          </div>
        </button>
      </div>

      {/* FOR SELF */}
      <SectionLabel text="Для себе" />
      <div className="bb-pricing-grid">
        <PlanCard plan={PLANS[0]} onSubscribe={() => openPaymentForPlan(PLANS[0])} onInstallment={() => openPaymentForPlan(PLANS[0])} />
        <PlanCard plan={PLANS[1]} onSubscribe={() => openPaymentForPlan(PLANS[1])} onInstallment={() => openPaymentForPlan(PLANS[1])} />
      </div>

      {/* FOR FAMILY */}
      <SectionLabel text="Для родини" />
      <div className="bb-pricing-grid">
        <PlanCard plan={PLANS[2]} onSubscribe={() => openPaymentForPlan(PLANS[2])} onInstallment={() => openPaymentForPlan(PLANS[2])} />
        <PlanCard plan={PLANS[3]} onSubscribe={() => openPaymentForPlan(PLANS[3])} onInstallment={() => openPaymentForPlan(PLANS[3])} />
      </div>

      {/* GIFT SECTION */}
      <GiftSection
        gifts={GIFTS_INDIVIDUAL}
        family={GIFT_FAMILY}
        onGiftClick={openPaymentForGift}
        onGiftCta={handleGiftCtaClick}
      />

      {/* РОЗМЕЖУВАННЯ ВОРОНОК — некомерційний напрям ГО */}
      <p style={{
        maxWidth: 720,
        margin: '28px auto 0',
        padding: '16px 18px 0',
        fontSize: 13,
        lineHeight: 1.65,
        color: 'rgba(255,255,255,0.62)',
        textAlign: 'center',
        fontFamily: "'Montserrat', Arial, sans-serif",
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        Передплата підтримує роботу платформи й гонорари авторів. Соціальний тариф 1&nbsp;₴/рік
        (для УБД, ВПО та людей з інвалідністю) і благодійні внески — окремий некомерційний напрям
        ГО «Інститут громадянського суспільства». Повна назва партнера —
        Львівська обласна громадська організація «Інститут громадянського суспільства».{' '}
        <a href="/support" style={{ color: '#EF9F27', textDecoration: 'none', fontWeight: 600 }}>
          Підтримати ініціативу →
        </a>
      </p>

      {/* PAYMENT MODAL */}
      {modal && <PaymentModal pkg={modal} onClose={() => setModal(null)} />}

      {/* STYLES */}
      <style jsx>{styles}</style>
    </section>
  )
}

// ═════════════════════════════════════════════════════════════════════
// 6. SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="bb-pricing-section-label">
      <span className="bb-pricing-section-label-text">{text}</span>
      <span className="bb-pricing-section-label-line" />
    </div>
  )
}

function PlanCard({
  plan,
  onSubscribe,
  onInstallment,
}: {
  plan: PlanConfig
  onSubscribe: () => void
  onInstallment: () => void
}) {
  return (
    <div className={`bb-pricing-card ${plan.featured ? 'bb-pricing-card-featured' : ''}`}>
      {plan.badge && <div className="bb-pricing-badge">{plan.badge}</div>}

      <div className="bb-pricing-card-name">{plan.name}</div>
      <div className="bb-pricing-price-main">
        {plan.priceLabel}
        <small>{plan.priceSuffix}</small>
      </div>
      {plan.subline && (
        <div
          className="bb-pricing-price-sub"
          dangerouslySetInnerHTML={{ __html: formatSubline(plan.subline) }}
        />
      )}

      <ul className="bb-pricing-perks">
        {plan.perks.map((perk, i) => (
          <li key={i} className={perk.highlight ? 'bb-pricing-perk-highlight' : ''}>
            {perk.text}
          </li>
        ))}
      </ul>

      {plan.hasInstallments && plan.installmentFrom && (
        <div className="bb-pricing-installments">
          <div className="bb-pricing-installments-title">Оплата частинами</div>
          <div className="bb-pricing-installments-sub">
            Без комісій · від <b>{plan.installmentFrom} ₴/міс</b> на 3–6 місяців
          </div>
          <div className="bb-pricing-bank-row">
            <button
              type="button"
              className="bb-pricing-bank-btn bb-pricing-bank-pb"
              onClick={onInstallment}
            >
              ПриватБанк
            </button>
            <button
              type="button"
              className="bb-pricing-bank-btn bb-pricing-bank-os"
              onClick={onInstallment}
            >
              Ощадбанк
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`bb-pricing-cta ${plan.ctaStyle === 'outline' ? 'bb-pricing-cta-outline' : 'bb-pricing-cta-glow'}`}
        onClick={onSubscribe}
      >
        {plan.cta}
      </button>

      <div className="bb-pricing-cancel">
        <span className="bb-pricing-cancel-line"><b>{plan.cancelMain}</b></span>
        <span className="bb-pricing-cancel-second">{plan.cancelSub}</span>
      </div>
    </div>
  )
}

function GiftSection({
  gifts,
  family,
  onGiftClick,
  onGiftCta,
}: {
  gifts: GiftConfig[]
  family: GiftConfig
  onGiftClick: (gift: GiftConfig) => void
  onGiftCta: () => void
}) {
  return (
    <div className="bb-pricing-gift">
      <div className="bb-pricing-gift-head">
        <GiftIcon />
        <h3 className="bb-pricing-gift-title">Подарувати підписку</h3>
      </div>
      <p className="bb-pricing-gift-text">
        Внукам — бабусям, батькам — друзям. Електронна вітальна картка приходить на пошту в день, який обереш.
      </p>

      <div className="bb-pricing-gift-section-label">Індивідуально</div>
      <div className="bb-pricing-gift-options">
        {gifts.map((gift) => (
          <button
            type="button"
            key={gift.tier}
            className="bb-pricing-gift-opt"
            onClick={() => onGiftClick(gift)}
          >
            <div className="bb-pricing-gift-opt-period">{gift.period}</div>
            <div className="bb-pricing-gift-opt-price">{gift.priceLabel}</div>
            <div className="bb-pricing-gift-opt-save">
              {gift.saveAmount ? `−${gift.saveAmount} ₴` : '\u00a0'}
            </div>
          </button>
        ))}
      </div>

      <div className="bb-pricing-gift-section-label bb-pricing-gift-section-label-second">Сімейно</div>
      <button
        type="button"
        className="bb-pricing-gift-family"
        onClick={() => onGiftClick(family)}
      >
        <div className="bb-pricing-gift-family-info">
          <div className="bb-pricing-gift-family-period">{family.period}</div>
          <div className="bb-pricing-gift-family-save">
            {family.description} · −{family.saveAmount} ₴
          </div>
        </div>
        <div className="bb-pricing-gift-family-price">{family.priceLabel}</div>
      </button>

      <button type="button" className="bb-pricing-gift-cta" onClick={onGiftCta}>
        Подарувати
      </button>
    </div>
  )
}

function GiftIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="bb-pricing-gift-icon"
    >
      <rect x="8" y="20" width="32" height="22" rx="2" fill="rgba(255,179,71,0.18)" stroke="#FFB347" strokeWidth="2"/>
      <rect x="6" y="16" width="36" height="6" rx="1.5" fill="rgba(255,179,71,0.35)" stroke="#FFB347" strokeWidth="2"/>
      <rect x="22" y="16" width="4" height="26" fill="#FFB347"/>
      <path d="M 24 16 C 18 10, 14 10, 14 14 C 14 17, 19 18, 24 16 Z" fill="#FFB347"/>
      <path d="M 24 16 C 30 10, 34 10, 34 14 C 34 17, 29 18, 24 16 Z" fill="#FFB347"/>
      <circle cx="24" cy="16" r="2.5" fill="#0a1a33" stroke="#FFB347" strokeWidth="1.5"/>
      <line x1="13" y1="28" x2="20" y2="28" stroke="rgba(255,179,71,0.5)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="13" y1="32" x2="19" y2="32" stroke="rgba(255,179,71,0.5)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="28" y1="28" x2="35" y2="28" stroke="rgba(255,179,71,0.5)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="28" y1="32" x2="35" y2="32" stroke="rgba(255,179,71,0.5)" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

// ═════════════════════════════════════════════════════════════════════
// 7. HELPERS
// ═════════════════════════════════════════════════════════════════════

function formatSubline(text: string): string {
  // Виокремлюємо ключові цифри в <b>...</b> для золотого кольору
  return text
    .replace(/(\d+\s*₴\s*на\s*особу(?:\/міс)?)/g, '<b>$1</b>')
    .replace(/(\d+\s*₴(?:\/міс)?)/g, (m) => (m.includes('</b>') ? m : `<b>${m}</b>`))
}

// ═════════════════════════════════════════════════════════════════════
// 8. СТИЛІ
// ═════════════════════════════════════════════════════════════════════

const styles = `
  .bb-pricing-wrap {
    background: linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%);
    border-radius: 18px;
    padding: 40px 22px 32px;
    font-family: 'Montserrat', Arial, sans-serif;
    max-width: 920px;
    margin: 0 auto 20px;
    color: #fff;
    position: relative;
    overflow: hidden;
  }
  .bb-pricing-wrap::before, .bb-pricing-wrap::after {
    content: none;
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(239,159,39,0.22), transparent 70%);
    pointer-events: none;
  }
  .bb-pricing-wrap::before { width: 260px; height: 260px; top: -70px; right: -70px; }
  .bb-pricing-wrap::after { width: 220px; height: 220px; bottom: -50px; left: -50px; }

  /* HEADER */
  .bb-pricing-header { text-align: center; margin-bottom: 26px; position: relative; z-index: 1; }
  .bb-pricing-eyebrow {
    display: inline-block;
    font-size: 13px;
    font-weight: 800;
    color: #FFB347;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 12px;
    padding: 6px 14px;
    background: rgba(255,179,71,0.12);
    border: 1px solid rgba(255,179,71,0.45);
    border-radius: 20px;
    animation: bbEyebrowGlow 2.4s ease-in-out infinite;
  }
  @keyframes bbEyebrowGlow {
    0%, 100% { box-shadow: 0 0 8px rgba(255,179,71,0.3); }
    50% { box-shadow: 0 0 20px rgba(255,179,71,0.7); }
  }
  .bb-pricing-title {
    font-size: 30px;
    font-weight: 800;
    color: #fff;
    line-height: 1.15;
    margin: 0 0 8px;
  }
  .bb-pricing-accent {
    background: linear-gradient(135deg, #EF9F27 0%, #FAC775 50%, #FFB347 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .bb-pricing-subtitle {
    font-size: 14px;
    color: #B5D4F4;
    font-weight: 500;
    margin: 0;
  }

  /* UTILITY ROW */
  .bb-pricing-util-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 26px;
    position: relative;
    z-index: 1;
  }
  .bb-pricing-util {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(239,159,39,0.3);
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: inherit;
    text-align: left;
    color: inherit;
    width: 100%;
  }
  .bb-pricing-util:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(239,159,39,0.6);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239,159,39,0.15);
  }
  .bb-pricing-util:active { transform: translateY(0) scale(0.99); }
  .bb-pricing-util-name {
    font-size: 14px;
    color: #FFFFFF !important;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .bb-pricing-util-sub {
    font-size: 13px;
    color: #B5D4F4;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .bb-pricing-diya-tag {
    display: inline-flex;
    font-size: 12px;
    background: linear-gradient(135deg, #FFB347, #FAC775);
    color: #0a1a33 !important;
    padding: 3px 9px;
    border-radius: 5px;
    font-weight: 800;
  }
  .bb-pricing-util-price-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1;
  }
  .bb-pricing-util-price {
    font-size: 24px;
    font-weight: 800;
    color: #EF9F27;
    white-space: nowrap;
  }
  .bb-pricing-util-period {
    font-size: 11px;
    color: #B5D4F4;
    font-weight: 500;
    margin-top: 3px;
    letter-spacing: 0.3px;
  }

  /* SECTION LABEL */
  .bb-pricing-section-label {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 12px 0 16px;
    position: relative;
    z-index: 1;
  }
  .bb-pricing-section-label-text {
    font-size: 15px;
    font-weight: 800;
    color: #FFB347;
    letter-spacing: 2px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .bb-pricing-section-label-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, rgba(255,179,71,0.5), transparent);
  }

  /* GRID & CARDS */
  .bb-pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 28px;
    position: relative;
    z-index: 1;
  }
  .bb-pricing-card {
    background: linear-gradient(180deg, rgba(239,159,39,0.06) 0%, rgba(239,159,39,0.02) 100%);
    border: 1.5px solid rgba(239,159,39,0.55);
    border-radius: 14px;
    padding: 26px 22px 22px;
    position: relative;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
  }
  .bb-pricing-card:hover {
    border-color: rgba(239,159,39,0.85);
    box-shadow: 0 6px 20px rgba(239,159,39,0.15);
  }
  .bb-pricing-card-featured {
    background: linear-gradient(180deg, rgba(239,159,39,0.20) 0%, rgba(239,159,39,0.05) 100%);
    border: 1.5px solid #EF9F27;
    box-shadow: 0 0 12px rgba(239,159,39,0.22);
  }
  .bb-pricing-card-featured:hover {
    box-shadow: 0 0 18px rgba(239,159,39,0.32);
  }
  .bb-pricing-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #EF9F27, #FAC775);
    color: #0E1A2B !important;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    padding: 6px 14px;
    border-radius: 12px;
    white-space: nowrap;
    animation: bbBadgePulse 2.4s ease-in-out infinite;
  }
  @keyframes bbBadgePulse {
    0%, 100% { box-shadow: 0 0 8px rgba(239,159,39,0.5); }
    50% { box-shadow: 0 0 20px rgba(239,159,39,0.95); }
  }
  .bb-pricing-card-name {
    font-size: 14px;
    color: #B5D4F4;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .bb-pricing-price-main {
    font-size: 38px;
    font-weight: 800;
    color: #fff;
    line-height: 1;
    margin-bottom: 5px;
  }
  .bb-pricing-price-main small {
    font-size: 16px;
    color: #B5D4F4;
    font-weight: 500;
  }
  .bb-pricing-price-sub {
    font-size: 14px;
    color: #B5D4F4;
    margin-bottom: 18px;
    line-height: 1.45;
  }
  .bb-pricing-price-sub :global(b) {
    color: #EF9F27;
    font-weight: 700;
  }

  /* PERKS */
  .bb-pricing-perks {
    list-style: none;
    padding: 0;
    margin: 0 0 18px;
    flex: 1;
  }
  .bb-pricing-perks li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 15px;
    color: rgba(255,255,255,0.95);
    line-height: 1.5;
    margin-bottom: 10px;
  }
  .bb-pricing-perks li::before {
    content: "\\2713";
    color: #EF9F27;
    font-weight: 700;
    flex-shrink: 0;
    width: 16px;
    font-size: 17px;
  }
  .bb-pricing-perk-highlight {
    color: #FFB347 !important;
    font-weight: 600;
  }

  /* INSTALLMENTS */
  .bb-pricing-installments {
    margin-bottom: 14px;
    padding: 12px;
    background: rgba(239,159,39,0.10);
    border: 1px solid rgba(239,159,39,0.35);
    border-radius: 10px;
    transition: all 0.25s;
  }
  .bb-pricing-installments:hover {
    background: rgba(239,159,39,0.16);
    border-color: rgba(239,159,39,0.6);
  }
  .bb-pricing-installments-title {
    font-size: 13px;
    font-weight: 800;
    color: #FFB347;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .bb-pricing-installments-sub {
    font-size: 13px;
    color: #FFFFFF !important;
    line-height: 1.5;
    margin-bottom: 10px;
  }
  .bb-pricing-installments-sub b {
    color: #EF9F27;
    font-weight: 700;
  }

  /* BANK BUTTONS */
  .bb-pricing-bank-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .bb-pricing-bank-btn {
    padding: 10px 8px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    text-align: center;
    cursor: pointer;
    font-family: inherit;
    border: 1.5px solid;
    transition: all 0.2s ease;
    user-select: none;
  }
  .bb-pricing-bank-pb {
    background: rgba(0,174,70,0.15);
    border-color: #00AE46;
    color: #4CD881;
  }
  .bb-pricing-bank-pb:hover {
    background: rgba(0,174,70,0.32);
    box-shadow: 0 0 14px rgba(0,174,70,0.45);
    color: #6FE899;
    transform: translateY(-1px);
  }
  .bb-pricing-bank-pb:active { transform: translateY(0) scale(0.97); }
  .bb-pricing-bank-os {
    background: rgba(231,91,0,0.15);
    border-color: #E75B00;
    color: #FFA259;
  }
  .bb-pricing-bank-os:hover {
    background: rgba(231,91,0,0.32);
    box-shadow: 0 0 14px rgba(231,91,0,0.45);
    color: #FFBB7A;
    transform: translateY(-1px);
  }
  .bb-pricing-bank-os:active { transform: translateY(0) scale(0.97); }

  /* CTAs */
  .bb-pricing-cta {
    display: block;
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #EF9F27, #FAC775);
    color: #0E1A2B !important;
    text-align: center;
    border-radius: 10px;
    font-weight: 700;
    font-size: 16px;
    text-decoration: none;
    margin-bottom: 12px;
    border: none;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.25s ease;
    user-select: none;
  }
  .bb-pricing-cta-outline {
    background: transparent;
    color: #EF9F27 !important;
    border: 1.5px solid #EF9F27;
  }
  .bb-pricing-cta-outline:hover {
    background: rgba(239,159,39,0.15);
    color: #FAC775 !important;
    border-color: #FAC775;
    box-shadow: 0 4px 12px rgba(239,159,39,0.25);
    transform: translateY(-1px);
  }
  .bb-pricing-cta-outline:active { transform: translateY(0) scale(0.97); }
  .bb-pricing-cta-glow {
    animation: bbCtaGlow 2.4s ease-in-out infinite;
    box-shadow: 0 0 12px rgba(239,159,39,0.5);
  }
  @keyframes bbCtaGlow {
    0%, 100% { box-shadow: 0 0 12px rgba(239,159,39,0.5), 0 4px 8px rgba(0,0,0,0.2); }
    50% { box-shadow: 0 0 26px rgba(239,159,39,0.95), 0 4px 12px rgba(0,0,0,0.3); }
  }
  .bb-pricing-cta-glow:hover {
    background: linear-gradient(135deg, #FAC775, #FFB347);
    box-shadow: 0 0 30px rgba(250,199,117,1), 0 6px 14px rgba(0,0,0,0.3);
    transform: translateY(-2px) scale(1.02);
  }
  .bb-pricing-cta-glow:active { transform: translateY(0) scale(0.98); }

  /* CANCEL */
  .bb-pricing-cancel {
    font-size: 13px;
    color: #B5D4F4;
    line-height: 1.5;
    text-align: center;
  }
  .bb-pricing-cancel b {
    color: #FFFFFF !important;
    font-weight: 700;
  }
  .bb-pricing-cancel-line, .bb-pricing-cancel-second { display: block; }
  .bb-pricing-cancel-second { margin-top: 2px; }

  /* GIFT SECTION */
  .bb-pricing-gift {
    padding: 26px 22px;
    background: linear-gradient(180deg, rgba(255,179,71,0.12), rgba(255,179,71,0.02));
    border: 1.5px dashed #FFB347;
    border-radius: 14px;
    position: relative;
    z-index: 1;
  }
  .bb-pricing-gift-head {
    display: flex;
    align-items: center;
    gap: 14px;
    justify-content: center;
    margin-bottom: 10px;
  }
  .bb-pricing-gift-title {
    font-size: 22px;
    font-weight: 800;
    color: #FFB347;
    margin: 0;
  }
  .bb-pricing-gift-icon { flex-shrink: 0; }
  .bb-pricing-gift-text {
    font-size: 14.5px;
    color: rgba(255,255,255,0.92);
    text-align: center;
    line-height: 1.55;
    margin: 0 auto 18px;
    max-width: 540px;
  }
  .bb-pricing-gift-section-label {
    font-size: 12px;
    font-weight: 800;
    color: #FFB347;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 10px;
    margin-top: 4px;
  }
  .bb-pricing-gift-section-label-second { margin-top: 14px; }

  .bb-pricing-gift-options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  .bb-pricing-gift-opt {
    background: rgba(255,179,71,0.10);
    border: 1px solid rgba(255,179,71,0.45);
    border-radius: 10px;
    padding: 14px 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: inherit;
    color: inherit;
    width: 100%;
  }
  .bb-pricing-gift-opt:hover {
    background: rgba(255,179,71,0.22);
    border-color: #FFB347;
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 6px 14px rgba(255,179,71,0.25);
  }
  .bb-pricing-gift-opt:active { transform: translateY(0) scale(1); }
  .bb-pricing-gift-opt-period {
    font-size: 12px;
    color: #FFB347;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    margin-bottom: 7px;
  }
  .bb-pricing-gift-opt-price {
    font-size: 22px;
    font-weight: 800;
    color: #fff;
    margin-bottom: 5px;
    line-height: 1;
  }
  .bb-pricing-gift-opt-save {
    font-size: 11px;
    color: #FFB347;
    font-weight: 600;
    min-height: 14px;
  }

  .bb-pricing-gift-family {
    background: rgba(255,179,71,0.18);
    border: 1.5px solid #FFB347;
    border-radius: 10px;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: inherit;
    color: inherit;
    width: 100%;
    text-align: left;
  }
  .bb-pricing-gift-family:hover {
    background: rgba(255,179,71,0.28);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255,179,71,0.3);
  }
  .bb-pricing-gift-family:active { transform: translateY(0) scale(0.99); }
  .bb-pricing-gift-family-info { display: flex; flex-direction: column; }
  .bb-pricing-gift-family-period {
    font-size: 12px;
    color: #FFB347;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .bb-pricing-gift-family-price {
    font-size: 22px;
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }
  .bb-pricing-gift-family-save {
    font-size: 11px;
    color: #FFB347;
    font-weight: 600;
  }

  /* CTA GIFT */
  .bb-pricing-gift-cta {
    display: block;
    width: 100%;
    margin-top: 16px;
    padding: 12px;
    background: transparent;
    color: #FFB347 !important;
    text-align: center;
    border-radius: 9px;
    font-weight: 700;
    font-size: 14px;
    text-decoration: none;
    border: 1.5px solid #FFB347;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: inherit;
  }
  .bb-pricing-gift-cta:hover {
    background: rgba(255,179,71,0.15);
    color: #FAC775 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255,179,71,0.2);
  }
  .bb-pricing-gift-cta:active { transform: translateY(0) scale(0.97); }

  /* MOBILE */
  @media (max-width: 720px) {
    .bb-pricing-wrap { padding: 30px 14px 24px; }
    .bb-pricing-title { font-size: 22px; }
    .bb-pricing-subtitle { font-size: 13px; }
    .bb-pricing-eyebrow { font-size: 11px; letter-spacing: 2.5px; }

    .bb-pricing-util-row { grid-template-columns: 1fr; }
    .bb-pricing-util-name { font-size: 13px; }
    .bb-pricing-util-sub { font-size: 12px; }
    .bb-pricing-diya-tag { font-size: 10px; }
    .bb-pricing-util-price { font-size: 20px; }

    .bb-pricing-grid { grid-template-columns: 1fr; gap: 40px; }
    .bb-pricing-card { padding: 22px 16px 16px; }
    .bb-pricing-price-main { font-size: 32px; }
    .bb-pricing-price-main small { font-size: 14px; }
    .bb-pricing-perks li { font-size: 13px; }

    .bb-pricing-installments { padding: 10px; }
    .bb-pricing-installments-title { font-size: 11px; }
    .bb-pricing-installments-sub { font-size: 12px; }
    .bb-pricing-bank-btn { font-size: 12px; padding: 9px 6px; }

    .bb-pricing-cta { padding: 12px; font-size: 14px; }
    .bb-pricing-cancel { font-size: 12px; }

    .bb-pricing-gift { padding: 20px 14px; }
    .bb-pricing-gift-title { font-size: 18px; }
    .bb-pricing-gift-text { font-size: 12.5px; }
    .bb-pricing-gift-options { grid-template-columns: 1fr 1fr; }
    .bb-pricing-gift-opt-price { font-size: 19px; }
    .bb-pricing-gift-family-price { font-size: 20px; }
    .bb-pricing-gift-family { padding: 14px 16px; }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .bb-pricing-eyebrow,
    .bb-pricing-badge,
    .bb-pricing-cta-glow {
      animation: none !important;
    }
    .bb-pricing-card,
    .bb-pricing-util,
    .bb-pricing-cta,
    .bb-pricing-bank-btn,
    .bb-pricing-gift-opt,
    .bb-pricing-gift-family,
    .bb-pricing-gift-cta {
      transition: none !important;
    }
  }
`
