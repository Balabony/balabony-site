import Script from 'next/script'

const GOLD = '#f0a500'
const FONT = "'Montserrat', Arial, sans-serif"

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
   *
   * Приклад для /episodes/s1e01:
   *   items={[
   *     { label: 'Серії', href: '/series' },
   *     { label: 'Панас і 5G на вишні' },  // без href — це поточна сторінка
   *   ]}
   */
  items: BreadcrumbItem[]
  /**
   * Базовий URL сайту для JSON-LD (потрібен абсолютний). За замовчуванням — balabony.com.
   */
  siteUrl?: string
}

/**
 * Хлібні крихти зі стилем Балабонів:
 * — кастомний SVG-домик (золото, тонкі лінії), без emoji і сторонніх іконкових бібліотек
 * — розділювач «›» приглушений
 * — поточна сторінка не клікабельна
 * — рендерить JSON-LD (schema.org BreadcrumbList) для Google rich snippets
 *
 * Це server component — не використовує state/effects.
 * Безпечно вставляти на будь-яку сторінку (server або client) — Next дозволяє server-component як child client-component не навпаки, тут все ок.
 */
export default function Breadcrumbs({ items, siteUrl = 'https://balabony.com' }: BreadcrumbsProps) {
  // Готуємо повний список елементів — додаємо Home першим
  const allItems: BreadcrumbItem[] = [
    { href: '/' }, // home — лише іконка, label НЕ показуємо у DOM, але передамо в JSON-LD як «Головна»
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
                      color: isHome ? GOLD : '#8899bb',
                      textDecoration: 'none',
                      fontWeight: isHome ? 600 : 500,
                      transition: 'color 0.15s',
                    }}
                  >
                    {isHome ? <HomeIcon /> : item.label}
                  </a>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      color: isLast ? '#f5f0e8' : '#8899bb',
                      fontWeight: isLast ? 600 : 500,
                    }}
                  >
                    {isHome ? <HomeIcon /> : item.label}
                  </span>
                )}

                {/* Розділювач (крім останнього) */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: 13,
                      color: '#445566',
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
 * Фірмовий домик — тонкі лінії, золото.
 * Стилістика співпадає з іншими SVG на сайті (back-arrow, error-triangle).
 */
function HomeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Дах + стіни */}
      <path
        d="M2 6 L7 2 L12 6 L12 12 L8.5 12 L8.5 8.5 L5.5 8.5 L5.5 12 L2 12 Z"
        stroke={GOLD}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
