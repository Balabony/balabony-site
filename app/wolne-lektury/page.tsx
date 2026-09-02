import type { Metadata } from 'next'
import BookList, { type Book } from './BookList'

export const revalidate = 86400 // оновлюємо раз на добу

export const metadata: Metadata = {
  title: 'Львів і Галичина у Wolne Lektury — вільні тексти й аудіо | Balabony',
  description:
    'Твори авторів, пов’язаних зі Львовом і Галичиною, з польської цифрової бібліотеки Wolne Lektury: вільні тексти, доступні формати, безкоштовні аудіокниги. Дані з відкритого API, читання — на сайті бібліотеки.',
}

const NAVY = '#0E1A2B'
const CARD = '#14253B'
const GOLD = '#EF9F27'
const GOLD_DEEP = '#B5710C'
const CREAM = '#FFF8EE'
const LIGHTBLUE = '#B5D4F4'
const SERIF = "'Lora', Georgia, serif"
const SANS = "'Montserrat', Arial, sans-serif"

const API_URL = 'https://wolnelektury.pl/api/books/'
const CATALOG = 'https://wolnelektury.pl/katalog/lektura/'
const MAP_URL = 'https://wolnelektury.pl/mapa/'

/** Автори, чиї біографії пов’язані зі Львовом і Галичиною. */
const AUTHORS: { name: string; note: string }[] = [
  { name: 'Gabriela Zapolska', note: 'працювала і померла у Львові' },
  { name: 'Aleksander Fredro', note: 'жив і помер у Львові' },
  { name: 'Leopold Staff', note: 'народився у Львові' },
  { name: 'Maria Konopnicka', note: 'померла у Львові' },
  { name: 'Kornel Makuszyński', note: 'народився у Стрию, працював у Львові' },
  { name: 'Jan Kasprowicz', note: 'професор Львівського університету' },
]
const AUTHOR_NAMES = new Set(AUTHORS.map((a) => a.name))

