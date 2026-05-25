'use client'

import { useState } from 'react'

const E_USER = 'nazar'
const E_HOST = 'balabony'
const E_TLD  = 'net'

function ProtectedEmail() {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied]     = useState(false)

  function handleClick() {
    const email = `${E_USER}@${E_HOST}.${E_TLD}`
    navigator.clipboard?.writeText(email).catch(() => {})
    setRevealed(true)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleClick}
      title="Клікни, щоб скопіювати email"
      className="footer-email-btn"
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: "'Montserrat', sans-serif",
        textAlign: 'left',
      }}
    >
      <span aria-hidden={revealed}>
        {revealed
          ? `${E_USER}@${E_HOST}.${E_TLD}`
          : <>{E_USER}<span style={{ color: '#f5a623' }}> [at] </span>{E_HOST}<span style={{ color: '#f5a623' }}> [dot] </span>{E_TLD}</>
        }
      </span>
      {copied && <span style={{ color: '#4ade80', marginLeft: 6, fontSize: 12 }}>✓ скопійовано</span>}
    </button>
  )
}

const LEGAL_LINKS = [
  { title: 'Угода користувача',         href: '/legal/terms' },
  { title: 'Політика конфіденційності', href: '/legal/privacy' },
  { title: 'Публічна оферта',           href: '/legal/offer' },
  { title: 'Політика Cookies',          href: '/legal/cookies' },
]

