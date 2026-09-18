// FILE: app/admin/dochytuvannia/page.tsx
//
// Дочитуваність творів — з даних, які вже пишуться.
//
// ДЖЕРЕЛО ЗМІНЕНО 16.09.2026 на article_reads. Історія і причина — у коментарі
// біля самого запиту нижче; коротко: reading_progress знає лише залогінених,
// і сторінка бачила 112 читачів там, де їх 627.
//
// Що вважаємо:
//   читачі   — скільки разів твір відкривали, з гостями включно (один рядок
//              на пару «читач + твір» за добу);
//   дочитали — completed: 70% обсягу І мінімум 15 секунд на кожні 1000 знаків.
//              Це повне правило п. 1.5 договору, за яким нараховується
//              винагорода. Те саме число автор бачить у кабінеті.
//   довжина і «ззовні» — додано 18.09.2026 замість медіани глибини
//              (див. коментар у запиті).
//
// ЩО НЕ ЗБІГАЄТЬСЯ І ЧОМУ. У story_events подій 'read' 245, тут дочитувань
// 141. Причина ще не зʼясована станом на 16.09.2026 — не спирайся на числа
// /admin/analytics як на договірні, поки це не розібрано.
// У виплату йде ще менше (51): isPayable() виключає промо-покази і твори
// з is_free.
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
  chars: number | null
  known: number
  outside: number
}

/** Рядок звіту «Хто читає»: група творів × частина доби. */
type AudRow = { grp: string; part: string; views: number; sessions: number }
type AudReadRow = { grp: string; opened: number; finished: number }

/**
 * Групи для питання «чи є на сайті батьки». Дитяче — жанри «Казка» і
 * «Дитяче оповідання» (lib/genres.ts, два різні жанри з 09.09.2026) разом зі
 * старими синонімами. Серіали окремо: «Балабони» й «Тиша» — доросла проза,
 * але читаються інакше, ніж окремі історії.
 */
const AUD_GROUPS = ['Дитяче', 'Дорослі історії', 'Серіали'] as const
const DAY_PARTS: { key: string; label: string }[] = [
  { key: 'ранок',  label: 'ранок 6–12' },
  { key: 'день',   label: 'день 12–18' },
  { key: 'вечір',  label: 'вечір 18–22' },
  { key: 'ніч',    label: 'ніч 22–6' },
]

const GROUP_SQL = `case
  when c.type in ('balabony', 'episode', 'tysha') then 'Серіали'
  when lower(trim(coalesce(c.genre, ''))) in ('казка', 'казки', 'дитяче оповідання', 'для дітей', 'дитячі', 'дитяче')
    then 'Дитяче'
  else 'Дорослі історії'
end`

const TYPE_LABEL: Record<string, string> = {
  story: 'історія',
  balabony: 'Балабони',
  tysha: 'Тиша',
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

/** Дрібний пояснювальний рядок під заголовком стовпця. */
const hint: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 400,
  lineHeight: 1.35,
  color: 'rgba(245,240,232,0.45)',
  marginTop: 3,
}

