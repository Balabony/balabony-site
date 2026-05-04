'use client'

import { useState } from 'react'

const GOLD = '#f5a623'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', serif"

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#0f1e3a', border: `1.5px solid ${GOLD}`,
      borderRadius: 16, padding: '28px 28px',
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: GOLD, fontFamily: FONT, marginBottom: 16 }}>
      {children}
    </div>
  )
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <span style={{ color: GOLD, fontWeight: 700, fontSize: 16, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>{children}</span>
    </li>
  )
}

function StepItem({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
      <span style={{
        width: 28, height: 28, borderRadius: '50%', background: GOLD, color: '#fff',
        fontFamily: FONT, fontWeight: 700, fontSize: 13, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{num}</span>
      <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, paddingTop: 4 }}>{children}</span>
    </li>
  )
}

function ProtectedEmail() {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const E_USER = 'nazar', E_HOST = 'balabony', E_TLD = 'com'
  const full = `${E_USER}@${E_HOST}.${E_TLD}`

  const handle = async () => {
    if (!revealed) { setRevealed(true); return }
    try { await navigator.clipboard.writeText(full) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={handle} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      fontFamily: FONT, fontSize: 15, color: GOLD, fontWeight: 600,
      textDecoration: 'underline', textDecorationStyle: 'dotted' as const,
    }}>
      {revealed
        ? (copied ? '✓ Скопійовано!' : full)
        : `${E_USER} [at] ${E_HOST} [dot] ${E_TLD}`}
    </button>
  )
}

export default function BecomeAuthorPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a1628', padding: '48px 20px 100px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <a href="/" style={{ fontFamily: "'Comfortaa', cursive", fontSize: 22, fontWeight: 700, color: GOLD, textDecoration: 'none' }}>
            Balabony<sup style={{ fontSize: 9 }}>®</sup>
          </a>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: GOLD, fontFamily: FONT, marginBottom: 12 }}>
            Для авторів
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, color: '#f5f0e8', margin: '0 0 12px', lineHeight: 1.2 }}>
            Стань автором Balabony
          </h1>
          <p style={{ fontSize: 20, fontFamily: SERIF, fontStyle: 'italic', color: GOLD, marginBottom: 20 }}>
            Пишеш? Ми чекаємо на тебе.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, maxWidth: 580 }}>
            Balabony — українська платформа коротких історій для всієї родини. Ми шукаємо авторів, які хочуть ділитись своїми історіями і заробляти на цьому. Писати може будь-хто — головне оригінальність, цікавий сюжет і жива мова без штучного інтелекту.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Як це працює */}
          <SectionCard>
            <SectionTitle>Як це працює</SectionTitle>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <StepItem num={1}>
                Ти надсилаєш свою історію — ми перевіряємо її і публікуємо на платформі.
              </StepItem>
              <StepItem num={2}>
                Кожного разу, коли читач відкриває твою історію — ти отримуєш гонорар.
              </StepItem>
              <StepItem num={3}>
                Жодних авансів і ризиків — тільки реальні виплати за реальні прочитання.
              </StepItem>
            </ul>
          </SectionCard>

          {/* Умови співпраці */}
          <SectionCard>
            <SectionTitle>Умови співпраці</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: GOLD, fontFamily: FONT, marginBottom: 8 }}>Для авторів-ФОП</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: GOLD, fontFamily: SERIF, marginBottom: 6 }}>50%</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                  доходу від твоїх історій — твої.<br />
                  Ти самостійно сплачуєш податки.
                </div>
              </div>
              <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: GOLD, fontFamily: FONT, marginBottom: 8 }}>Для інших авторів</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: GOLD, fontFamily: SERIF, marginBottom: 6 }}>40%</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                  доходу від твоїх історій — твої.<br />
                  Balabony бере на себе всі податки за тебе.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Угода підписується через Дію — швидко і юридично чисто.
            </div>
          </SectionCard>

          {/* Що ми шукаємо */}
          <SectionCard>
            <SectionTitle>Що ми шукаємо</SectionTitle>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <CheckItem>Короткі історії від 1 до 10 хвилин читання</CheckItem>
              <CheckItem>Будь-який жанр: драма, гумор, казка, детектив, романтика</CheckItem>
              <CheckItem>Українська мова</CheckItem>
              <CheckItem>Оригінальний контент — без плагіату і без використання ШІ</CheckItem>
              <CheckItem>Кожна історія перевіряється на ШІ-генерацію перед публікацією</CheckItem>
            </ul>
          </SectionCard>

          {/* Особистий кабінет */}
          <SectionCard>
            <SectionTitle>Особистий кабінет автора</SectionTitle>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 16 }}>
              Після підписання угоди ти отримуєш доступ до особистого кабінету де бачиш:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <CheckItem>Кількість переглядів кожної історії</CheckItem>
              <CheckItem>Відгуки читачів</CheckItem>
              <CheckItem>Нарахування коштів у реальному часі</CheckItem>
            </ul>
          </SectionCard>

          {/* Як подати заявку */}
          <SectionCard>
            <SectionTitle>Як подати заявку</SectionTitle>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
              <StepItem num={1}>
                Напиши нам на <ProtectedEmail /> (натисни, щоб побачити адресу)
              </StepItem>
              <StepItem num={2}>
                Вкажи своє реальне ім'я та прізвище, номер телефону і email — актуальні контакти обов'язкові
              </StepItem>
              <StepItem num={3}>
                Прикріпи одну пробну історію
              </StepItem>
            </ul>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              Ми відповімо протягом 5 робочих днів.
            </p>
            <a
              href="/contact"
              style={{
                display: 'inline-block', padding: '14px 32px',
                background: GOLD, color: '#fff', borderRadius: 12,
                fontWeight: 700, fontSize: 16, textDecoration: 'none',
                fontFamily: FONT,
              }}
            >
              Написати нам →
            </a>
          </SectionCard>

        </div>
      </div>
    </main>
  )
}
