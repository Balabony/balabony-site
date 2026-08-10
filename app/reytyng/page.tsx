import type { Metadata } from 'next'
import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ThemeProvider } from '../context/ThemeContext'
import Breadcrumbs from '../components/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Рейтинг авторів — Балабони',
  description: 'Щотижневий рейтинг авторів Балабонів: найбільше прочитань, найкраща дочитуваність, новий автор тижня, відкриття тижня.',
  alternates: { canonical: '/reytyng' },
  openGraph: {
    title: 'Рейтинг авторів — Балабони',
    description: 'Щотижневий рейтинг авторів Балабонів.',
    url: 'https://balabony.com/reytyng',
    type: 'website',
  },
}

export const revalidate = 3600

/**
 * ⭐ ГОЛОВНИЙ ПЕРЕМИКАЧ.
 *
 * true  — сторінка показує ПРИКЛАД оформлення з умовними іменами
 *         і великою плашкою «дані умовні». Потрібно, поки прочитань мало.
 * false — сторінка рахує реальні дані з article_reads.
 *
 * Коли за тиждень набереться хоча б 200–300 дочитувань — міняємо на false.
 * Більше нічого правити не треба.
 */
const DEMO = true

/** Скільки місць показуємо. Одинадцятий не має знати, що він одинадцятий. */
const TOP = 10

/** Мінімум відкриттів, щоб потрапити в рейтинг за часткою дочитування. */
const MIN_OPENS_FOR_RATE = 10

/** Мінімум прочитань, щоб приріст рахувався зростанням, а не випадковістю. */
const MIN_READS_FOR_GROWTH = 5

interface Row {
  author: string
  title: string | null
  slug: string | null
}

interface Board {
  key: string
  name: string
  explain: string
  rows: Row[]
}

/* ─────────────────────────── ПРИКЛАД ─────────────────────────── */

/**
 * Умовні позначки, свідомо НЕ схожі на справжні прізвища: сторінка не має
 * створювати враження, що когось із реальних авторів обійшли вигадані люди.
 */
const demoRows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    author: `Автор ${String.fromCharCode(1040 + i)}`, // А, Б, В…
    title: 'Назва твору',
    slug: null,
  }))

/* ─────────────────────────── РЕАЛЬНІ ДАНІ ─────────────────────────── */

interface ReadRow {
  content_id: string | null
  completed: boolean | null
  read_date: string
}

async function realBoards(): Promise<Board[]> {
  const db = getSupabaseAdmin()

  const since = new Date()
  since.setDate(since.getDate() - 14)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data: reads } = await db
    .from('article_reads')
    .select('content_id, completed, read_date')
    .gte('read_date', sinceStr)

  const { data: works } = await db
    .from('content')
    .select('id, title, slug, author_name, published_at')
    .eq('status', 'published')

  const list = (reads ?? []) as ReadRow[]
  const byId = new Map(
    (works ?? []).map((w) => [
      String(w.id),
      {
        title: (w.title as string) ?? '',
        slug: (w.slug as string) ?? '',
        author: (w.author_name as string) ?? '',
        published: (w.published_at as string) ?? null,
      },
    ]),
  )

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString().slice(0, 10)

  /** Агрегати по твору за поточний і попередній тиждень. */
  const stat = new Map<string, { reads: number; opens: number; prev: number }>()

  for (const r of list) {
    if (!r.content_id) continue
    const s = stat.get(r.content_id) ?? { reads: 0, opens: 0, prev: 0 }
    const thisWeek = r.read_date >= weekStr
    if (thisWeek) {
      s.opens += 1
      if (r.completed) s.reads += 1
    } else if (r.completed) {
      s.prev += 1
    }
    stat.set(r.content_id, s)
  }

  /** Один автор — одне місце в списку: беремо його найкращий твір. */
  const bestPerAuthor = (
    scored: { id: string; score: number }[],
  ): Row[] => {
    const seen = new Set<string>()
    const out: Row[] = []
    for (const s of scored.sort((a, b) => b.score - a.score)) {
      const w = byId.get(s.id)
      if (!w || !w.author || seen.has(w.author)) continue
      seen.add(w.author)
      out.push({ author: w.author, title: w.title, slug: w.slug })
      if (out.length >= TOP) break
    }
    return out
  }

  const byReads = bestPerAuthor(
    [...stat.entries()]
      .filter(([, s]) => s.reads > 0)
      .map(([id, s]) => ({ id, score: s.reads })),
  )

  const byRate = bestPerAuthor(
    [...stat.entries()]
      .filter(([, s]) => s.opens >= MIN_OPENS_FOR_RATE)
      .map(([id, s]) => ({ id, score: s.reads / s.opens })),
  )

  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 30)
  const monthStr = monthAgo.toISOString()

  const byNew = bestPerAuthor(
    [...stat.entries()]
      .filter(([id, s]) => {
        const w = byId.get(id)
        return s.reads > 0 && !!w?.published && w.published >= monthStr
      })
      .map(([id, s]) => ({ id, score: s.reads })),
  )

  const byGrowth = bestPerAuthor(
    [...stat.entries()]
      .filter(([, s]) => s.reads >= MIN_READS_FOR_GROWTH && s.reads > s.prev)
      .map(([id, s]) => ({ id, score: s.reads / Math.max(1, s.prev) })),
  )

  return boards(byReads, byRate, byNew, byGrowth)
}

