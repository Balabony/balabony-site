'use client'

import { FooterLegalSection } from './FooterLegalSection'

const E_USER = 'nazar'
const E_HOST = 'balabony'
const E_TLD  = 'com'

/**
 * Email у вигляді клікабельного посилання mailto:.
 * Залишаємо текст у форматі user@host.tld видимим — бо це футер, не публічна форма,
 * і відкритий показ email тут є нормою.
 */
function ProtectedEmail() {
  const email = `${E_USER}@${E_HOST}.${E_TLD}`
  return (
    <a
      href={`mailto:${email}`}
      className="footer-email-btn"
      style={{
        color: 'rgba(255,255,255,0.8)', fontSize: 14,
        fontFamily: "'Montserrat', sans-serif",
        textDecoration: 'none',
      }}
    >
      {email}
    </a>
  )
}

const LEGAL_LINKS = [
  { title: 'Політика конфіденційності', href: '/legal/privacy' },
  { title: 'Угода користувача',         href: '/legal/terms' },
  { title: 'Публічна оферта',           href: '/legal/offer' },
  { title: 'Правила повернення коштів', href: '/legal/refund' },
  { title: 'Політика Cookies',          href: '/legal/cookies' },
  { title: 'Захист дітей',              href: '/legal/child-safety' },
  { title: 'Договір з автором',         href: '/legal/author-contract' },
]

const SOCIALS = [
  { label: 'Telegram',  href: 'https://t.me/balabony' },
  { label: 'Viber',     href: 'https://connect.viber.com/business/fc54c304-3c99-11f1-954e-c29e734e1403' },
  { label: 'Instagram', href: 'https://www.instagram.com/balabony_' },
  { label: 'TikTok',    href: 'https://www.tiktok.com/@balabony_' },
  { label: 'Facebook',  href: 'https://www.facebook.com/profile.php?id=61568006368489' },
  { label: 'WhatsApp',  href: 'https://wa.me/380505859141' },
]

const PLATFORMS = [
  { label: 'Web (браузер)',        href: '/',  soon: false },
  { label: 'iOS (Safari PWA)',     href: null, soon: true  },
  { label: 'Android (Chrome PWA)', href: null, soon: true  },
  { label: 'Telegram-бот',         href: null, soon: true  },
  { label: 'Smart TV / Tablets',   href: null, soon: true  },
]