export default function Footer() {
  return (
    <footer className="footer-root" style={{ background: 'var(--dark)', color: '#94a3b8', padding: '32px 5% 30px', marginTop: 24 }}>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 40, maxWidth: 1100, margin: '0 auto 40px'
      }}>
        <div>
          <span className="footer-logo" style={{ fontFamily: "'Comfortaa', cursive", fontSize: 22, display: 'block', marginBottom: 12 }}>
            Balabony<sup style={{ fontSize: 10 }}>®</sup>
          </span>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
            Читай українське.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 4 }}>
            {[
              { label: 'Telegram',  href: 'https://t.me/balabony_bot' },
              { label: 'Viber',     href: 'https://connect.viber.com/business/fc54c304-3c99-11f1-954e-c29e734e1403' },
              { label: 'Instagram', href: 'https://www.instagram.com/balabony_' },
              { label: 'TikTok',    href: 'https://www.tiktok.com/@balabony_' },
              { label: 'Facebook',  href: 'https://www.facebook.com/profile.php?id=61568006368489' },
              { label: 'WhatsApp',  href: 'https://wa.me/380505859141' },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                className="footer-social"
                style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: 600 }}>
                {s.label}
              </a>
            ))}
          </div>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ProtectedEmail />
            <a
              href="/contact"
              className="footer-cta-write"
              style={{
                display: 'inline-block', padding: '7px 16px',
                background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.4)',
                borderRadius: 8, color: '#f5a623', fontSize: 13, fontWeight: 700,
                textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
                width: 'fit-content',
              }}
            >
              Написати нам <span className="footer-cta-arrow">→</span>
            </a>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Платформи</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {['Web (браузер)', 'iOS (Safari PWA)', 'Android (Chrome PWA)', 'Telegram-бот', 'Smart TV / Tablets'].map(item => (
              <li key={item} style={{ marginBottom: 9 }}>
                <a href="#" className="footer-link" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 16 }}>{item}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Інклюзивність</h4>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, marginBottom: 12 }}>
            Пільгові умови для ветеранів (УБД) та людей з інвалідністю: повний доступ за 1 грн.
          </p>

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <a
              href="/support"
              className="footer-support-main"
              style={{
                display: 'inline-block', marginBottom: 10,
                color: '#f5a623', fontSize: 16, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span className="footer-heart">❤</span> Підтримати інклюзивність <span className="footer-cta-arrow">→</span>
            </a>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a
                href="/support"
                className="footer-lang-btn"
                style={{
                  padding: '5px 12px', background: 'rgba(245,166,35,0.15)',
                  border: '1px solid rgba(245,166,35,0.4)', borderRadius: 6,
                  color: '#f5a623', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                UA
              </a>
              <a
                href="/support?lang=en"
                className="footer-lang-btn"
                style={{
                  padding: '5px 12px', background: 'rgba(245,166,35,0.15)',
                  border: '1px solid rgba(245,166,35,0.4)', borderRadius: 6,
                  color: '#f5a623', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                EN · Donate
              </a>
              <a
                href="/support?lang=de"
                className="footer-lang-btn"
                style={{
                  padding: '5px 12px', background: 'rgba(245,166,35,0.15)',
                  border: '1px solid rgba(245,166,35,0.4)', borderRadius: 6,
                  color: '#f5a623', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                DE · Spenden
              </a>
            </div>
            <a
              href="/accessibility"
              className="footer-link-muted"
              style={{
                display: 'inline-block', marginTop: 10,
                color: 'rgba(255,255,255,0.7)', fontSize: 14,
                textDecoration: 'none', fontWeight: 500,
              }}
            >
              ♿ Доступність сайту <span className="footer-cta-arrow">→</span>
            </a>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Документи</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {LEGAL_LINKS.map(d => (
              <li key={d.title} style={{ marginBottom: 9 }}>
                <a
                  href={d.href}
                  className="footer-link"
                  style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 16, fontFamily: "'Montserrat', sans-serif" }}
                >
                  {d.title}
                </a>
              </li>
            ))}
            <li style={{ marginBottom: 9 }}>
              <a href="/become-author" className="footer-link" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 16 }}>Договір з автором</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Навігація</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              { label: 'Рідер', href: '#reader' },
              { label: 'Тарифи', href: '#pricing' },
            ].map(item => (
              <li key={item.label} style={{ marginBottom: 9 }}>
                <a href={item.href} className="footer-link" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 16 }}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{
        maxWidth: 1100, margin: '0 auto 32px',
        padding: '24px 24px',
        background: 'rgba(245,166,35,0.06)',
        border: '1px solid rgba(245,166,35,0.18)',
        borderRadius: 12,
      }}>
        <h4 style={{
          color: '#f5a623', marginBottom: 12, fontSize: 16, fontWeight: 700,
          fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.3px',
          textTransform: 'uppercase',
        }}>
          Про Балабонів
        </h4>
        <p style={{
          fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)',
          marginBottom: 12, fontFamily: "'Montserrat', sans-serif",
        }}>
          Балабони — освітня платформа{' '}
          <a
            href="https://lvivdim.com/pages/pro-nas"
            target="_blank"
            rel="noreferrer"
            className="footer-link-inline"
            style={{ color: '#f5a623', textDecoration: 'underline', fontWeight: 600 }}
          >
            ЛОГО «Інститут громадянського суспільства»
          </a>{' '}
          (Львів, з 2005 року). Ми відновлюємо грамотність українських дітей, постраждалих від війни,
          через літературу, аудіо та ШІ-тьюторинг — безкоштовно для дітей ВПО, ветеранських родин,
          дітей з інвалідністю та дітей зі звільнених громад.
        </p>
        <p style={{
          fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)',
          margin: 0, fontStyle: 'italic',
          fontFamily: "'Montserrat', sans-serif",
        }}>
          Balabony is an educational platform by the Institute of Civil Society (Lviv, est. 2005).
          We restore literacy for Ukrainian children affected by war through literature, audio and
          AI tutoring — free of charge for IDP children, veterans&apos; families, children with
          disabilities, and children from liberated communities.
        </p>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 28, textAlign: 'center',
        fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 1100, margin: '0 auto'
      }}>
        <p>
          © 2026 Balabony®. Історії українською. Усі права захищено згідно із законодавством України.<br />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Торговельна марка: заявка №m202501234 до Укрпатенту.
          </span>
        </p>
      </div>

      <style jsx>{`
        /* ── Logo shimmer ── */
        .footer-logo {
          background: linear-gradient(90deg, #EF9F27 0%, #EF9F27 35%, #FAC775 50%, #EF9F27 65%, #EF9F27 100%);
          background-size: 250% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: footerShimmer 4.5s linear infinite;
        }
        @keyframes footerShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        /* ── Regular nav links ── */
        .footer-root :global(.footer-link) {
          position: relative;
          transition: color 0.25s ease, transform 0.2s ease;
          display: inline-block;
        }
        .footer-root :global(.footer-link::after) {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 0;
          height: 1px;
          background: #EF9F27;
          transition: width 0.3s ease;
        }
        .footer-root :global(.footer-link:hover) {
          color: #EF9F27 !important;
          transform: translateX(3px);
        }
        .footer-root :global(.footer-link:hover::after) {
          width: 100%;
        }

        /* ── Social text links ── */
        .footer-root :global(.footer-social) {
          position: relative;
          transition: color 0.25s ease, transform 0.25s ease;
        }
        .footer-root :global(.footer-social::after) {
          content: '';
          position: absolute;
          left: 0;
          bottom: -3px;
          width: 0;
          height: 1.5px;
          background: #EF9F27;
          transition: width 0.3s ease;
        }
        .footer-root :global(.footer-social:hover) {
          color: #EF9F27 !important;
          transform: translateY(-2px);
        }
        .footer-root :global(.footer-social:hover::after) {
          width: 100%;
        }

        /* ── Email button ── */
        .footer-root :global(.footer-email-btn) {
          transition: color 0.25s ease;
        }
        .footer-root :global(.footer-email-btn:hover) {
          color: #EF9F27 !important;
        }

        /* ── Write to us CTA ── */
        .footer-root :global(.footer-cta-write) {
          transition: background 0.25s ease, border-color 0.25s ease,
                      transform 0.2s ease, box-shadow 0.25s ease;
        }
        .footer-root :global(.footer-cta-write:hover) {
          background: rgba(239, 159, 39, 0.25) !important;
          border-color: #EF9F27 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(239, 159, 39, 0.35);
        }
        .footer-root :global(.footer-cta-arrow) {
          display: inline-block;
          transition: transform 0.25s ease;
        }
        .footer-root :global(.footer-cta-write:hover .footer-cta-arrow),
        .footer-root :global(.footer-support-main:hover .footer-cta-arrow),
        .footer-root :global(.footer-link-muted:hover .footer-cta-arrow) {
          transform: translateX(4px);
        }

        /* ── Language donate buttons (UA / EN / DE) ── */
        .footer-root :global(.footer-lang-btn) {
          transition: background 0.25s ease, border-color 0.25s ease,
                      transform 0.2s ease, box-shadow 0.25s ease, color 0.2s ease;
        }
        .footer-root :global(.footer-lang-btn:hover) {
          background: #EF9F27 !important;
          border-color: #FAC775 !important;
          color: #FFFFFF !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(239, 159, 39, 0.4);
        }

        /* ── Inclusivity main link "❤ Підтримати інклюзивність" ── */
        .footer-root :global(.footer-support-main) {
          transition: color 0.25s ease, transform 0.2s ease;
        }
        .footer-root :global(.footer-support-main:hover) {
          color: #FAC775 !important;
          transform: translateX(3px);
        }

        /* ── Pulsing heart ── */
        .footer-root :global(.footer-heart) {
          display: inline-block;
          animation: footerHeartBeat 1.8s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes footerHeartBeat {
          0%, 100% { transform: scale(1); }
          15%      { transform: scale(1.2); }
          30%      { transform: scale(1); }
          45%      { transform: scale(1.15); }
          60%      { transform: scale(1); }
        }

        /* ── Accessibility muted link ── */
        .footer-root :global(.footer-link-muted) {
          transition: color 0.25s ease, transform 0.2s ease;
        }
        .footer-root :global(.footer-link-muted:hover) {
          color: #EF9F27 !important;
          transform: translateX(3px);
        }

        /* ── Inline link in About block ── */
        .footer-root :global(.footer-link-inline) {
          transition: color 0.25s ease;
        }
        .footer-root :global(.footer-link-inline:hover) {
          color: #FAC775 !important;
        }
      `}</style>
    </footer>
  )
}
