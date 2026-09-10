// FILE: app/admin/dochytuvannia/page.tsx
//
// Дочитуваність творів — з даних, які вже пишуться.
//
// Звідки беруться цифри: таблиця reading_progress тримає ОДИН рядок на пару
// «читач + твір» (unique user_id, slug) і оновлює його при кожному русі по
// тексту. Тобто в базі лежить остання позиція кожного читача в кожному творі.
// Історії руху немає — і вона тут не потрібна: щоб порахувати, скільки людей
// дійшли до кінця, вистачає фінального відсотка.
//
// Що вважаємо:
//   читачі   — скільки різних людей відкривали твір і прогорнули далі 3%
//              (нижче — це відкрив і закрив, у «Продовжити читання» такі теж
//              не потрапляють);
//   дочитали — у кого відсоток 70 і вище. Поріг узято з договору, п. 1.5:
//              прочитанням вважається перегляд не менш як 70% ОБСЯГУ тексту.
//              За цією ж формулою рахується винагорода авторам, тож інший
//              поріг тут дав би в адмінці другу, суперечливу цифру.
//   медіана  — на якому відсотку стоїть середній читач. Якщо вона низька
//              при великій кількості читачів, твір кидають, і видно приблизно
//              де саме.
//
// ЧОМУ ЦИФРИ ТУТ І НА /admin/analytics РІЗНІ — не помилка, а різні мірила:
//   analytics бере story_events і рахує подію 'read', яку StoryReadTracker
//   ставить за ПОВНИМ правилом договору: 70% обсягу І мінімум 15 секунд на
//   кожні 1000 знаків. Тобто там ще й час.
//   тут беруться позиції читання, де часу немає взагалі — лише глибина.
// Через це наша частка буде ВИЩОЮ: сюди потрапляє той, хто прогорнув текст
// швидко. Для добору творів це прийнятно, для нарахування винагороди — ні.
// Гроші рахуються тільки за story_events.
//
// Навіщо: ротація вітрини зараз крутить усе за датою. Дочитуваність — єдиний
// чесний спосіб дізнатися, ЩО саме читають, і вона ж найкращий критерій для
// черги на озвучення: голосують одні люди, а читають інші.

import { dbQuery } from '@/lib/db'