export default function Footer() {
  return (
    <footer className="footer-root" style={{ background: 'var(--dark)', color: '#94a3b8', padding: '24px 5% 72px', marginTop: 24 }}>

      {/* ════════ ОСНОВНІ 4 КОЛОНКИ ════════ */}
      <div className="footer-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 32,
        maxWidth: 1200,
        margin: '0 auto 20px'
      }}>

        {/* ───── КОЛОНКА 1: БРЕНД + КОНТАКТИ + ПІДТРИМАТИ ───── */}
        <div>
          <span className="footer-logo" style={{ fontFamily: "'Comfortaa', cursive", fontSize: 22, display: 'block', marginBottom: 6 }}>
            Balabony<sup style={{ fontSize: 10 }}>™</sup>
          </span>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
            Українські історії для всієї родини
          </p>

          <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Контакти
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <ProtectedEmail />
            <a
              href="https://wa.me/380505859141"
              target="_blank"
              rel="noreferrer"
              className="footer-email-btn"
              style={{
                color: 'rgba(255,255,255,0.8)', fontSize: 14,
                fontFamily: "'Montserrat', sans-serif",
                textDecoration: 'none',
              }}
            >
              WhatsApp +380 50 585 9141
            </a>
            <a
              href="/contacts"
              className="footer-cta-write"
              style={{
                display: 'inline-block', padding: '7px 16px',
                background: 'rgba(239,159,39,0.15)', border: '1px solid rgba(239,159,39,0.4)',
                borderRadius: 8, color: 'var(--accent-gold)', fontSize: 13, fontWeight: 700,
                textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
                width: 'fit-content',
              }}
            >
              Написати нам <span className="footer-cta-arrow">→</span>
            </a>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            {SOCIALS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                className="footer-social"
                style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600 }}>
                {s.label}
              </a>
            ))}
          </div>

          <h4 style={{ color: 'var(--accent-gold)', marginBottom: 10, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Підтримати
          </h4>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <a
              href="/support"
              className="footer-lang-btn"
              style={{
                padding: '5px 12px', background: 'rgba(239,159,39,0.15)',
                border: '1px solid rgba(239,159,39,0.4)', borderRadius: 6,
                color: 'var(--accent-gold)', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              UA
            </a>
            <a
              href="/support?lang=en"
              className="footer-lang-btn"
              style={{
                padding: '5px 12px', background: 'rgba(239,159,39,0.15)',
                border: '1px solid rgba(239,159,39,0.4)', borderRadius: 6,
                color: 'var(--accent-gold)', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              EN · Donate
            </a>
            <a
              href="/support?lang=de"
              className="footer-lang-btn"
              style={{
                padding: '5px 12px', background: 'rgba(239,159,39,0.15)',
                border: '1px solid rgba(239,159,39,0.4)', borderRadius: 6,
                color: 'var(--accent-gold)', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              DE · Spenden
            </a>
          </div>
        </div>

        {/* ───── КОЛОНКА 2: ПЛАТФОРМИ + ДЛЯ АВТОРІВ ───── */}
        <div>
          <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Платформи
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 14 }}>
            {PLATFORMS.map(item => (
              <li key={item.label} style={{ marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {item.href ? (
                  <a href={item.href} className="footer-link" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14 }}>
                    {item.label}
                  </a>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>{item.label}</span>
                )}
                {item.soon && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.3px',
                    padding: '2px 7px', borderRadius: 999,
                    background: 'rgba(239,159,39,0.15)',
                    color: 'var(--accent-gold)',
                    border: '1px solid rgba(239,159,39,0.35)',
                    fontFamily: "'Montserrat', sans-serif",
                    textTransform: 'uppercase',
                  }}>
                    Скоро
                  </span>
                )}
              </li>
            ))}
          </ul>

          <h4 style={{ color: 'var(--accent-gold)', marginBottom: 10, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Для авторів
          </h4>
          <a
            href="/become-author"
            className="footer-author-cta"
            style={{
              display: 'inline-block', padding: '8px 16px',
              background: '#EF9F27', borderRadius: 8,
              color: '#0a1628', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
              marginBottom: 6,
            }}
          >
            Стати автором →
          </a>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Запропонувати свою історію
          </p>
        </div>

        {/* ───── КОЛОНКА 3: ВИДІЛЕНІ КАРТКИ ─ ІНКЛЮЗИВНІСТЬ + ДОСТУПНІСТЬ ───── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'rgba(239,159,39,0.08)',
            border: '1px solid rgba(239,159,39,0.4)',
            borderRadius: 10,
            padding: 16,
          }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: 10, fontSize: 15, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>
              Інклюзивність
            </h4>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 10 }}>
              ВПО, ветерани (УБД) та люди з інвалідністю: повний доступ за 1 ₴.
            </p>
            <a
              href="/support"
              className="footer-support-main"
              style={{
                display: 'inline-block',
                color: 'var(--accent-gold)', fontSize: 13, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span className="footer-heart">❤</span> Підтримати ініціативу <span className="footer-cta-arrow">→</span>
            </a>
          </div>

          <div style={{
            background: 'rgba(239,159,39,0.08)',
            border: '1px solid rgba(239,159,39,0.4)',
            borderRadius: 10,
            padding: 16,
          }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: 10, fontSize: 15, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>
              Доступність
            </h4>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 10 }}>
              Зручно для людей зі слабким зором, дислексією, обмеженою моторикою.
            </p>
            <a
              href="/accessibility"
              className="footer-support-main"
              style={{
                display: 'inline-block',
                color: 'var(--accent-gold)', fontSize: 13, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              ♿ Доступність сайту <span className="footer-cta-arrow">→</span>
            </a>
            <a
              href="/inclusivevoice"
              className="footer-support-main"
              style={{
                display: 'block', marginTop: 8,
                color: 'var(--accent-gold)', fontSize: 13, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              🎙 InclusiveVoice <span className="footer-cta-arrow">→</span>
            </a>
          </div>
        </div>

        {/* ───── КОЛОНКА 4: ДОКУМЕНТИ + ПРО НАС + НАВІГАЦІЯ ───── */}
        <div>
          <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Документи
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 8 }}>
            {LEGAL_LINKS.map(d => (
              <li key={d.title} style={{ marginBottom: 5 }}>
                <a
                  href={d.href}
                  className="footer-link"
                  style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14, fontFamily: "'Montserrat', sans-serif" }}
                >
                  {d.title}
                </a>
              </li>
            ))}
          </ul>

          <h4 style={{ color: 'var(--accent-gold)', marginBottom: 10, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Про нас
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 8 }}>
            <li style={{ marginBottom: 5 }}>
              <a href="/pro-balabony" className="footer-link" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Про проєкт
              </a>
            </li>
            <li style={{ marginBottom: 5 }}>
              <a href="/about" className="footer-link" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Про автора
              </a>
            </li>
            <li style={{ marginBottom: 5 }}>
              <a href="/sitemap" className="footer-link" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Навігація сайту
              </a>
            </li>
          </ul>

          <h4 style={{ color: 'var(--accent-gold)', marginBottom: 10, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Розділи
          </h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              { label: 'Рідер',    href: '/#reader'  },
              { label: 'Тарифи',   href: '/#pricing' },
              { label: 'Правопис', href: '/pravopys' },
            ].map(item => (
              <li key={item.label} style={{ marginBottom: 5 }}>
                <a href={item.href} className="footer-link" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14 }}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ════════ БЛОК «ПРО БАЛАБОНІВ» ════════ */}
      <div style={{
        maxWidth: 1200, margin: '0 auto 28px',
        padding: '22px 24px',
        background: 'rgba(239,159,39,0.06)',
        border: '1px solid rgba(239,159,39,0.18)',
        borderRadius: 12,
      }}>
        <h4 style={{
          color: 'var(--accent-gold)', marginBottom: 8, fontSize: 14, fontWeight: 700,
          fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          Про Балабонів
        </h4>
        <p style={{
          fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)',
          marginBottom: 8, fontFamily: "'Montserrat', sans-serif",
        }}>
          Balabony — освітньо-літературна платформа українських історій. Ми повертаємо радість українського слова через сучасну літературу та оригінальні українські історії. Безкоштовний доступ для дітей ВПО, ветеранів (УБД) та людей з інвалідністю забезпечується у партнерстві з <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>ГО «Інститут громадянського суспільства»</span>. Через спільні історії, живу мову й теплий гумор ми обʼєднуємо українців навколо рідної культури — щоб вони залишалися в Україні й будували її майбутнє.
        </p>
        <p style={{
          fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)',
          margin: 0, fontStyle: 'italic',
          fontFamily: "'Montserrat', sans-serif",
        }}>
          Balabony is an educational and literary platform of Ukrainian stories. We bring back the joy of the Ukrainian language to children affected by war — through literature and living Ukrainian storytelling. Free access for IDP children, veterans (combat status), and people with disabilities is provided in partnership with the NGO &laquo;Institute of Civil Society&raquo;. Through shared stories, living language and warm humour we unite Ukrainians around their native culture — so that they stay in Ukraine and build its future.
        </p>
      </div>

      {/* ════════ КОПІРАЙТИ ════════ */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 22, textAlign: 'center',
        fontSize: 13, color: 'rgba(255,255,255,0.6)', maxWidth: 1200, margin: '0 auto'
      }}>
        <p style={{ marginBottom: 6 }}>
          © 2026 Balabony™. Історії українською. Усі права захищено згідно із законодавством України.
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '3px 0 0 0' }}>
          Торговельна марка: заявка №m202607908 до Укрпатенту.
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '3px 0 0 0' }}>
          Авторське право: свідоцтво АП №147106 від 18.05.2026 (УКРНОІВІ).
        </p>
      </div>

      {/* ════════ РЕКВІЗИТИ ФОП (юридичний блок, видно на всіх сторінках) ════════ */}
      <FooterLegalSection />

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
          white-space: nowrap;
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
        .footer-root :global(.footer-author-cta:hover .footer-cta-arrow) {
          transform: translateX(4px);
        }

        /* ── Become author CTA (golden filled button) ── */
        .footer-root :global(.footer-author-cta) {
          transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
        }
        .footer-root :global(.footer-author-cta:hover) {
          background: #FAC775 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(239, 159, 39, 0.45);
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

        /* ── Inclusivity / Accessibility CTAs ── */
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

        /* ── Fix mobile horizontal overflow: let grid columns shrink so flex-wrap works ── */
        .footer-root :global(.footer-grid) > div {
          min-width: 0;
        }
        .footer-root :global(.footer-grid) a,
        .footer-root :global(.footer-grid) p {
          overflow-wrap: break-word;
        }
      `}</style>
    </footer>
  )
}
