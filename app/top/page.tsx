import type { Metadata } from 'next'
import Link from 'next/link'
import { dbQuery } from '@/lib/db'
import { workPath } from '@/lib/rss'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Breadcrumbs from '@/app/components/Breadcrumbs'

/**
 * Рейтинги творів.
 *
 * У добірки входять ЛИШЕ окремі твори (type = 'story'). Серіали винесені
 * окремим блоком і в змаганні не беруть участі — не через авторство, а тому
 * що формат дає системну перевагу: серіал це сотня сторінок із наскрізними
 * читачами, окреме оповідання — одна. У спільному списку сто епізодів завжди
 * переважили б сто різних оповідань, і рейтинг перестав би показувати те,
 * заради чого існує: що читають серед творів різних авторів.
 *
 * Свідомо БЕЗ цифр. При наших числах (72 прочитання за місяць на 1132
 * опублікованих творах) підпис «прочитань: 3» показував би не те, що варте
 * уваги, а те, як мало нас читають. Порядок у списку каже все потрібне.
 *
 * Так само свідомо НЕ робимо «топ за місяць»: за 30 днів набирається кілька
 * десятків прочитань, список вийшов би з двох позицій. Рахуємо за весь час —
 * там дані накопичені. Коли трафік виросте, місячний зріз можна додати.
 *
 * Навіщо взагалі: у каталозі 1132 твори, і читач, який уже прийшов, не має
 * жодного способу зрозуміти, з чого почати. Плюс це перелінковка — ще один
 * шлях до глибоких сторінок, до яких інакше веде лише каталог.
 */

export const revalidate = 3600

const GOLD = '#ef9f27'
const CREAM = '#FFF8EE'
const MUTED = '#8CA0B8'
const FONT = "'Montserrat', sans-serif"

export const metadata: Metadata = {
  title: 'Що читають на Балабонах — рейтинг творів | Балабони',
  description:
    'Найпопулярніші українські історії, казки й серіали на Балабонах: найчитаніше за весь час, улюблене читачами та нові твори, які вже помітили.',
  alternates: { canonical: '/top' },
}

type Item = {
  slug: string
  title: string
  author_name: string | null
  type: string | null
}

/** Найчитаніше за весь час — за зарахованими прочитаннями. */
async function getMostRead(limit = 12): Promise<Item[]> {
  try {
    const res = await dbQuery(
      `select c.slug, c.title, c.author_name, c.type
         from article_reads r
         join content c on c.id = r.content_id
        where r.completed = true
          and c.status in ('approved', 'published')
          and c.type = 'story'
        group by c.slug, c.title, c.author_name, c.type
        order by count(*) desc, max(r.read_at) desc
        limit $1`,
      [limit],
    )
    return res.rows as Item[]
  } catch {
    return []
  }
}

/** Улюблене читачами — за вподобаннями. */
async function getMostLiked(limit = 12): Promise<Item[]> {
  try {
    const res = await dbQuery(
      `select c.slug, c.title, c.author_name, c.type
         from content_likes l
         join content c on c.id = l.content_id
        where c.status in ('approved', 'published')
          and c.type = 'story'
        group by c.slug, c.title, c.author_name, c.type
        order by count(*) desc
        limit $1`,
      [limit],
    )
    return res.rows as Item[]
  } catch {
    return []
  }
}

/** Нове й помічене: свіжі твори, які вже мають бодай одне прочитання. */
async function getNewNoticed(limit = 12): Promise<Item[]> {
  try {
    const res = await dbQuery(
      `select c.slug, c.title, c.author_name, c.type
         from content c
         join article_reads r on r.content_id = c.id and r.completed = true
        where c.status in ('approved', 'published')
          and c.type = 'story'
          and coalesce(c.approved_at, c.created_at) > now() - interval '90 days'
        group by c.slug, c.title, c.author_name, c.type, c.approved_at, c.created_at
        order by coalesce(c.approved_at, c.created_at) desc
        limit $1`,
      [limit],
    )
    return res.rows as Item[]
  } catch {
    return []
  }
}

