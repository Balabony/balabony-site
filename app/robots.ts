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
          // 08.09.2026: кабінет автора був відкритий ботам. Потрапити туди
          // без сесії не можна, але адреси осідали в індексі як порожні
          // сторінки, а /author/contract — це ще й текст договору.
          '/author/dashboard',
          '/author/contract',
          '/contact?topic=error', // звіти про помилки — не для індексації
        ],
      },
      // Тренувальні боти — забороняємо: на текстах наших авторів
      // моделі не тренують. Це узгоджено з авторським договором.
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
      // Цитувальні боти — дозволяємо явно. Вони нічого не тренують:
      // шукають відповідь на питання читача і ведуть його до нас із
      // посиланням на джерело. Заборонити їх означало б зникнути з
      // відповідей ШІ-помічників, куди люди дедалі частіше йдуть
      // замість пошуку. Дозвіл прописано окремим правилом, щоб при
      // наступній правці його не змели разом із тренувальними.
      { userAgent: 'OAI-SearchBot',   allow: '/' },
      { userAgent: 'ChatGPT-User',    allow: '/' },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'Claude-User',     allow: '/' },
      { userAgent: 'PerplexityBot',   allow: '/' },
      { userAgent: 'Perplexity-User', allow: '/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
