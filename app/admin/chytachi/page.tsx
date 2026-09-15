// FILE: app/admin/chytachi/page.tsx
//
// ЗАЛОГІНЕНІ ЧИТАЧІ — хто вони, скільки їх і чи ростуть.
//
// Навіщо окрема сторінка, коли є /admin/chytach і /admin/dochytuvannia.
// Ті дві дивляться на ТВОРИ: що читають, де кидають. Ця дивиться на ЛЮДЕЙ з
// акаунтом — і лише на них. Причина конкретна: за умовами конкурсів
// дочитування зараховується тільки читачеві, який увійшов у кабінет, і лише
// якщо він прочитав щось ще й у іншого автора. Виміряно 14.09.2026: з 620
// прочитань з акаунта було 6, і жодне не проходило фільтр. Щоб таке не
// відкривалося за тиждень до підсумків, число має бути перед очима щодня.
//
// ЩО ТУТ ВИДНО
//   Усього акаунтів        — рядки в users (створюються тригером при реєстрації).
//   Читали хоч щось        — має бодай один рядок в article_reads.
//   Мають дочитування      — той самий поріг, що й у грошах: completed = true
//                            (70% обсягу за п. 1.5 договору).
//   Готові до заліку       — дочитали твори щонайменше ДВОХ різних авторів,
//                            тобто проходять третій конкурсний фільтр.
//                            Це і є те число, з якого збереться конкурс.
//   Зростання по тижнях    — реєстрації, а не прочитання. Тиждень від понеділка.
//
// ЧОМУ ТУТ НЕМАЄ ГОСТЕЙ
// article_reads пише і гостей теж — resolveReaderId кладе туди ідентифікатор
// із cookie. Вони приєднуються join-ом із users і відсіюються: гість не має
// рядка в users. Це навмисно та сама умова, що в lib/contest-reads.ts, інакше
// адмінка показувала б оптимістичніші цифри, ніж конкурсний підрахунок.
//
// ПОШТА ЧИТАЧА тут видима — розділ уже за паролем адмінки (proxy.ts), а без
// пошти неможливо написати тим десятьом, на яких тримається конкурс.

import { dbQuery } from '@/lib/db'