export const metadata = {
  title: 'Дочитуваність — адмінка',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#ef9f27'

type Row = {
  slug: string
  title: string | null
  path: string | null
  type: string | null
  author_name: string | null
  readers: number
  finished: number
  median_percent: number
}

const TYPE_LABEL: Record<string, string> = {
  story: 'історія',
  balabony: 'Балабони',
  tysha: 'Тиша',
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

/** Колір частки дочитувань: зелений добре, жовтий середньо, червоний погано. */
function shareColor(share: number): string {
  if (share >= 60) return '#22c55e'
  if (share >= 35) return '#eab308'
  return '#ef4444'
}

export default async function DochytuvanniaPage({
  searchParams,
}: {
  searchParams: Promise<{ min?: string; type?: string }>
}) {
  const sp = await searchParams
  const minReaders = Math.max(1, Math.min(100, Number(sp.min) || 5))
  const typeFilter = ['story', 'balabony', 'tysha'].includes(sp.type ?? '') ? sp.type! : ''

  let rows: Row[] = []
  let error = ''

  try {
    const res = await dbQuery(
      `select
         rp.slug,
         max(rp.title)                                              as title,
         max(rp.path)                                               as path,
         max(c.type)                                                as type,
         max(c.author_name)                                         as author_name,
         count(*)::int                                              as readers,
         count(*) filter (where rp.percent >= 70)::int              as finished,
         coalesce(
           percentile_cont(0.5) within group (order by rp.percent), 0
         )::int                                                     as median_percent
       from reading_progress rp
       left join content c on c.id = rp.content_id
       where rp.percent >= 3
         -- Автор, який читає власний твір, у статистику не йде: з 11.09.2026
         -- йому не зараховують і подію прочитання. Для залогінених user_id —
         -- це id акаунта, тож порівняння з author_id працює; анонімні читачі
         -- мають куку і під цю умову не потрапляють.
         and (c.author_id is null or rp.user_id::text <> c.author_id::text)
       group by rp.slug
       having count(*) >= $1
       order by count(*) desc
       limit 500`,
      [minReaders],
    )
    rows = res.rows as Row[]
  } catch (e) {
    error = e instanceof Error ? e.message : 'невідома помилка'
  }

  const visible = typeFilter ? rows.filter(r => r.type === typeFilter) : rows

  const totalReaders = visible.reduce((s, r) => s + r.readers, 0)
  const totalFinished = visible.reduce((s, r) => s + r.finished, 0)

  // Найгірші за дочитуваністю. Поріг 50% обов'язковий: без нього при
  // мінімумі в одного читача сюди потрапляли твори зі 100% дочитуваністю
  // просто тому, що вони йшли в сортуванні після єдиного нуля — і поруч
  // стояв підпис «кидають близько 100%», що є нонсенсом.
  const worst = [...visible]
    .filter(r => pct(r.finished, r.readers) < 50)
    .sort((a, b) => pct(a.finished, a.readers) - pct(b.finished, b.readers))
    .slice(0, 5)

  const best = [...visible]
    .sort((a, b) => pct(b.finished, b.readers) - pct(a.finished, a.readers))
    .slice(0, 5)

  const link = (params: { min?: number; type?: string }) => {
    const q = new URLSearchParams()
    q.set('min', String(params.min ?? minReaders))
    if (params.type ?? typeFilter) q.set('type', params.type ?? typeFilter)
    return `/admin/dochytuvannia?${q.toString()}`
  }

  return (
    <main style={{ background: '#0f1e3a', minHeight: '100vh', padding: '28px 20px 64px', fontFamily: FONT, color: '#f5f0e8' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <a href="/admin" style={{ fontSize: 13, color: 'rgba(245,240,232,0.6)', textDecoration: 'none' }}>← Адмінка</a>

        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '14px 0 6px' }}>Дочитуваність</h1>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(245,240,232,0.65)', maxWidth: 720, margin: '0 0 24px' }}>
          Скільки читачів дійшли до кінця. Рахується з позицій читання: один рядок на пару
          «читач + твір», дочитаним вважається 70% і вище — поріг із договору, п. 1.5.
          Твори, які відкрили і закрили на перших відсотках, не враховуються.
        </p>

        {error && (
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', marginBottom: 20, fontSize: 13.5 }}>
            Запит не виконався: {error}
          </div>
        )}

        {/* Підсумок */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
          {[
            { label: 'творів у вибірці', value: visible.length },
            { label: 'читань', value: totalReaders },
            { label: 'дочитано', value: totalFinished },
            { label: 'середня дочитуваність', value: `${pct(totalFinished, totalReaders)}%` },
          ].map(card => (
            <div key={card.label} style={{ flex: '1 1 180px', padding: '14px 16px', borderRadius: 12, background: '#14253b', border: '1px solid rgba(239,159,39,0.25)' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: GOLD }}>{card.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.6)', marginTop: 2 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Фільтри */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18, fontSize: 13 }}>
          <span style={{ color: 'rgba(245,240,232,0.55)' }}>Тип:</span>
          {[['', 'усі'], ['story', 'історії'], ['balabony', 'Балабони'], ['tysha', 'Тиша']].map(([val, label]) => (
            <a key={val} href={link({ type: val })}
               style={{
                 padding: '5px 12px', borderRadius: 20, textDecoration: 'none',
                 border: `1px solid ${typeFilter === val ? GOLD : 'rgba(245,240,232,0.2)'}`,
                 color: typeFilter === val ? GOLD : 'rgba(245,240,232,0.75)',
               }}>{label}</a>
          ))}
          <span style={{ color: 'rgba(245,240,232,0.55)', marginLeft: 12 }}>Мінімум читачів:</span>
          {[1, 5, 10, 25].map(n => (
            <a key={n} href={link({ min: n })}
               style={{
                 padding: '5px 12px', borderRadius: 20, textDecoration: 'none',
                 border: `1px solid ${minReaders === n ? GOLD : 'rgba(245,240,232,0.2)'}`,
                 color: minReaders === n ? GOLD : 'rgba(245,240,232,0.75)',
               }}>{n}</a>
          ))}
        </div>

        {/* Короткі списки: що працює і що кидають */}
        {visible.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 14, marginBottom: 26 }}>
            <div style={{ padding: 16, borderRadius: 12, background: '#14253b', border: '1px solid rgba(34,197,94,0.3)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', marginBottom: 10 }}>Дочитують найкраще</div>
              {best.map(r => (
                <div key={r.slug} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>{pct(r.finished, r.readers)}%</span>{' '}
                  {r.title ?? r.slug}
                  <span style={{ color: 'rgba(245,240,232,0.45)' }}> · {r.readers} чит.</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: '#14253b', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 10 }}>Кидають найчастіше</div>
              {worst.length === 0 && (
                <div style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.5)' }}>
                  Немає творів із дочитуваністю нижче 50%.
                </div>
              )}
              {worst.map(r => (
                <div key={r.slug} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{pct(r.finished, r.readers)}%</span>{' '}
                  {r.title ?? r.slug}
                  <span style={{ color: 'rgba(245,240,232,0.45)' }}> · кидають близько {r.median_percent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Таблиця */}
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(245,240,232,0.12)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#14253b', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Твір</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Автор</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Читачів</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Дочитали</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Частка</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Медіана</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(r => {
                const share = pct(r.finished, r.readers)
                return (
                  <tr key={r.slug} style={{ borderTop: '1px solid rgba(245,240,232,0.08)' }}>
                    <td style={{ padding: '9px 12px' }}>
                      {r.path
                        ? <a href={r.path} target="_blank" rel="noopener" style={{ color: '#f5f0e8', textDecoration: 'none', borderBottom: '1px dotted rgba(245,240,232,0.3)' }}>{r.title ?? r.slug}</a>
                        : (r.title ?? r.slug)}
                      {r.type && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 12, padding: '1px 7px' }}>
                          {TYPE_LABEL[r.type] ?? r.type}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '9px 12px', color: 'rgba(245,240,232,0.6)' }}>{r.author_name ?? '—'}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>{r.readers}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>{r.finished}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: shareColor(share) }}>{share}%</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: 'rgba(245,240,232,0.6)' }}>{r.median_percent}%</td>
                  </tr>
                )
              })}
              {visible.length === 0 && !error && (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'rgba(245,240,232,0.5)' }}>
                    Немає творів, які прочитали щонайменше {minReaders} осіб. Спробуйте знизити поріг.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(245,240,232,0.45)', marginTop: 18, maxWidth: 720 }}>
          Медіана показує, на якому відсотку стоїть середній читач. Низька медіана при великій
          кількості читачів означає, що твір кидають, і приблизно вказує де. Цифри мають сенс
          від десятка читачів на твір — нижче це випадковість, а не закономірність.
          <br /><br />
          Ці цифри вищі за «глибину читання» на сторінці Аналітики, і так і має бути: там
          прочитання зараховується за повним правилом договору — 70% обсягу <em>і</em> мінімум
          15 секунд на кожну тисячу знаків. Тут часу немає, лише глибина, тож сюди потрапляє
          й той, хто прогорнув швидко. Для добору творів це годиться, для нарахування
          винагороди — ні: гроші рахуються тільки за подіями прочитання.
        </p>
      </div>
    </main>
  )
}
