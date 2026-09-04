'use client'

import { Fragment } from 'react'
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
  { title: 'Політика Cookies',          href: '/legal/cookies' },
  { title: 'Захист дітей',              href: '/legal/child-safety' },
  { title: 'Договір з автором',         href: '/legal/author-contract' },
  { title: 'Повернення коштів',         href: '/legal/refund' },
]

const SOCIALS = [
  { label: 'Telegram',  href: 'https://t.me/balabony' },
  { label: 'Viber',     href: 'https://invite.viber.com/?g2=AQBMgFGe%2Fjk0PlcLhJHUZH2E2oZwkFAw%2FlwxOFzMzeyndRSZrPl0L6YpePg1hlZR' },
  { label: 'Instagram', href: 'https://www.instagram.com/balabony_' },
  { label: 'TikTok',    href: 'https://www.tiktok.com/@balabony_' },
  { label: 'Facebook',  href: 'https://www.facebook.com/profile.php?id=61593491802778' },
  { label: 'WhatsApp',  href: 'https://wa.me/380505859141' },
]

const READ_LINKS = [
  { label: 'Серіал «Балабони»', href: '/episodes' },
  { label: 'Серіал «Тиша» 18+', href: '/tysha' },
  { label: 'Історії читачів',   href: '/stories' },
  { label: 'Казки',             href: '/fairytales' },
  { label: 'Ігри для мозку',    href: '/games' },
  { label: 'Автори Балабонів',  href: '/avtory' },
]

const PLATFORMS = [
  { label: 'Web (браузер)',        href: '/',  soon: false },
  { label: 'iOS (Safari PWA)',     href: null, soon: true  },
  { label: 'Android (Chrome PWA)', href: null, soon: true  },
  { label: 'Telegram-бот',         href: null, soon: true  },
  { label: 'Smart TV / Tablets',   href: null, soon: true  },
]


// ── ПАРТНЕРИ ─────────────────────────────────────────────
// Щоб додати грантодавця — додай об'єкт у масив.
// ВАЖЛИВО: фон футера темний, тож логотип має бути СВІТЛИМ (білим).
// Зовнішнє лого — повний URL; локальне — клади у /public/partners/ і вказуй '/partners/файл.svg'.
//
// ⚠ НЕ ВИДАЛЯТИ логотип ElevenLabs: це зобов'язання за ElevenLabs Impact Program
// (лист Richard Cave). Умови — логотип на будь-якій сторінці сайту + гіперпосилання
// на elevenlabs.io. Від цього залежить безкоштовний Pro-план на 600 000 кредитів/міс.
// Блок уже одного разу зник випадково у коміті daa5ffd від 23.08.2026.
const PARTNERS = [
  {
    name: 'ElevenLabs Impact Program',
    href: 'https://elevenlabs.io/impact-program',
    logo: '/partners/elevenlabs-white.svg?v=3',
    height: 22,
  },
  {
    name: 'Benevity',
    href: 'https://benevity.com',
    logo: '/partners/benevity-white.svg?v=1',
    height: 22,
  },
  // { name: 'Назва грантодавця', href: 'https://...', logo: '/partners/xxx-white.svg', height: 22 },
]

export default function Footer() {
  return (
    <footer className="footer-root" style={{ background: 'var(--dark)', color: '#94a3b8', padding: '24px 5% 72px', marginTop: 24 }}>

      {/* ════════ ОСНОВНІ 4 КОЛОНКИ ════════ */}
      <div style={{
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
              href="/contact"
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

        {/* ───── КОЛОНКА 2: ЧИТАТИ + ПЛАТФОРМИ + ДЛЯ АВТОРІВ ───── */}
        <div>
          <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Читати
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 14 }}>
            {READ_LINKS.map(item => (
              <li key={item.href} style={{ marginBottom: 5 }}>
                <a href={item.href} className="footer-link" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14 }}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

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
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '0 0 10px' }}>
            Запропонувати свою історію
          </p>
          <a
            href="/konkursy"
            className="footer-link"
            style={{
              display: 'inline-block',
              color: 'var(--accent-gold)', fontSize: 14, fontWeight: 600,
              textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Літературні конкурси →
          </a>
          <a
            href="/holosy"
            className="footer-link"
            style={{
              display: 'block', marginTop: 6,
              color: 'var(--accent-gold)', fontSize: 14, fontWeight: 600,
              textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Озвучення на замовлення →
          </a>
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
              <a href="/vydannya" className="footer-link" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Друковані видання
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
              { label: 'Конкурси',    href: '/konkursy' },
              { label: 'Безкоштовно', href: '/free'     },
              { label: 'Подарунок',   href: '/gift'     },
              { label: 'Рідер',       href: '/#reader'  },
              { label: 'Тарифи',      href: '/#pricing' },
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
          Balabony — українська літературна платформа: серіали з продовженням, історії письменників і казки для читачів різного віку. Проєкт розвиває <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>ЛОГО «Інститут громадянського суспільства»</span> (Львів, з 2005 року) разом із видавничою групою «Життя», яка з 2003 року видає літературні газети сукупним накладом близько 1,56 млн примірників на рік. Ветерани, люди з інвалідністю та родини ВПО отримують повний доступ за 1 гривню на рік із підтвердженням статусу через «Дію». Платформа побудована з урахуванням стандарту доступності WCAG 2.1 рівня AA. Аудіоверсії історій — у розробці.
        </p>
        <p style={{
          fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)',
          margin: 0, fontStyle: 'italic',
          fontFamily: "'Montserrat', sans-serif",
        }}>
          Balabony is a Ukrainian literary platform: serialised fiction, writers&rsquo; stories and fairy tales for readers of all ages. The project is run by the NGO &laquo;Institute of Civil Society&raquo; (Lviv, founded 2005) together with the Zhyttia publishing group, which has published literary newspapers since 2003 with a combined circulation of around 1.56 million copies a year. Veterans, people with disabilities and internally displaced families receive full access for one hryvnia per year, with status verified through the state Diia service. The platform is built to WCAG 2.1 level AA accessibility. Audio versions of the stories are in development.
        </p>
      </div>

      {/* ════════ ПАРТНЕРИ ════════ */}
      {/* Щоб додати партнера — додай об'єкт у масив PARTNERS вгорі файлу.
          Для темного фону футера логотип має бути світлим (білим). */}
      <div style={{
        maxWidth: 1200, margin: '0 auto 24px', paddingTop: 4,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <h4 style={{
          color: 'var(--accent-gold)', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0,
          fontFamily: "'Montserrat', sans-serif",
        }}>
          Партнери
        </h4>
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
          gap: '12px 22px', maxWidth: 760,
        }}>
          {PARTNERS.map((p, i) => (
            <Fragment key={p.name}>
              {i > 0 && (
                <span aria-hidden="true" style={{
                  width: 1, height: 16, background: 'rgba(255,255,255,0.18)',
                }} />
              )}
              <a
                href={p.href}
                target="_blank"
                rel="noreferrer"
                aria-label={p.name}
                className="footer-partner-logo"
                style={{ display: 'inline-flex', opacity: 0.7, transition: 'opacity 0.2s ease' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.logo}
                  alt={p.name}
                  height={p.height}
                  style={{ height: p.height, width: 'auto', display: 'block' }}
                />
              </a>
            </Fragment>
          ))}
        </div>
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

        /* ── Partner logo (ElevenLabs, Benevity) ── */
        .footer-root :global(.footer-partner-logo:hover) {
          opacity: 1 !important;
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
      `}</style>
    </footer>
  )
}
