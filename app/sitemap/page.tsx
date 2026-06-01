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
      { href: '/episodes',  label: 'Серії Балабонів',  note: 'Усі випуски' },
      { href: '/series',    label: 'Огляд сезонів',    note: 'Сезонна добірка' },
      { href: '/stories',   label: 'Історії читачів',  note: 'Реальні авторські історії' },
      { href: '/stories?genre=Казка', label: 'Казки', note: 'Українські казки' },
    ],
  },
  {
    title: 'Розваги',
    links: [
      { href: '/games', label: 'Ігри Балабонів', note: '12 інтерактивних ігор' },
    ],
  },
  {
    title: 'Доступ і подарунки',
    links: [
      { href: '/free', label: 'Безкоштовно',  note: 'Безкоштовний доступ' },
      { href: '/gift', label: 'Подарунок',    note: 'Подарункова підписка' },
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
      { href: '/about',    label: 'Про автора' },
      { href: '/contact',  label: 'Зворотний зв\'язок', note: 'Форма звернення' },
      { href: '/contacts', label: 'Контакти',           note: 'Контактні дані' },
      { href: '/survey',   label: 'Опитування',         note: 'Поділіться думкою' },
    ],
  },
  {
    title: 'Акаунт',
    links: [
      { href: '/profile', label: 'Профіль',  note: 'Кабінет користувача' },
      { href: '/login',   label: 'Вхід',     note: 'Увійти / зареєструватись' },
    ],
  },
  {
    title: 'Юридичні документи',
    links: [
      { href: '/legal/terms',           label: 'Угода користувача' },
      { href: '/legal/privacy',         label: 'Політика конфіденційності' },
      { href: '/legal/offer',           label: 'Публічна оферта' },
      { href: '/legal/child-safety',    label: 'Дитяча безпека' },
      { href: '/legal/refund',          label: 'Повернення коштів' },
      { href: '/legal/cookies',         label: 'Файли cookie' },
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
          fontSize: 20,
          color: '#8899bb',
          lineHeight: 1.6,
          margin: '0 0 40px',
          maxWidth: 640,
        }}>
          Повна навігація по сторінках Балабони. Якщо щось загубили — тут точно знайдеться.
        </p>

        {/* групи карток */}
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
                fontSize: 17,
                fontWeight: 700,
                color: GOLD,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                margin: '0 0 18px',
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
                gap: 14,
              }}>
                {group.links.map((link, lidx) => (
                  <li key={lidx}>
                    <a
                      href={link.href}
                      style={{
                        display: 'block',
                        padding: '10px 12px',
                        margin: '0 -12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{
                        fontSize: 21,
                        fontWeight: 600,
                        color: '#f5f0e8',
                        marginBottom: link.note ? 4 : 0,
                      }}>
                        {link.label}
                      </div>
                      {link.note && (
                        <div style={{
                          fontSize: 16,
                          color: '#8899bb',
                          lineHeight: 1.45,
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

        {/* Подвал з поверненням на головну */}
        <div style={{
          marginTop: 48,
          paddingTop: 28,
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}>
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
              fontSize: 16,
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