interface WLListItem {
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

/** Ярлики форматів. Назви полів у відповіді бібліотеки можуть відрізнятися,
 *  тому читаємо захисно: чого немає — того просто не показуємо. */
const FORMAT_KEYS: { key: string; label: string }[] = [
  { key: 'epub', label: 'EPUB' },
  { key: 'mobi', label: 'MOBI' },
  { key: 'pdf', label: 'PDF' },
  { key: 'txt', label: 'TXT' },
  { key: 'fb2', label: 'FB2' },
  { key: 'html', label: 'HTML' },
  { key: 'daisy', label: 'DAISY' },
]

function readFormats(detail: unknown): string[] {
  if (!detail || typeof detail !== 'object') return []
  const rec = detail as Record<string, unknown>
  const out: string[] = []
  for (const { key, label } of FORMAT_KEYS) {
    const v = rec[key]
    if (typeof v === 'string' && v.length > 0) out.push(label)
  }
  const media = rec.media
  if (Array.isArray(media) && media.length > 0) out.push('MP3')
  return out
}

async function getDetail(href: string): Promise<unknown> {
  try {
    const res = await fetch(href, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    return (await res.json()) as unknown
  } catch {
    return null
  }
}

async function getBooks(): Promise<{ ok: boolean; books: Book[] }> {
  try {
    const res = await fetch(API_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return { ok: false, books: [] }

    const data: unknown = await res.json()
    if (!Array.isArray(data)) return { ok: false, books: [] }

    const picked = (data as WLListItem[]).filter(
      (b) => typeof b?.author === 'string' && AUTHOR_NAMES.has(b.author)
    )

    // Деталі тягнемо порціями, щоб не бити по бібліотеці залпом.
    const details = new Map<string, unknown>()
    const withHref = picked.filter((b) => typeof b.href === 'string')
    const CHUNK = 8
    for (let i = 0; i < withHref.length; i += CHUNK) {
      const slice = withHref.slice(i, i + CHUNK)
      const got = await Promise.all(slice.map((b) => getDetail(b.href as string)))
      slice.forEach((b, j) => details.set(b.href as string, got[j]))
    }

    const books: Book[] = picked.map((b) => ({
      title: b.title || 'Без назви',
      author: b.author || '',
      kind: b.kind,
      genre: b.genre,
      epoch: b.epoch,
      slug: b.slug,
      url: b.url || (b.slug ? `${CATALOG}${b.slug}/` : 'https://wolnelektury.pl/'),
      hasAudio: b.has_audio === true,
      formats: readFormats(b.href ? details.get(b.href) : null),
    }))

    books.sort(
      (a, b) =>
        a.author.localeCompare(b.author, 'pl') || a.title.localeCompare(b.title, 'pl')
    )

    return { ok: true, books }
  } catch {
    return { ok: false, books: [] }
  }
}

export default async function WolneLekturyPage() {
  const { ok, books } = await getBooks()

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
          Львів і Галичина у Wolne Lektury
        </h1>

        <p style={{ color: LIGHTBLUE, fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
          Шестеро авторів, чиї життя пов’язані зі Львовом і Галичиною. Їхні твори давно в
          суспільному надбанні, а польська цифрова бібліотека{' '}
          <a href="https://wolnelektury.pl/" target="_blank" rel="noopener" style={{ color: GOLD }}>
            Wolne Lektury
          </a>{' '}
          зробила з ними те, чого ми вчимося: відкриті тексти, доступні формати, безкоштовне
          аудіо.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
            margin: '0 0 28px',
          }}
        >
          {AUTHORS.map((a) => {
            const own = books.filter((b) => b.author === a.name)
            const audio = own.filter((b) => b.hasAudio).length
            return (
              <div
                key={a.name}
                style={{
                  background: CARD,
                  border: '1px solid rgba(181,212,244,0.18)',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontFamily: SERIF, color: GOLD, fontSize: 17, marginBottom: 4 }}>
                  {a.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: 'rgba(255,248,238,0.7)',
                    marginBottom: 8,
                  }}
                >
                  {a.note}
                </div>
                <div style={{ fontSize: 12, color: LIGHTBLUE }}>
                  творів: {own.length}
                  {audio > 0 && ` · з аудіо: ${audio}`}
                </div>
              </div>
            )
          })}
        </div>

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
            Як це працює
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: CREAM, margin: '0 0 12px' }}>
            Сторінку сформовано автоматично через відкритий програмний інтерфейс Wolne Lektury.
            Назви, жанри, епохи, доступні формати й наявність аудіо надходять безпосередньо з
            їхньої бібліотеки й оновлюються щодня. Тексти й аудіо лишаються на сайті Wolne
            Lektury — ми їх не зберігаємо й не поширюємо.
          </p>
          <a
            href={MAP_URL}
            target="_blank"
            rel="noopener"
            style={{
              display: 'inline-block',
              padding: '9px 16px',
              background: 'rgba(181,212,244,0.12)',
              border: `1px solid ${LIGHTBLUE}`,
              borderRadius: 10,
              color: LIGHTBLUE,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Карта творів за місцями у Wolne Lektury →
          </a>
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
            <a href="https://wolnelektury.pl/" target="_blank" rel="noopener" style={{ color: GOLD }}>
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
            У відповіді бібліотеки не знайдено творів цих авторів.
          </div>
        ) : (
          <BookList books={books} />
        )}

        <section
          lang="pl"
          style={{
            background: 'rgba(181,212,244,0.07)',
            border: '1px solid rgba(181,212,244,0.22)',
            borderRadius: 14,
            padding: '18px 22px',
            marginBottom: 28,
          }}
        >
          <h2
            style={{
              fontFamily: SERIF,
              color: LIGHTBLUE,
              fontSize: 18,
              margin: '0 0 10px',
            }}
          >
            O tej stronie
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,248,238,0.85)', margin: '0 0 10px' }}>
            Balabony to ukraińska platforma literacka ze Lwowa. Na tej stronie zbieramy utwory
            sześciorga autorów związanych ze Lwowem i Galicją, dostępne w bibliotece Wolne
            Lektury.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,248,238,0.85)', margin: 0 }}>
            Dane — tytuły, gatunki, epoki, formaty i informacja o audiobookach — pochodzą z
            otwartego API Wolnych Lektur i są odświeżane raz na dobę. Teksty i nagrania
            pozostają na stronie biblioteki: nie kopiujemy ich ani nie udostępniamy u siebie.
            Każdy odnośnik prowadzi do źródła.
          </p>
        </section>

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
          <a href="https://wolnelektury.pl/" target="_blank" rel="noopener" style={{ color: GOLD_DEEP }}>
            wolnelektury.pl
          </a>
          ). Умови використання кожного твору вказано на його сторінці в бібліотеці. Balabony не
          зберігає й не поширює тексти чи аудіофайли Wolne Lektury — сторінка лише показує
          каталог і веде на першоджерело.
        </div>
      </div>
    </main>
  )
}
