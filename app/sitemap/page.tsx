import type { Metadata } from 'next'
import Breadcrumbs from '@/app/components/Breadcrumbs'

const GOLD      = '#f0a500'
const NAVY_DEEP = '#0a1628'
const NAVY      = '#0f1e3a'
const FONT      = "'Montserrat', Arial, sans-serif"
const SERIF     = "'Lora', Georgia, serif"

export const metadata: Metadata = {
  title: 'Карта сайту · Балабони',
  description: 'Повна навігація сайту Балабони: серії, історії, ігри, документи, контакти.',
  alternates: { canonical: '/sitemap' },
}

interface SitemapLink {
  href:  string
  label: string
  note?: string
}

interface SitemapGroup {
  title: string
  links: SitemapLink[]
}

const GROUPS: SitemapGroup[] = [
  {
    title: 'Читати',
    links: [
      { href: '/',          label: 'Головна',          note: 'Hero, Reader, Pricing' },
      { href: '/episodes',  label: 'Серії Балабонів',  note: 'Сезонні випуски' },
      { href: '/stories',   label: 'Історії читачів',  note: 'Реальні авторські історії' },
      { href: '/stories?genre=fairytale', label: 'Казки', note: 'Окрема категорія' },
    ],
  },
  {
    title: 'Розваги',
    links: [
      { href: '/games', label: 'Ігри Балабонів', note: '12 інтерактивних ігор' },
    ],
  },
  {
    title: 'Підтримка та інклюзія',
    links: [
      { href: '/support',           label: 'Підтримати ініціативу',    note: 'UA · EN · DE донати' },
      { href: '/support?lang=en',   label: 'Donate (English)',         note: 'For international donors' },
      { href: '/support?lang=de',   label: 'Spenden (Deutsch)',        note: 'Für internationale Spenden' },
      { href: '/accessibility',     label: 'Доступність',              note: 'Налаштування шрифту і тем' },
    ],
  },
  {
    title: 'Для авторів',
    links: [
      { href: '/become-author', label: 'Стати автором',  note: '50%/40% умови, через Дію' },
    ],
  },
  {
    title: 'Про нас і зв\'язок',
    links: [
      { href: '/about',   label: 'Про автора',  note: 'Назар Колодій, Львів' },
      { href: '/contact', label: 'Контакти',    note: 'Форма зворотного зв\'язку' },
    ],
  },
  {
    title: 'Юридичні документи',
    links: [
      { href: '/legal/terms',           label: 'Угода користувача' },
      { href: '/legal/privacy',         label: 'Політика конфіденційності' },
      { href: '/legal/offer',           label: 'Публічна оферта' },
      { href: '/legal/cookies',         label: 'Політика Cookies' },
      { href: '/legal/author-contract', label: 'Договір з автором' },
    ],
  },
]

export default function SitemapPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: NAVY_DEEP,
      color: '#f5f0e8',
      fontFamily: FONT,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>

        <Breadcrumbs items={[{ label: 'Карта сайту' }]} />

        <h1 style={{
          fontFamily: SERIF,
          fontSize: 'clamp(28px, 5vw, 38px)',
          fontWeight: 700,
          color: '#f5f0e8',
          margin: '0 0 8px',
          lineHeight: 1.2,
        }}>
          Карта сайту
        </h1>

        <p style={{
          fontSize: 15,
          color: '#8899bb',
          lineHeight: 1.6,
          margin: '0 0 40px',
          maxWidth: 640,
        }}>
          Повна навігація по сторінках Балабони. Якщо щось загубили — тут точно знайдеться.
        </p>

        {/* 6 груп карток */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {GROUPS.map((group, idx) => (
            <section
              key={idx}
              style={{
                background: NAVY,
                border: `1px solid ${GOLD}33`,
                borderRadius: 16,
                padding: '24px 22px',
              }}
            >
              <h2 style={{
                fontSize: 13,
                fontWeight: 700,
                color: GOLD,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                margin: '0 0 16px',
                fontFamily: FONT,
              }}>
                {group.title}
              </h2>

              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                {group.links.map((link, lidx) => (
                  <li key={lidx}>
                    <a
                      href={link.href}
                      style={{
                        display: 'block',
                        padding: '8px 12px',
                        margin: '0 -12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#f5f0e8',
                        marginBottom: link.note ? 2 : 0,
                      }}>
                        {link.label}
                      </div>
                      {link.note && (
                        <div style={{
                          fontSize: 12,
                          color: '#8899bb',
                          lineHeight: 1.4,
                        }}>
                          {link.note}
                        </div>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Подвал з SEO-sitemap і поверненням */}
        <div style={{
          marginTop: 48,
          paddingTop: 28,
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          <p style={{
            fontSize: 13,
            color: '#8899bb',
            margin: 0,
            lineHeight: 1.6,
          }}>
            Шукаєте машинописний XML-sitemap для роботів? Він тут:{' '}
            <a href="/sitemap.xml" style={{ color: GOLD, textDecoration: 'underline' }}>
              /sitemap.xml
            </a>
          </p>

          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              background: `${GOLD}18`,
              border: `1px solid ${GOLD}44`,
              borderRadius: 10,
              color: GOLD,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: FONT,
            }}
          >
            На головну →
          </a>
        </div>

      </div>
    </main>
  )
}
