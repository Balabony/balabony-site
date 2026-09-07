import Script from 'next/script'

/**
 * Структуровані дані головної (schema.org).
 *
 * Дві сутності, яких досі бракувало:
 *  — Organization: без неї Google не збирає панель бренду в правій колонці
 *    видачі й не знає, що логотип і соцмережі належать одному видавцеві;
 *  — WebSite з SearchAction: дає рядок пошуку прямо у видачі. Має сенс
 *    відколи існує /search — до того вказувати було нікуди.
 *
 * Розмітка серверна й потрапляє в HTML одразу, без очікування браузера.
 */

const BASE = 'https://balabony.com'

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${BASE}/#organization`,
  name: 'Балабони',
  alternateName: 'Balabony',
  url: BASE,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE}/icon-512.png`,
    width: 512,
    height: 512,
  },
  description:
    'Українська платформа історій, казок і серіалів: авторські оповідання, сімейний серіал «Балабони», авторський серіал «Тиша».',
  foundingDate: '2005',
  founder: {
    '@type': 'Person',
    name: 'Богдан Хомин',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Львів',
    addressCountry: 'UA',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'nazar@balabony.com',
    availableLanguage: ['uk'],
  },
}

const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE}/#website`,
  url: BASE,
  name: 'Балабони',
  inLanguage: 'uk',
  publisher: { '@id': `${BASE}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function HomeJsonLd() {
  return (
    <Script
      id="home-jsonld"
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([organization, website]) }}
    />
  )
}
