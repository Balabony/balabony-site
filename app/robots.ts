import type { MetadataRoute } from 'next'

const BASE_URL = 'https://balabony.com'

/**
 * Файл /robots.txt — інструкції для пошукових ботів.
 * Next.js App Router генерує його з цього модуля автоматично.
 *
 * Правила:
 *  - дозволяємо індексувати все, що не у виключеннях
 *  - забороняємо: адмінку, API, особистий кабінет, чернетки оплати
 *  - даємо посилання на sitemap.xml для швидшої індексації
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api',
          '/api/',
          '/login',
          '/profile',
          '/contact?topic=error', // звіти про помилки — не для індексації
        ],
      },
      // GPTBot — забороняємо тренування ШІ-моделей на нашому контенті
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
