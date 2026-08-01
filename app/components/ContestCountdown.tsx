'use client'

import { useEffect, useState } from 'react'

/**
 * Лічильник конкурсу в кабінеті автора.
 *
 * Головне завдання — щоб автор почав писати в серпні, а не 14 листопада.
 * Тому показуємо не просто дату, а скільки днів лишилось і скільки роботи
 * попереду: десять серій за три місяці — це приблизно одна серія на тиждень.
 *
 * Дати конкурсу правити тут — вони мають збігатися зі сторінкою /konkursy.
 */

const BRAND = {
  cream: '#0f1e3a',
  amber: '#ef9f27',
  amberDark: '#FFB347',
  ink: '#f5f0e8',
  text: '#e8eef7',
  muted: '#b9c6db',
  line: 'rgba(143,163,196,0.22)',
  navyDeep: '#0a1628',
}
const SERIF = 'Georgia, "Times New Roman", serif'

// Віхи конкурсу «Це довга історія»
const SUBMIT_OPEN = new Date('2026-11-01T00:00:00+02:00')
const SUBMIT_CLOSE = new Date('2026-11-15T23:59:59+02:00')
const FIRST_EPISODES = new Date('2026-11-19T00:00:00+02:00')
const RESULTS = new Date('2027-02-20T00:00:00+02:00')

const EPISODES_NEEDED = 10

function daysUntil(target: Date, from: Date): number {
  const ms = target.getTime() - from.getTime()
  return Math.max(0, Math.ceil(ms / 86400000))
}

/** Правильна форма слова після числа: 1 день, 2 дні, 5 днів. */
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

type Phase = {
  label: string
  days: number
  unit: string
  hint: string
  urgent: boolean
}

function currentPhase(now: Date): Phase | null {
  if (now < SUBMIT_OPEN) {
    const days = daysUntil(SUBMIT_OPEN, now)
    // Темп рахуємо в днях на серію: дробові «серії на тиждень» читаються гірше.
    const perEpisode = Math.floor(days / EPISODES_NEEDED)
    return {
      label: 'До прийому робіт',
      days,
      unit: plural(days, 'день', 'дні', 'днів'),
      hint: perEpisode >= 2
        ? `Щоб мати всі десять серій готовими — це приблизно одна серія на ${perEpisode} ${plural(perEpisode, 'день', 'дні', 'днів')}.`
        : 'Часу лишилось небагато. Навіть кілька готових серій — уже початок.',
      urgent: perEpisode < 2,
    }
  }
  if (now <= SUBMIT_CLOSE) {
    const days = daysUntil(SUBMIT_CLOSE, now)
    return {
      label: 'До закриття прийому',
      days,
      unit: plural(days, 'день', 'дні', 'днів'),
      hint: 'Прийом робіт триває. Надішліть свій серіал редакції, поки вікно відкрите.',
      urgent: true,
    }
  }
  if (now < FIRST_EPISODES) {
    return {
      label: 'До перших серій',
      days: daysUntil(FIRST_EPISODES, now),
      unit: plural(daysUntil(FIRST_EPISODES, now), 'день', 'дні', 'днів'),
      hint: 'Прийом закрито. Готуємо серіали до публікації.',
      urgent: false,
    }
  }
  if (now < RESULTS) {
    return {
      label: 'До підсумків',
      days: daysUntil(RESULTS, now),
      unit: plural(daysUntil(RESULTS, now), 'день', 'дні', 'днів'),
      hint: 'Серії виходять щотижня. Переможців визначають читачі — за прочитаннями й доходимістю.',
      urgent: false,
    }
  }
  return null
}

export default function ContestCountdown() {
  // Рахуємо в браузері: так число не залежить від кешування сторінки.
  const [phase, setPhase] = useState<Phase | null>(null)

  useEffect(() => {
    const tick = () => setPhase(currentPhase(new Date()))
    tick()
    const id = setInterval(tick, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  if (!phase) return null

  return (
    <section style={{
      background: BRAND.cream, borderRadius: 14, padding: '1.25rem 1.5rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)', marginTop: '1.5rem',
      borderLeft: `3px solid ${phase.urgent ? BRAND.amber : 'rgba(239,159,39,0.4)'}`,
    }}>
      <h2 style={{ fontFamily: SERIF, fontSize: '1.35rem', color: BRAND.amber, margin: '0 0 0.2rem' }}>
        Конкурс «Це довга історія»
      </h2>
      <p style={{ color: BRAND.muted, fontSize: '0.85rem', margin: '0 0 1.1rem' }}>
        Конкурс серіалів. Головна нагорода — озвучення серіалу.
      </p>

      <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: BRAND.muted, fontWeight: 600, marginBottom: 4 }}>
            {phase.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 700, color: BRAND.amber, lineHeight: 1 }}>
              {phase.days}
            </span>
            <span style={{ fontSize: '1rem', color: BRAND.text }}>{phase.unit}</span>
          </div>
        </div>

        <div style={{ paddingBottom: 4 }}>
          <div style={{ fontSize: '0.78rem', color: BRAND.muted, fontWeight: 600, marginBottom: 4 }}>
            Потрібно
          </div>
          <div style={{ color: BRAND.ink, fontSize: '1rem', lineHeight: 1.5 }}>
            {EPISODES_NEEDED} серій · 1500–1800 слів кожна
          </div>
        </div>
      </div>

      <p style={{ color: BRAND.text, fontSize: '0.92rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
        {phase.hint}
      </p>

      <a
        href="/konkursy"
        style={{
          display: 'inline-block', marginTop: 14, padding: '0.5rem 0.95rem',
          borderRadius: 9, border: `1px solid ${BRAND.line}`,
          color: BRAND.amberDark, textDecoration: 'none', fontSize: '0.87rem',
        }}
      >
        Умови конкурсу →
      </a>
    </section>
  )
}
