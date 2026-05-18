import type { ReactNode } from 'react'

const GOLD      = '#f0a500'
const NAVY_DEEP = '#0a1628'
const FONT      = "'Montserrat', Arial, sans-serif"

interface LegalLayoutProps {
  title: string
  updated: string
  children: ReactNode
}

export default function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 20px 80px' }}>

        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8899bb', textDecoration: 'none', marginBottom: 28, fontFamily: FONT }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2 L4 7 L9 12" stroke="#8899bb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          На головну
        </a>

        <div style={{ marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 20, padding: '3px 10px', textTransform: 'uppercase', fontFamily: FONT, letterSpacing: 0.6 }}>
            Юридичний документ
          </span>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#f5f0e8', lineHeight: 1.25, margin: '14px 0 10px', fontFamily: FONT }}>
            {title}
          </h1>
          <div style={{ fontSize: 13, color: '#8899bb', fontFamily: FONT }}>
            Останнє оновлення: {updated}
          </div>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(240,165,0,0.4), transparent)', marginBottom: 36 }} />

        <div style={{ fontSize: 15, lineHeight: 1.85, color: '#dde6f0', fontFamily: FONT }}>
          {children}
        </div>

        <div style={{ marginTop: 52, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.08)', fontSize: 13, color: '#8899bb', fontFamily: FONT, lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}>
            Виникли запитання? Напишіть нам на <a href="mailto:nazar@balabony.net" style={{ color: GOLD, textDecoration: 'underline' }}>nazar@balabony.net</a> або скористайтесь <a href="/contact" style={{ color: GOLD, textDecoration: 'underline' }}>формою зв&apos;язку</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export const legalStyles = {
  h2: {
    fontSize: 20,
    fontWeight: 700,
    color: '#f5f0e8',
    margin: '32px 0 12px',
    fontFamily: FONT,
  } as React.CSSProperties,
  h3: {
    fontSize: 16,
    fontWeight: 700,
    color: GOLD,
    margin: '20px 0 8px',
    fontFamily: FONT,
  } as React.CSSProperties,
  p: {
    margin: '0 0 14px',
  } as React.CSSProperties,
  ul: {
    margin: '0 0 14px',
    paddingLeft: 22,
  } as React.CSSProperties,
  li: {
    marginBottom: 6,
  } as React.CSSProperties,
  placeholder: {
    display: 'inline-block',
    background: 'rgba(240,165,0,0.15)',
    color: GOLD,
    padding: '1px 8px',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: FONT,
  } as React.CSSProperties,
}
