'use client'

import { useEffect, useState } from 'react'

/**
 * Лічильник конкурсів у кабінеті автора.
 *
 * Показує обидва серіальні конкурси одразу: «П'ять вечорів» — короткий вхід, і
 * «Це довга історія» — головна дистанція. Головне завдання — щоб автор почав
 * писати в серпні, а не 14 листопада, тому показуємо не просто дату, а темп:
 * скільки днів на серію лишається при нинішньому розкладі.
 *
 * Дати мають збігатися зі сторінкою /konkursy — правити разом.
 */

const BRAND = {
  cream: '#0f1e3a',
  amber: '#ef9f27',
  amberDark: '#FFB347',
  ink: '#f5f0e8',
  text: '#e8eef7',
  muted: '#b9c6db',
  line: 'rgba(143,163,196,0.22)',
}
const SERIF = 'Georgia, "Times New Roman", serif'

// ── Віхи конкурсів ───────────────────────────────────────────────────────
/** «Це довга історія»: подання заявок. */
const LONG_OPEN = new Date('2026-09-01T00:00:00+03:00')
const LONG_CLOSE = new Date('2026-10-31T23:59:59+02:00')
/** Запуск платформи — з нього стартують перші серії. */
const LAUNCH = new Date('2026-11-25T00:00:00+02:00')
/** «П'ять вечорів»: прийом робіт і оголошення переможців. */
const FIVE_OPEN = new Date('2026-09-01T00:00:00+03:00')
const FIVE_CLOSE = new Date('2026-10-20T23:59:59+03:00')
const FIVE_RESULTS = new Date('2026-11-25T00:00:00+02:00')
const RESULTS = new Date('2027-02-27T00:00:00+02:00')
/** Короткі конкурси: «Один день, який усе змінив» і «З вітерцем». */
const SHORT_OPEN = new Date('2026-11-01T00:00:00+02:00')
const SHORT_CLOSE = new Date('2026-12-15T23:59:59+02:00')
const SHORT_RESULTS = new Date('2027-01-31T00:00:00+02:00')

function daysUntil(target: Date, from: Date): number {
  return Math.max(0, Math.ceil((target.getTime() - from.getTime()) / 86400000))
}

/** 1 день, 2 дні, 5 днів. */
function plural(n: number, one: string, few: string, many: string): string {
  const a = n % 10
  const b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}

function days(n: number) {
  return `${n} ${plural(n, 'день', 'дні', 'днів')}`
}

type Card = {
  name: string
  href: string
  label: string
  value: string
  what: string
  hint: string
  urgent: boolean
}

function buildCards(now: Date): Card[] {
  const out: Card[] = []

  // ── «Це довга історія» ──
  if (now < LONG_OPEN) {
    const d = daysUntil(LONG_OPEN, now)
    const perEpisode = Math.floor(daysUntil(LAUNCH, now) / 10)
    out.push({
      name: 'Це довга історія',
      href: '/konkursy#dovha-istoriya',
      label: 'До подання заявок',
      value: days(d),
      what: '10 серій · 1500–1800 слів · 20 000 ₴',
      hint: perEpisode >= 2
        ? `Заявка — це синопсис і перша серія. Але писати варто вже зараз: до першої публікації ${days(daysUntil(LAUNCH, now))}, а далі серія щотижня.`
        : 'Заявка — це синопсис і повний текст першої серії.',
      urgent: d <= 14,
    })
  } else if (now <= LONG_CLOSE) {
    out.push({
      name: 'Це довга історія',
      href: '/konkursy#dovha-istoriya',
      label: 'До закриття заявок',
      value: days(daysUntil(LONG_CLOSE, now)),
      what: '10 серій · 1500–1800 слів · 20 000 ₴',
      hint: 'Подання відкрите. Потрібні синопсис на сторінку і повний текст першої серії.',
      urgent: true,
    })
  } else if (now < LAUNCH) {
    out.push({
      name: 'Це довга історія',
      href: '/konkursy#dovha-istoriya',
      label: 'До перших серій',
      value: days(daysUntil(LAUNCH, now)),
      what: '10 серій · одна на тиждень',
      hint: 'Заявки закрито. Учасників оголошуємо 18 листопада, перші серії виходять 25 листопада — 1 грудня.',
      urgent: false,
    })
  } else if (now < RESULTS) {
    out.push({
      name: 'Це довга історія',
      href: '/konkursy#dovha-istoriya',
      label: 'До підсумків',
      value: days(daysUntil(RESULTS, now)),
      what: 'Серія щотижня, у свій день',
      hint: 'Різдвяна пауза — 24 грудня по 6 січня. Пропустили тиждень без попередження — вибули.',
      urgent: false,
    })
  }

  // ── «П'ять вечорів» ──
  if (now < FIVE_OPEN) {
    out.push({
      name: "П'ять вечорів",
      href: '/konkursy#pyat-vechoriv',
      label: 'До прийому робіт',
      value: days(daysUntil(FIVE_OPEN, now)),
      what: "5 серій по 900–1100 слів · 8 000 ₴",
      hint: 'Найкоротший вхід. Усі п’ять серій надсилаються одразу — частинами не приймаємо.',
      urgent: false,
    })
  } else if (now <= FIVE_CLOSE) {
    const d = daysUntil(FIVE_CLOSE, now)
    out.push({
      name: "П'ять вечорів",
      href: '/konkursy#pyat-vechoriv',
      label: 'До закриття прийому',
      value: days(d),
      what: "5 серій по 900–1100 слів · 8 000 ₴",
      hint: 'Прийом відкрито. Потрібні всі п’ять серій одразу, кожна на тисячу слів.',
      urgent: d <= 14,
    })
  } else if (now < FIVE_RESULTS) {
    out.push({
      name: "П'ять вечорів",
      href: '/konkursy#pyat-vechoriv',
      label: 'До оголошення переможців',
      value: days(daysUntil(FIVE_RESULTS, now)),
      what: 'Публікація серій — 4–18 листопада',
      hint: 'Прийом закрито. Фіналістів публікуємо щовівторка і щоп’ятниці о 18:00.',
      urgent: false,
    })
  }

  // ── Короткі конкурси: однакові строки, різні теми ──
  const shorts = [
    {
      name: 'Один день, який усе змінив',
      href: '/konkursy#odyn-den',
      what: 'Коротка проза до 1500 слів · 3 000 ₴',
      hint: 'Один день, після якого життя героя пішло інакше. Переможці виходять у газеті «Життя».',
    },
    {
      name: 'З вітерцем',
      href: '/konkursy#z-viterczem',
      what: 'Смішна історія до 1500 слів · 3 000 ₴',
      hint: 'Гумористична історія з життя. Переможці виходять у газеті «Життя».',
    },
  ]

  for (const sh of shorts) {
    if (now < SHORT_OPEN) {
      out.push({
        name: sh.name, href: sh.href,
        label: 'До відкриття прийому',
        value: days(daysUntil(SHORT_OPEN, now)),
        what: sh.what, hint: sh.hint,
        urgent: false,
      })
    } else if (now <= SHORT_CLOSE) {
      const d = daysUntil(SHORT_CLOSE, now)
      out.push({
        name: sh.name, href: sh.href,
        label: 'До закриття прийому',
        value: days(d),
        what: sh.what, hint: sh.hint,
        urgent: d <= 14,
      })
    } else if (now < SHORT_RESULTS) {
      out.push({
        name: sh.name, href: sh.href,
        label: 'До підсумків',
        value: days(daysUntil(SHORT_RESULTS, now)),
        what: sh.what,
        hint: 'Прийом закрито. Читаємо надіслане.',
        urgent: false,
      })
    }
  }

  return out
}