function boards(a: Row[], b: Row[], c: Row[], d: Row[]): Board[] {
  return [
    {
      key: 'reads',
      name: 'Найбільше прочитань',
      explain:
        'Скільки разів твір прочитали за тиждень. Одна людина — одне прочитання на день, скільки б разів вона не відкривала сторінку.',
      rows: a,
    },
    {
      key: 'rate',
      name: 'Найкраща дочитуваність',
      explain:
        'Не скільки відкрили, а скільки дочитали до кінця. Тут виграє не обсяг, а те, чи тримає текст читача. Потрібно щонайменше 10 відкриттів за тиждень.',
      rows: b,
    },
    {
      key: 'new',
      name: 'Новий автор тижня',
      explain:
        'Тільки серед тих, хто опублікувався вперше за останні 30 днів. Автори з довгим стажем сюди не потрапляють.',
      rows: c,
    },
    {
      key: 'growth',
      name: 'Відкриття тижня',
      explain:
        'Найбільший приріст порівняно з минулим тижнем. Сюди може потрапити будь-хто — навіть автор із трьома оповіданнями.',
      rows: d,
    },
  ]
}

/* ─────────────────────────── СТОРІНКА ─────────────────────────── */

export default async function Page() {
  const data: Board[] = DEMO
    ? boards(demoRows(TOP), demoRows(6), demoRows(4), demoRows(5))
    : await realBoards()

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px 64px' }}>
        <Breadcrumbs items={[{ label: 'Рейтинг авторів' }]} />

        <h1
          style={{
            fontFamily: "'Montserrat', Arial, sans-serif",
            fontSize: 34,
            fontWeight: 800,
            color: 'var(--accent-gold)',
            margin: '12px 0 10px',
          }}
        >
          Рейтинг авторів
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.65, maxWidth: 760, marginBottom: 18 }}>
          Щопонеділка ми підбиваємо підсумки тижня. Рейтинг рахується автоматично
          з того, як читають ваші тексти, — редакція на нього не впливає.
        </p>

        {DEMO && (
          <div
            style={{
              border: '1.5px solid var(--accent-gold)',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 26,
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: 'var(--accent-gold)' }}>Приклад оформлення.</strong>{' '}
            Імена в списках умовні — це показ того, як виглядатиме сторінка.
            Підрахунок прочитань запущено 2 серпня 2026 року; щойно даних
            набереться достатньо, тут з’являться справжні імена й твори.
          </div>
        )}

        <div style={{ display: 'grid', gap: 26 }}>
          {data.map((b) => (
            <section
              key={b.key}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 14,
                padding: '20px 22px',
              }}
            >
              <h2
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: 21,
                  fontWeight: 800,
                  margin: '0 0 6px',
                }}
              >
                {b.name}
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.75, margin: '0 0 14px' }}>
                {b.explain}
              </p>

              {b.rows.length === 0 ? (
                <p style={{ fontSize: 15, opacity: 0.6 }}>
                  Цього тижня список порожній — замало даних для підрахунку.
                </p>
              ) : (
                <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {b.rows.map((r, i) => (
                    <li
                      key={`${b.key}-${i}`}
                      style={{
                        display: 'flex',
                        gap: 14,
                        alignItems: 'baseline',
                        padding: '9px 0',
                        borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <span
                        style={{
                          minWidth: 26,
                          fontWeight: 800,
                          fontSize: 15,
                          color: i < 3 ? 'var(--accent-gold)' : 'inherit',
                          opacity: i < 3 ? 1 : 0.5,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{r.author}</span>
                        {r.title && (
                          <span style={{ display: 'block', fontSize: 14, opacity: 0.7 }}>
                            {r.slug ? (
                              <Link
                                href={`/stories/${r.slug}`}
                                style={{ color: 'inherit', textDecoration: 'none' }}
                              >
                                {r.title}
                              </Link>
                            ) : (
                              r.title
                            )}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>

        <section style={{ marginTop: 34, maxWidth: 780 }}>
          <h2
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: 21,
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Як формується рейтинг
          </h2>

          <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 10 }}>
            <strong>Що вважається прочитанням.</strong> Твір зараховується
            прочитаним, коли читач переглянув щонайменше 70% тексту. Це той самий
            поріг, за яким рахується винагорода автора, — окремої «рейтингової»
            арифметики немає.
          </p>

          <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 10 }}>
            <strong>Одна людина — одне прочитання на день.</strong> Скільки б разів
            читач не відкривав ту саму сторінку, зарахується один раз. Накрутити
            рейтинг переглядами не вийде.
          </p>

          <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 10 }}>
            <strong>Один автор — одне місце.</strong> Якщо кілька ваших творів
            потрапляють у список, показуємо найкращий. Так у топі більше різних
            імен.
          </p>

          <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 10 }}>
            <strong>Чисел не показуємо.</strong> Ані прочитань, ані відсотків —
            лише місце. Порівнювати себе з іншими за цифрами ми вважаємо зайвим.
          </p>

          <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 10 }}>
            <strong>Місця не «горять».</strong> Щопонеділка списки починаються
            заново, але здобуте місце залишається за автором назавжди: переможець
            тижня так і лишається переможцем того тижня.
          </p>

          <p style={{ fontSize: 15, lineHeight: 1.7 }}>
            <strong>Хто бере участь.</strong> Усі автори платформи, зокрема ті, чиї
            твори прийшли з наших газет. Окремо реєструватися чи щось надсилати
            не треба — досить того, що ваш текст опубліковано.
          </p>
        </section>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
