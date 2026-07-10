import Script from 'next/script'

const FONT = "'Montserrat', Arial, sans-serif"

// Палітри для різних варіантів
const PALETTES = {
  dark: {
    homeColor:    'var(--accent-gold)', // золото
    linkColor:    '#8899bb', // сіро-синій
    currentColor: '#f5f0e8', // світлий (поточна сторінка)
    separator:    '#7d90a6', // приглушений, WCAG AA 5.45:1 на темному
  },
  light: {
    homeColor:    '#BA7517', // темно-помаранчевий (legal accent)
    linkColor:    '#BA7517', // той же — добре читається на бежевому
    currentColor: '#2C1A02', // темно-коричневий
    separator:    'rgba(186,117,23,0.5)',
  },
}

export interface BreadcrumbItem {
  /** Текст для відображення. Для першого (Home) можна не передавати — буде тільки іконка. */
  label?: string
  /** URL. Якщо не передано — елемент рендериться як поточна сторінка (не клікабельний). */
  href?: string
}

interface BreadcrumbsProps {
  /**
   * Список елементів, починаючи з рівня ПІСЛЯ головної.
   * Головна додається автоматично першим елементом (іконка дому).
   */
  items: BreadcrumbItem[]
  /**
   * Базовий URL сайту для JSON-LD (потрібен абсолютний). За замовчуванням — balabony.com.
   */
  siteUrl?: string
  /**
   * Колірна схема:
   *  - 'dark'  (за замовчуванням) — для темного фону сайту, золотий домик
   *  - 'light' — для світлого фону (legal-сторінки), темно-помаранчевий домик
   */
  variant?: 'dark' | 'light'
}

/**
 * Хлібні крихти зі стилем Балабонів:
 * — кастомний SVG-домик (без emoji і сторонніх іконкових бібліотек)
 * — розділювач «›» приглушений
 * — поточна сторінка не клікабельна
 * — рендерить JSON-LD (schema.org BreadcrumbList) для Google rich snippets
 * — підтримує variant='dark' (за замовч.) і variant='light' (для legal сторінок)
 */
export default function Breadcrumbs({ items, siteUrl = 'https://balabony.com', variant = 'dark' }: BreadcrumbsProps) {
  const palette = PALETTES[variant]

  // Готуємо повний список елементів — додаємо Home першим
  const allItems: BreadcrumbItem[] = [
    { href: '/' },
    ...items,
  ]

  // JSON-LD для пошуковиків (schema.org BreadcrumbList)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: idx === 0 ? 'Головна' : (item.label ?? ''),
      ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
    })),
  }

  return (
    <>
      <nav
        aria-label="Хлібні крихти"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 24,
          fontFamily: FONT,
        }}
      >
        <ol
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6,
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {allItems.map((item, idx) => {
            const isLast = idx === allItems.length - 1
            const isHome = idx === 0
            const isClickable = !!item.href && !isLast

            return (
              <li
                key={idx}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {/* Сам елемент */}
                {isClickable ? (
                  <a
                    href={item.href}
                    aria-label={isHome ? 'Головна' : undefined}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      color: isHome ? palette.homeColor : palette.linkColor,
                      textDecoration: 'none',
                      fontWeight: isHome ? 600 : 500,
                      transition: 'color 0.15s',
                    }}
                  >
                    {isHome ? <HomeIcon color={palette.homeColor} /> : item.label}
                  </a>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      color: isLast ? palette.currentColor : palette.linkColor,
                      fontWeight: isLast ? 600 : 500,
                    }}
                  >
                    {isHome ? <HomeIcon color={palette.homeColor} /> : item.label}
                  </span>
                )}

                {/* Розділювач (крім останнього) */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: 13,
                      color: palette.separator,
                      userSelect: 'none',
                    }}
                  >
                    ›
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* JSON-LD для Google rich snippets */}
      <Script
        id={`breadcrumb-jsonld-${items.map(i => i.label ?? '').join('-').slice(0, 50)}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}

/**
 * Фірмовий домик — тонкі лінії, колір налаштовується пропом.
 */
function HomeIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path
        d="M2 6 L7 2 L12 6 L12 12 L8.5 12 L8.5 8.5 L5.5 8.5 L5.5 12 L2 12 Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