export default function ContestCountdown() {
  // Рахуємо в браузері: число не залежить від кешування сторінки.
  const [cards, setCards] = useState<Card[] | null>(null)

  useEffect(() => {
    const tick = () => setCards(buildCards(new Date()))
    tick()
    const id = setInterval(tick, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  if (!cards || cards.length === 0) return null

  return (
    <section style={{
      background: BRAND.cream, borderRadius: 14, padding: '1.25rem 1.5rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)', marginBottom: '1.5rem',
    }}>
      <h2 style={{ fontFamily: SERIF, fontSize: '1.35rem', color: BRAND.amber, margin: '0 0 0.2rem' }}>
        Конкурси
      </h2>
      <p style={{ color: BRAND.muted, fontSize: '0.85rem', margin: '0 0 0.7rem', lineHeight: 1.6 }}>
        Подаватися можна на кілька конкурсів одразу. Але кожен твір — лише на один із них.
      </p>

      <p style={{
        color: BRAND.text, fontSize: '0.85rem', margin: '0 0 1.2rem', lineHeight: 1.6,
        padding: '10px 12px', borderRadius: 10,
        background: 'rgba(239,159,39,0.08)', border: `1px solid ${BRAND.line}`,
      }}>
        <strong style={{ color: BRAND.ink }}>Як подати.</strong> Унизу цієї сторінки —
        форма «Написати редакції». Виберіть тему «Заявка на конкурс», назвіть конкурс
        і додайте текст. На пошту одразу прийде підтвердження, що заявку отримано.
        Можна й листом на{' '}
        <a href="mailto:nazar@balabony.com" style={{ color: BRAND.amberDark }}>nazar@balabony.com</a>,
        але тоді підтвердження не буде автоматичним.
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {cards.map(c => (
          <div
            key={c.name}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(239,159,39,0.06)',
              border: `1px solid ${c.urgent ? 'rgba(239,159,39,0.45)' : BRAND.line}`,
              borderLeft: `3px solid ${c.urgent ? BRAND.amber : 'rgba(239,159,39,0.35)'}`,
            }}
          >
            <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <strong style={{ fontFamily: SERIF, fontSize: '1.08rem', color: BRAND.ink }}>
                {c.name}
              </strong>
              <span style={{ fontSize: '0.78rem', color: BRAND.muted }}>{c.label}</span>
            </div>

            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: BRAND.amber, margin: '6px 0 4px', lineHeight: 1.1 }}>
              {c.value}
            </div>

            <div style={{ fontSize: '0.85rem', color: BRAND.text, marginBottom: 8 }}>{c.what}</div>

            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: BRAND.muted, margin: 0 }}>
              {c.hint}
            </p>

            <a
              href={c.href}
              style={{
                display: 'inline-block', marginTop: 10, fontSize: '0.85rem',
                color: BRAND.amberDark, textDecoration: 'none',
              }}
            >
              Умови →
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