export const metadata = {
  title: 'Залогінені читачі — адмінка',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#ef9f27'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const LINE = 'rgba(143,163,196,0.22)'

type Reader = {
  id: string
  email: string
  created_at: string | null
  finished_works: number
  authors: number
  last_read: string | null
}

type WeekRow = { week: string; signups: number }

/** Дата в людському вигляді; порожнє значення не ламає рядок. */
function d(v: string | null): string {
  if (!v) return '—'
  const t = new Date(v)
  if (Number.isNaN(t.getTime())) return '—'
  return t.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function Stat({ value, label, note, accent }: { value: number; label: string; note: string; accent?: boolean }) {
  return (
    <div style={{ background: NAVY, border: `1px solid ${accent ? 'rgba(239,159,39,0.45)' : LINE}`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent ? GOLD : CREAM, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>{note}</div>
    </div>
  )
}

export default async function ChytachiPage() {
  let readers: Reader[] = []
  let weeks: WeekRow[] = []
  let error = ''

  try {
    const res = await dbQuery(
      `with acts as (
         select ar.user_id,
                count(distinct ar.content_id) filter (where ar.completed)                       as finished_works,
                count(distinct c.author_id)   filter (where ar.completed
                                                        and c.author_id is not null)            as authors,
                max(ar.read_date)                                                               as last_read
           from article_reads ar
           left join content c on c.id = ar.content_id
          group by ar.user_id
       )
       select u.id::text                       as id,
              coalesce(u.email, '')            as email,
              u.created_at                     as created_at,
              coalesce(a.finished_works, 0)::int as finished_works,
              coalesce(a.authors, 0)::int        as authors,
              a.last_read                      as last_read
         from users u
         left join acts a on a.user_id = u.id
        order by u.created_at desc nulls last
        limit 1000`,
    )
    readers = res.rows as Reader[]
  } catch (e) {
    error = e instanceof Error ? e.message : 'невідома помилка'
  }

  try {
    const res = await dbQuery(
      `select to_char(date_trunc('week', u.created_at), 'YYYY-MM-DD')::text as week,
              count(*)::int                                                as signups
         from users u
        where u.created_at >= now() - interval '12 weeks'
        group by 1
        order by 1`,
    )
    weeks = res.rows as WeekRow[]
  } catch {
    // Зростання — довідкова частина: якщо запит упав, таблиця читачів усе одно
    // має показатися. Мовчазний catch тут навмисний.
  }

  const total = readers.length
  const read = readers.filter(r => r.last_read).length
  const finished = readers.filter(r => r.finished_works > 0).length
  const ready = readers.filter(r => r.authors >= 2).length

  const maxWeek = Math.max(1, ...weeks.map(w => w.signups))

  return (
    <main style={{ background: '#0a1628', minHeight: '100vh', padding: '28px 20px 80px', fontFamily: FONT, color: CREAM }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <a href="/admin" style={{ fontSize: 13, color: 'rgba(245,240,232,0.6)', textDecoration: 'none' }}>← Адмінка</a>

        <h1 style={{ color: GOLD, fontSize: 26, margin: '14px 0 6px' }}>Залогінені читачі</h1>
        <p style={{ color: MUTED, fontSize: 13.5, lineHeight: 1.6, margin: '0 0 22px', maxWidth: 760 }}>
          Тільки люди з акаунтом. Гості сюди не потрапляють — так само, як і в конкурсний
          підрахунок. «Готові до заліку» — ті, чиє дочитування конкурс зарахує вже сьогодні.
        </p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '11px 14px', fontSize: 13, marginBottom: 18 }}>
            Запит не виконався: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          <Stat value={total}    label="Акаунтів"          note="Усі зареєстровані" />
          <Stat value={read}     label="Читали хоч щось"   note="Є бодай одне відкриття тексту" />
          <Stat value={finished} label="Мають дочитування" note="70% обсягу, як у виплатах авторам" />
          <Stat value={ready}    label="Готові до заліку"  note="Дочитали творів двох різних авторів" accent />
        </div>

        <section style={{ marginTop: 34 }}>
          <h2 style={{ fontSize: 17, color: GOLD, margin: '0 0 4px' }}>Реєстрації по тижнях</h2>
          <p style={{ color: MUTED, fontSize: 12.5, margin: '0 0 14px' }}>Останні 12 тижнів, від понеділка.</p>

          {weeks.length === 0 ? (
            <div style={{ color: MUTED, fontSize: 13 }}>За 12 тижнів жодної реєстрації.</div>
          ) : (
            <div style={{ display: 'grid', gap: 7 }}>
              {weeks.map(w => (
                <div key={w.week} style={{ display: 'grid', gridTemplateColumns: '92px 1fr 42px', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: MUTED }}>{d(w.week)}</span>
                  <span style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 5, height: 16 }}>
                    <span style={{ display: 'block', height: 16, borderRadius: 5, background: GOLD, width: `${Math.round((w.signups / maxWeek) * 100)}%` }} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{w.signups}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 17, color: GOLD, margin: '0 0 4px' }}>Список</h2>
          <p style={{ color: MUTED, fontSize: 12.5, margin: '0 0 14px' }}>
            Найновіші зверху, до 1000 рядків. «Авторів» — скільки різних авторів читач дочитав;
            від двох його дочитування йдуть у конкурсний залік.
          </p>

          <div style={{ overflowX: 'auto', border: `1px solid ${LINE}`, borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: NAVY, textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Пошта</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Зареєстрований</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Дочитав творів</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Авторів</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Востаннє читав</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Залік</th>
                </tr>
              </thead>
              <tbody>
                {readers.map(r => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${LINE}` }}>
                    <td style={{ padding: '9px 12px' }}>{r.email || <span style={{ color: MUTED }}>без пошти</span>}</td>
                    <td style={{ padding: '9px 12px', color: MUTED }}>{d(r.created_at)}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>{r.finished_works}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>{r.authors}</td>
                    <td style={{ padding: '9px 12px', color: MUTED }}>{d(r.last_read)}</td>
                    <td style={{ padding: '9px 12px' }}>
                      {r.authors >= 2
                        ? <span style={{ color: '#22c55e', fontWeight: 700 }}>так</span>
                        : <span style={{ color: MUTED }}>ні</span>}
                    </td>
                  </tr>
                ))}
                {readers.length === 0 && !error && (
                  <tr><td colSpan={6} style={{ padding: '16px 12px', color: MUTED }}>Жодного акаунта.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  )
}
