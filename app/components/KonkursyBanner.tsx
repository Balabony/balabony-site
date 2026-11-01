'use client'

import Link from 'next/link'
import { CONTESTS, topPrize, type Contest } from '@/lib/contests'
import { KIDS_CONTEST, contestState } from '@/lib/kids-contest'

/**
 * Блок «Літературні конкурси» на головній.
 *
 * 01.11.2026 (рішення Богдана): показуємо ЛИШЕ конкурси, які приймають заявки
 * зараз або скоро почнуть. Конкурс із закритим прийомом зникає з блока сам —
 * за датами з lib/contests.ts, руками нічого правити не треба. Новий конкурс,
 * доданий у CONTESTS, з'являється тут автоматично.
 * Дитячий конкурс скоромовок — окрема картка з позначкою «Для дітей».
 * Коли відкритих конкурсів немає, блок ховається повністю.
 */

const NAVY_CARD = '#14253B'
const GOLD = '#EF9F27'
const GOLD_SOFT = '#FAC775'
const CREAM = '#FFF8EE'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', Georgia, serif"
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']

type Card = { key: string; tag: string; nazva: string; pryz: string; umova: string; deadline: string; href: string; kids?: boolean }

function human(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`
}

function daysLeft(iso: string, now: Date): number {
  const end = new Date(iso + 'T23:59:59+02:00').getTime()
  return Math.max(0, Math.ceil((end - now.getTime()) / 86400000))
}

function plural(n: number): string {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return 'день'
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'дні'
  return 'днів'
}

function umova(c: Contest): string {
  if (c.volumeLabel) return c.volumeLabel.charAt(0).toUpperCase() + c.volumeLabel.slice(1)
  if (c.episodes === 1) return `Одна історія до ${c.maxWords} слів`
  return `${c.episodes} серій по ${c.minWords}–${c.maxWords} слів`
}

export default function KonkursyBanner() {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  const cards: Card[] = CONTESTS
    .filter((c) => today <= c.closesAt)
    .sort((a, b) => a.closesAt.localeCompare(b.closesAt))
    .map((c) => {
      const soon = today < c.opensAt
      const n = daysLeft(c.closesAt, now)
      return {
        key: c.id,
        tag: c.episodes > 1 ? 'Для дорослих · серіал' : 'Для дорослих авторів',
        nazva: c.name.replace(/\s+—.*$/, ''),
        pryz: `${topPrize(c)} ${c.awards.length > 1 ? 'перше місце' : 'головна нагорода'}`,
        umova: umova(c),
        deadline: soon ? `Прийом з ${human(c.opensAt)}` : `Заявки до ${human(c.closesAt)} · ${n === 0 ? 'останній день' : `залишилось ${n} ${plural(n)}`}`,
        href: '/konkursy',
      }
    })

  const ks = contestState(now.getTime())
  if (ks !== 'closed') {
    cards.push({
      key: KIDS_CONTEST.id,
      tag: 'Для дітей · 1–11 клас',
      nazva: KIDS_CONTEST.title,
      pryz: 'Книжки й цифрові дипломи',
      umova: 'Власна скоромовка, 1–4 рядки · реєстрація обов’язкова',
      deadline: ks === 'soon' ? `Прийом з ${KIDS_CONTEST.startText}` : `Заявки до ${KIDS_CONTEST.endText.replace(' 2026 року', '')}`,
      href: KIDS_CONTEST.path,
      kids: true,
    })
  }

  if (!cards.length) return null

  return (
    <section aria-label="Літературні конкурси" style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 20px 4px' }}>
      <div style={{ border: '1px solid rgba(239,159,39,0.45)', borderRadius: 14, background: NAVY_CARD, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: GOLD, marginBottom: 4 }}>ЛІТЕРАТУРНІ КОНКУРСИ</div>
            <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: CREAM }}>Приймаємо заявки зараз</div>
          </div>
          <Link href="/konkursy" style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: '#0E1A2B', background: GOLD, padding: '9px 18px', borderRadius: 20, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Усі конкурси →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 12 }}>
          {cards.map((k) => (
            <Link key={k.key} href={k.href}
              style={{
                display: 'block', textDecoration: 'none', borderRadius: 10, padding: '13px 15px',
                border: k.kids ? `1.5px solid ${GOLD}` : '1px solid rgba(239,159,39,0.28)',
                background: k.kids ? 'radial-gradient(120% 100% at 100% 0%, rgba(239,159,39,0.22) 0%, rgba(0,0,0,0) 65%)' : 'transparent',
              }}>
              <span style={{
                display: 'inline-block', fontFamily: FONT, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
                color: k.kids ? '#0E1A2B' : GOLD, background: k.kids ? GOLD : 'transparent', border: `1px solid ${GOLD}`,
                borderRadius: 6, padding: '2px 7px', marginBottom: 8,
              }}>{k.tag}</span>
              <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: CREAM, marginBottom: 5 }}>{k.nazva}</div>
              <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: GOLD_SOFT, marginBottom: 6 }}>{k.pryz}</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: '#B5C6DA', marginBottom: 8 }}>{k.umova}</div>
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: GOLD }}>{k.deadline}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
