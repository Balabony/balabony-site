import type { Metadata } from 'next'

export const revalidate = 86400 // оновлюємо раз на добу

export const metadata: Metadata = {
  title: 'Габріеля Запольська у Wolne Lektury — спільний пілот | Balabony',
  description:
    'Корпус творів Габріелі Запольської з польської цифрової бібліотеки Wolne Lektury. Пілотна інтеграція Balabony та Fundacja Wolne Lektury: публічне надбання, доступні формати, аудіо.',
}

const NAVY = '#0E1A2B'
const CARD = '#14253B'
const GOLD = '#EF9F27'
const GOLD_DEEP = '#B5710C'
const CREAM = '#FFF8EE'
const LIGHTBLUE = '#B5D4F4'
const SERIF = "'Lora', Georgia, serif"
const SANS = "'Montserrat', Arial, sans-serif"

const AUTHOR = 'Gabriela Zapolska'
const API_URL = 'https://wolnelektury.pl/api/books/'
const CATALOG = 'https://wolnelektury.pl/katalog/lektura/'

interface WLBook {
  title?: string
  author?: string
  kind?: string
  genre?: string
  epoch?: string
  slug?: string
  href?: string
  url?: string
  has_audio?: boolean
}

interface Loaded {
  ok: boolean
  books: WLBook[]
}

async function getBooks(): Promise<Loaded> {
  try {
    const res = await fetch(API_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return { ok: false, books: [] }

    const data: unknown = await res.json()
    if (!Array.isArray(data)) return { ok: false, books: [] }

    const books = (data as WLBook[])
      .filter((b) => typeof b?.author === 'string' && b.author === AUTHOR)
      .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pl'))

    return { ok: true, books }
  } catch {
    return { ok: false, books: [] }
  }
}

function readUrl(b: WLBook): string {
  if (b.url) return b.url
  if (b.slug) return `${CATALOG}${b.slug}/`
  return 'https://wolnelektury.pl/'
}

export default async function WolneLekturyPage() {
  const { ok, books } = await getBooks()
  const withAudio = books.filter((b) => b.has_audio).length

  return (
    <main
      style={{
        background: NAVY,
        minHeight: '100vh',
        padding: '56px 20px 96px',
        fontFamily: SANS,
        color: CREAM,
      }}
    >
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <a
          href="/"
          style={{
            fontFamily: SERIF,
            fontSize: 22,
            fontWeight: 700,
            color: GOLD,
            textDecoration: 'none',
          }}
        >
          Balabony
        </a>

        <h1
          style={{
            fontFamily: SERIF,
            color: GOLD,
            fontSize: 34,
            lineHeight: 1.2,
            margin: '28px 0 12px',
          }}
        >
          Габріеля Запольська у Wolne Lektury
        </h1>

        <p style={{ color: LIGHTBLUE, fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
          Запольська писала про Львів і Галичину. Її твори давно в суспільному надбанні, і
          польська цифрова бібліотека{' '}
          <a
            href="https://wolnelektury.pl/"
            target="_blank"
            rel="noopener"
            style={{ color: GOLD }}
          >
            Wolne Lektury
          </a>{' '}
          зробила з ними те, чого ми вчимося: відкриті тексти, доступні формати, безкоштовне
          аудіо.
        </p>

        <div
          style={{
            background: CARD,
            border: '1px solid rgba(239,159,39,0.18)',
            borderRadius: 14,
            padding: '18px 22px',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: 'rgba(255,248,238,0.5)',
              marginBottom: 8,
            }}
          >
            Спільний пілот
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: CREAM, margin: 0 }}>
            Цю сторінку сформовано автоматично через відкритий програмний інтерфейс Wolne
            Lektury. Дані про твори — назви, жанри, епохи, наявність аудіо — надходять
            безпосередньо з їхньої бібліотеки й оновлюються щодня. Тексти й аудіо лишаються на
            сайті Wolne Lektury; ми їх не копіюємо.
          </p>
        </div>

        {!ok ? (
          <div
            style={{
              background: CARD,
              borderRadius: 16,
              padding: 28,
              color: 'rgba(255,248,238,0.7)',
              lineHeight: 1.7,
            }}
          >
            Не вдалося отримати дані з Wolne Lektury. Спробуйте оновити сторінку пізніше або
            перейдіть до бібліотеки напряму:{' '}
            <a
              href="https://wolnelektury.pl/"
              target="_blank"
              rel="noopener"
              style={{ color: GOLD }}
            >
              wolnelektury.pl
            </a>
            .
          </div>
        ) : books.length === 0 ? (
          <div
            style={{
              background: CARD,
              borderRadius: 16,
              padding: 28,
              color: 'rgba(255,248,238,0.7)',
            }}
          >
            У відповіді бібліотеки не знайдено творів цієї авторки.
          </div>
        ) : (
          <>
            <p
              style={{
                color: 'rgba(255,248,238,0.55)',
                fontSize: 13,
                lineHeight: 1.7,
                marginBottom: 20,
              }}
            >
              Знайдено творів: <strong style={{ color: CREAM }}>{books.length}</strong>
              {withAudio > 0 && (
                <>
                  {' '}
                  · з безкоштовним аудіо:{' '}
                  <strong style={{ color: CREAM }}>{withAudio}</strong>
                </>
              )}
            </p>

            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 36px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {books.map((b) => (
                <li
                  key={b.slug || b.title}
                  style={{
                    background: CARD,
                    border: '1px solid rgba(239,159,39,0.18)',
                    borderRadius: 14,
                    padding: '18px 22px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 10,
                      flexWrap: 'wrap',
                      marginBottom: 6,
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: SERIF,
                        color: GOLD,
                        fontSize: 20,
                        margin: 0,
                      }}
                    >
                      {b.title}
                    </h2>
                    {b.has_audio && (
                      <span
                        style={{
                          fontSize: 12,
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: 'rgba(181,212,244,0.15)',
                          color: LIGHTBLUE,
                          fontWeight: 600,
                        }}
                      >
                        Є аудіо
                      </span>
                    )}
                  </div>

                  {(b.genre || b.kind || b.epoch) && (
                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: 'rgba(255,248,238,0.55)',
                        margin: '0 0 10px',
                      }}
                    >
                      {[b.kind, b.genre, b.epoch].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  <a
                    href={readUrl(b)}
                    target="_blank"
                    rel="noopener"
                    style={{ fontSize: 14, color: GOLD_DEEP, textDecoration: 'none' }}
                  >
                    Читати або слухати у Wolne Lektury ↗
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        <div
          style={{
            borderTop: '1px solid rgba(255,248,238,0.12)',
            paddingTop: 20,
            color: 'rgba(255,248,238,0.45)',
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          Джерело даних — Fundacja Wolne Lektury, Варшава (
          <a
            href="https://wolnelektury.pl/"
            target="_blank"
            rel="noopener"
            style={{ color: GOLD_DEEP }}
          >
            wolnelektury.pl
          </a>
          ). Умови використання кожного твору вказано на його сторінці в бібліотеці. Balabony
          не зберігає й не поширює тексти чи аудіофайли Wolne Lektury — сторінка лише показує
          каталог і веде на першоджерело.
        </div>
      </div>
    </main>
  )
}