function Board({ title, note, items }: { title: string; note: string; items: Item[] }) {
  if (items.length === 0) return null

  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontFamily: "'Comfortaa', sans-serif",
          fontSize: 'clamp(17px, 4.4vw, 21px)',
          fontWeight: 700,
          color: '#FAC775',
          margin: '0 0 4px',
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 14px', fontFamily: FONT }}>{note}</p>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {items.map((it, i) => (
          <li key={`${it.type}-${it.slug}`}>
            <Link
              href={workPath(it.type, it.slug)}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 10,
                border: '1px solid rgba(239,159,39,0.24)',
                background: 'rgba(239,159,39,0.05)',
                textDecoration: 'none',
                minWidth: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontFamily: "'Comfortaa', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: i < 3 ? GOLD : MUTED,
                  minWidth: 24,
                }}
              >
                {i + 1}
              </span>
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: FONT,
                    fontSize: 15,
                    fontWeight: 600,
                    color: CREAM,
                    lineHeight: 1.3,
                  }}
                >
                  {it.title}
                </span>
                {it.author_name && (
                  <span style={{ display: 'block', fontFamily: FONT, fontSize: 13, color: MUTED, marginTop: 2 }}>
                    {it.author_name}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default async function TopPage() {
  const [mostRead, mostLiked, newNoticed] = await Promise.all([
    getMostRead(),
    getMostLiked(),
    getNewNoticed(),
  ])

  const empty = mostRead.length === 0 && mostLiked.length === 0 && newNoticed.length === 0

  return (
    <>
      <Header />
      <main
        style={{
          minHeight: '70vh',
          maxWidth: 760,
          margin: '0 auto',
          padding: '20px 20px 64px',
        }}
      >
        <Breadcrumbs items={[{ label: 'Що читають' }]} />

        <h1
          style={{
            fontFamily: "'Comfortaa', sans-serif",
            fontSize: 'clamp(22px, 5.5vw, 28px)',
            fontWeight: 800,
            color: CREAM,
            margin: '14px 0 8px',
          }}
        >
          Що читають на Балабонах
        </h1>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, margin: '0 0 32px', fontFamily: FONT }}>
          У каталозі понад тисяча творів. Ці добірки — коротка відповідь на питання,
          з чого почати.
        </p>

        {empty ? (
          <p style={{ fontSize: 15, color: MUTED, fontFamily: FONT }}>
            Добірки з’являться, щойно набереться достатньо прочитань.{' '}
            <Link href="/stories" style={{ color: GOLD }}>
              Перейти до каталогу
            </Link>
            .
          </p>
        ) : (
          <>
            <Board
              title="Найчитаніші історії"
              note="Твори, які читачі дочитували до кінця найчастіше."
              items={mostRead}
            />
            <Board
              title="Улюблене читачами"
              note="Те, що найчастіше позначали серцем."
              items={mostLiked}
            />
            <Board
              title="Нове й помічене"
              note="Свіжі твори, які вже знайшли своїх читачів."
              items={newNoticed}
            />

            {/* Серіали — не рейтинг, а навігація: їх усього два. */}
            <section>
              <h2
                style={{
                  fontFamily: "'Comfortaa', sans-serif",
                  fontSize: 'clamp(17px, 4.4vw, 21px)',
                  fontWeight: 700,
                  color: '#FAC775',
                  margin: '0 0 4px',
                }}
              >
                Серіали
              </h2>
              <p style={{ fontSize: 13, color: MUTED, margin: '0 0 14px', fontFamily: FONT }}>
                Довгі історії, що виходять серіями.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                <Link
                  href="/episodes"
                  style={{
                    display: 'block',
                    padding: '16px 18px',
                    borderRadius: 12,
                    border: '1px solid rgba(239,159,39,0.32)',
                    background: 'rgba(239,159,39,0.06)',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ display: 'block', fontFamily: FONT, fontSize: 16, fontWeight: 700, color: CREAM }}>
                    Балабони
                  </span>
                  <span style={{ display: 'block', fontFamily: FONT, fontSize: 13, color: MUTED, marginTop: 4 }}>
                    Кумедні історії з українського села
                  </span>
                </Link>

                <Link
                  href="/tysha"
                  style={{
                    display: 'block',
                    padding: '16px 18px',
                    borderRadius: 12,
                    border: '1px solid rgba(239,159,39,0.32)',
                    background: 'rgba(239,159,39,0.06)',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ display: 'block', fontFamily: FONT, fontSize: 16, fontWeight: 700, color: CREAM }}>
                    Тиша
                  </span>
                  <span style={{ display: 'block', fontFamily: FONT, fontSize: 13, color: MUTED, marginTop: 4 }}>
                    Історія, яку чуєш серцем
                  </span>
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