/** Довжина в тисячах знаків: 12 400 → «12,4 тис.» */
function kChars(n: number): string {
  return `${(n / 1000).toLocaleString('uk-UA', { maximumFractionDigits: 1 })} тис.`
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
      // ДЖЕРЕЛО ЗМІНЕНО 16.09.2026: було reading_progress, стало article_reads.
      //
      // reading_progress — це закладка «продовжити читання»: один рядок на
      // пару «читач + твір», прив'язаний до user_id залогіненого. Гостей там
      // немає. Вимір 16.09.2026: вся вибірка сторінки — 112 читачів, тоді як
      // article_reads знає про 627 відкриттів. Тобто сторінка бачила приблизно
      // шосту частину аудиторії й на ній вирішувала, що озвучувати.
      //
      // article_reads пише і гостей: resolveReaderId() видає ідентифікатор
      // за кукою. Колонка completed ставиться за ПОВНИМ правилом п. 1.5
      // договору — 70% обсягу і час, — тож «дочитали» тут збігається з тим,
      // що бачить автор у кабінеті, і з тим, за що нараховується винагорода.
      // Раніше числа розходилися: 80 тут проти 141 у кабінеті.
      //
      `select
         ar.article_slug                                            as slug,
         max(ar.article_title)                                      as title,
         -- Шлях беремо реальний, з reading_progress: його надсилає сторінка,
         -- і для серій він виглядає як /balabony/… чи /tysha/…, а не /stories/.
         -- Зібраний вручну шлях ламав би посилання на серії; він лишається
         -- лише як запасний, коли закладки на твір ще ніхто не лишив.
         coalesce(
           (select rp.path from reading_progress rp
             where rp.slug = ar.article_slug and rp.path is not null
             limit 1),
           '/stories/' || ar.article_slug
         )                                                          as path,
         max(c.type)                                                as type,
         max(c.author_name)                                         as author_name,
         count(*)::int                                              as readers,
         count(*) filter (where ar.completed)::int                  as finished,
         -- 18.09.2026 ПРИБРАНО «медіану глибини» з reading_progress. Вона
         -- міряла ОСТАННЄ місце на ВСІЙ сторінці (з блоками під текстом),
         -- а не пройдену частку тексту, і дала хибну тривогу: «100% глибини,
         -- 0% дочитувань» виглядало як збій обліку. Перевірка лічильником
         -- (?readcheck=1 на /episodes/s1e02) показала: облік справний,
         -- просто прогортали швидше за 15 с/1000 знаків.
         -- 18.09.2026. Дві колонки, щоб відділити сюжет від інших причин
         -- дочитування. Довжина: поріг — 70% обсягу, коротке дочитати легше.
         max(length(coalesce(nullif(trim(c.corrected_text), ''), c.text)))::int as chars,
         -- «Прийшли ззовні просто на твір»: перша сторінка першого візиту
         -- (user_acquisition, перший дотик браузера) — саме цей твір. Так
         -- приходять за посиланням, яким поділився автор, — його коло.
         -- Рахуємо по різних людях і лише серед тих, чиє джерело відоме.
         count(distinct ar.user_id) filter (where ua.user_id is not null)::int as known,
         count(distinct ar.user_id) filter (
           where position(ar.article_slug in coalesce(ua.landing_path, '')) > 0
         )::int                                                     as outside
       from article_reads ar
       left join content c on c.id = ar.content_id
       left join user_acquisition ua on ua.user_id::text = ar.user_id::text
       -- Автор, який читає власний твір, у статистику не йде: з 11.09.2026
       -- йому не зараховують і подію прочитання.
       where (c.author_id is null or ar.user_id::text <> c.author_id::text)
       group by ar.article_slug
       having count(*) >= $1
       order by count(*) desc
       limit 500`,
      [minReaders],
    )
    rows = res.rows as Row[]
  } catch (e) {
    error = e instanceof Error ? e.message : 'невідома помилка'
  }

  // «Хто читає» (18.09.2026). Питання: чи є на сайті батьки, тобто
  // комерційне ядро. Опитування не заповнюють, тому дивимось на поведінку:
  // скільки читають дитячого і О КОТРІЙ. Казку на ніч читають увечері.
  // Години — з page_views (там є час), дочитування — з article_reads
  // (там лише дата). Час київський.
  let aud: AudRow[] = []
  let audReads: AudReadRow[] = []
  try {
    const [pv, ar] = await Promise.all([
      dbQuery(
        `with pv as (
           select (p."timestamp"::timestamptz at time zone 'Europe/Kyiv') as t,
                  split_part(p.url, '/', 3) as slug,
                  p.session_id
             from page_views p
            where (p.url like '/stories/%' or p.url like '/episodes/%' or p.url like '/tysha/%')
              and p."timestamp" > now() - interval '30 days'
         )
         select ${GROUP_SQL} as grp,
                case
                  when extract(hour from pv.t) >= 6  and extract(hour from pv.t) < 12 then 'ранок'
                  when extract(hour from pv.t) >= 12 and extract(hour from pv.t) < 18 then 'день'
                  when extract(hour from pv.t) >= 18 and extract(hour from pv.t) < 22 then 'вечір'
                  else 'ніч'
                end as part,
                count(*)::int                   as views,
                count(distinct pv.session_id)::int as sessions
           from pv
           join content c on c.slug = pv.slug
          group by 1, 2`,
      ),
      dbQuery(
        `select ${GROUP_SQL} as grp,
                count(*)::int                             as opened,
                count(*) filter (where ar.completed)::int as finished
           from article_reads ar
           join content c on c.id = ar.content_id
          where ar.read_date > (now() - interval '30 days')::date
            and (c.author_id is null or ar.user_id::text <> c.author_id::text)
          group by 1`,
      ),
    ])
    aud = pv.rows as AudRow[]
    audReads = ar.rows as AudReadRow[]
  } catch {
    // довідкова частина: основна таблиця від неї не залежить
  }
  const audCell = (grp: string, part: string) =>
    aud.find(r => r.grp === grp && r.part === part)?.views ?? 0
  const audGroupTotal = (grp: string) =>
    aud.filter(r => r.grp === grp).reduce((s, r) => s + r.views, 0)
  const audAll = aud.reduce((s, r) => s + r.views, 0)

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
          Скільки читачів дійшли до кінця. Рахується з article_reads — тієї самої таблиці,
          що й винагорода авторам: «дочитали» означає 70% обсягу і час за п. 1.5 договору,
          тож ці числа збігаються з кабінетом автора. «Читачі» — усі, хто відкривав твір,
          зокрема гості без акаунта.
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

        {/* Хто читає: дитяче / дорослі історії / серіали, за частиною доби */}
        <section style={{ marginBottom: 26, padding: 16, borderRadius: 12, background: '#14253b', border: '1px solid rgba(239,159,39,0.25)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: GOLD, marginBottom: 2 }}>Хто читає — за 30 днів</div>
          <div style={{ ...hint, fontSize: 12, marginBottom: 12, maxWidth: 760 }}>
            Замість опитування — поведінка. Якщо на сайті є батьки, дитяче читають увечері
            (казка на ніч). Перегляди сторінок творів за київським часом; дочитування — за
            правилом договору. Ваші власні перегляди теж тут: поки трафік малий, дивіться
            на пропорції, а не на одиниці.
          </div>
          {audAll === 0 && audReads.length === 0 ? (
            <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.5)' }}>Даних за 30 днів немає або запит не виконався.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
                <thead>
                  <tr style={{ textAlign: 'right', color: 'rgba(245,240,232,0.7)' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Група</th>
                    <th style={{ padding: '6px 8px' }}>Частка переглядів</th>
                    {DAY_PARTS.map(d => <th key={d.key} style={{ padding: '6px 8px' }}>{d.label}</th>)}
                    <th style={{ padding: '6px 8px' }}>Відкрили</th>
                    <th style={{ padding: '6px 8px' }}>Дочитали</th>
                  </tr>
                </thead>
                <tbody>
                  {AUD_GROUPS.map(g => {
                    const total = audGroupTotal(g)
                    const rd = audReads.find(r => r.grp === g)
                    return (
                      <tr key={g} style={{ borderTop: '1px solid rgba(245,240,232,0.08)', textAlign: 'right' }}>
                        <td style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700 }}>{g}</td>
                        <td style={{ padding: '7px 8px', color: GOLD, fontWeight: 700 }}>
                          {pct(total, audAll)}%
                          <div style={{ fontSize: 10.5, color: 'rgba(245,240,232,0.4)', fontWeight: 400 }}>{total} перегл.</div>
                        </td>
                        {DAY_PARTS.map(d => (
                          <td key={d.key} style={{ padding: '7px 8px' }}>
                            {total > 0 ? `${pct(audCell(g, d.key), total)}%` : '—'}
                          </td>
                        ))}
                        <td style={{ padding: '7px 8px' }}>{rd?.opened ?? 0}</td>
                        <td style={{ padding: '7px 8px' }}>
                          {rd?.finished ?? 0}
                          {rd && rd.opened > 0 && (
                            <span style={{ color: shareColor(pct(rd.finished, rd.opened)), marginLeft: 6 }}>
                              {pct(rd.finished, rd.opened)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ ...hint, fontSize: 11.5, marginTop: 10, maxWidth: 760 }}>
            Як читати: частки за часом доби — у межах своєї групи. Сигнал «батьки є» — у
            «Дитячого» помітно більша частка вечора, ніж у «Дорослих історій», і дитяче
            дочитують. Якщо «Дитяче» — кілька відсотків переглядів і без вечірнього піку,
            батьків на сайті поки немає.
          </div>
        </section>

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
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', marginBottom: 2 }}>Дочитують найкраще</div>
              <div style={{ ...hint, marginBottom: 10 }}>
                Відсоток — частка тих, хто дочитав, від усіх, хто відкрив.
                Це кандидати на озвучення й на вітрину.
              </div>
              {best.map(r => (
                <div key={r.slug} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>{pct(r.finished, r.readers)}%</span>{' '}
                  {r.title ?? r.slug}
                  <span style={{ color: 'rgba(245,240,232,0.45)' }}>
                    {' '}· {r.readers} чит.{r.chars ? ` · ${kChars(r.chars)}` : ''}
                    {r.known > 0 ? ` · ззовні ${pct(r.outside, r.known)}%` : ''}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: '#14253b', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 2 }}>Кидають найчастіше</div>
              <div style={{ ...hint, marginBottom: 10 }}>
                Частка дочитувань нижче 50%. Поруч — довжина і скільки читачів
                прийшли ззовні: довгий текст і «чужі» читачі дочитують рідше.
              </div>
              {worst.length === 0 && (
                <div style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.5)' }}>
                  Немає творів із дочитуваністю нижче 50%.
                </div>
              )}
              {worst.map(r => (
                <div key={r.slug} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{pct(r.finished, r.readers)}%</span>{' '}
                  {r.title ?? r.slug}
                  <span style={{ color: 'rgba(245,240,232,0.45)' }}>
                    {' '}· {r.readers} чит.{r.chars ? ` · ${kChars(r.chars)}` : ''}
                    {r.known > 0 ? ` · ззовні ${pct(r.outside, r.known)}%` : ''}
                  </span>
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
                {/* Пояснення під кожним заголовком: чотири числа в одному рядку
                    легко переплутати, а вони рахуються з різних джерел і за
                    різними правилами. Текст короткий — довгі підказки в
                    заголовку таблиці не читають. */}
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Твір</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Автор</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>
                  Читачів
                  <div style={hint}>відкрили твір,<br />з гостями</div>
                </th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>
                  Дочитали
                  <div style={hint}>70% і 15 с/1000 знаків<br />— за це платимо</div>
                </th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>
                  Частка
                  <div style={hint}>дочитали ÷ читачів</div>
                </th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>
                  Довжина
                  <div style={hint}>тис. знаків;<br />коротке дочитати легше</div>
                </th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>
                  Ззовні
                  <div style={hint}>прийшли просто на твір<br />(коло автора) · з відомих</div>
                </th>
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
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: 'rgba(245,240,232,0.6)' }}>{r.chars ? kChars(r.chars) : '—'}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: 'rgba(245,240,232,0.75)' }}>
                      {r.known > 0 ? `${pct(r.outside, r.known)}%` : '—'}
                      {r.known > 0 && <div style={{ fontSize: 10.5, color: 'rgba(245,240,232,0.4)' }}>{r.outside} з {r.known}</div>}
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && !error && (
                <tr>
                  <td colSpan={7} style={{ padding: 20, textAlign: 'center', color: 'rgba(245,240,232,0.5)' }}>
                    Немає творів, які прочитали щонайменше {minReaders} осіб. Спробуйте знизити поріг.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(245,240,232,0.45)', marginTop: 18, maxWidth: 720 }}>
          Цифри мають сенс від десятка читачів на твір — нижче це випадковість, а не закономірність.
          «Не дочитали» часто означає «прогорнули швидше, ніж 15 секунд на 1000 знаків»: так
          договір і задуманий. Перевірити облік на будь-якому творі можна, дописавши до адреси
          <code> ?readcheck=1</code> — унизу з'явиться лічильник.
          <br /><br />
          <strong>Як шукати причину, чому твір дочитують.</strong> Спершу відкиньте дві сторонні:
          «Довжина» (коротке дочитати легше — поріг 70% обсягу) і «Ззовні» (висока частка —
          це читачі, що прийшли за посиланням автора, тобто його знайомі). Лише коли твори
          схожої довжини з «чужими» читачами дочитують по-різному — різниця справді в тексті.
          «Ззовні» рахується серед тих, чиє джерело відоме; «3 з 4» — ще не висновок.
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
