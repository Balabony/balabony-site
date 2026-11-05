// 06.11.2026 (Богдан): аналітика — джерела, час, повернення, команда, серійне читання,
// воронка, де кидають читати, пошук, автори, газета, аудіо, години, що працює в тексті,
// і щотижневі висновки ШІ (lib/analytics-insights.ts).
import { getReport, type Row } from '@/lib/analytics-report'
import { latestInsight } from '@/lib/analytics-insights'

export const metadata = { title: 'Аналітика: джерела — адмінка', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#ef9f27'
const th: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #ddd', fontSize: 12.5, color: '#555' }
const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #eee', fontSize: 13.5, verticalAlign: 'top' }

const L: Record<string, string> = {
  dzherelo: 'Джерело', vizytiv: 'Візитів', storinka: 'Сторінка', perehliadiv: 'Переглядів', mediana_sek: 'Медіана, с',
  serednie_sek: 'Середнє, с', vidviduvachiv: 'Відвідувачів', povernulysia: 'Повернулися', vizytiv_na_liudynu: 'Візитів на людину',
  dniv_mizh_vizytamy: 'Днів між візитами', khto: 'Хто', vidviduvachi: 'Відвідувачі', vidkryly_tvir: 'Відкрили твір',
  dochytaly: 'Дочитали', reiestratsii: 'Реєстрації', pidpysky_klub_donaty: 'Підписки, клуб, донати', tvir: 'Твір',
  chytachiv: 'Читачів', do_25: 'Кинули до 25%', do_50: '25–50%', do_70: '50–70%', zapyt: 'Запит', raziv: 'Разів',
  rezultativ: 'Результатів', avtor: 'Автор', vizytiv_zzovni: 'Візитів ззовні', zvidky: 'Звідки', vypusk: 'Випуск / кампанія',
  zapuskiv_audio: 'Запусків аудіо', slukhachiv: 'Слухачів', vidkryttiv_tekstu: 'Відкриттів тексту', zapuskiv: 'Запусків',
  seriia: 'Серія', poperednia: 'Читали попередню',
  hodyna: 'Година', den: 'День (1 = пн)', hrupa: 'Група', nazva: 'Назва', zhanr: 'Жанр', sliv: 'Слів', zachyn: 'Зачин',
  dochytaly_pct: 'Дочитали, %', dovzhyna: 'Довжина', tvoriv: 'Творів', vidkryttiv: 'Відкриттів',
}

function T({ rows }: { rows: Row[] }) {
  if (!rows.length) return <p style={{ color: '#888', fontSize: 13.5 }}>Даних ще немає (нові показники збираються з 06.11.2026).</p>
  const keys = Object.keys(rows[0])
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', margin: '6px 0' }}>
        <thead><tr>{keys.map((k) => <th key={k} style={th}>{L[k] ?? k}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{keys.map((k) => <td key={k} style={td}>{r[k] ?? '—'}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
const H = ({ children }: { children: React.ReactNode }) => <h2 style={{ fontSize: 17, color: GOLD, margin: '26px 0 4px' }}>{children}</h2>
const N = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: 12.5, color: '#777', margin: '0 0 4px' }}>{children}</p>
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')

export default async function Page({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const days = Math.min(365, Math.max(1, Number((await searchParams).d) || 30))
  const [r, ins] = await Promise.all([getReport(days), latestInsight()])

  const ser = new Map<string, typeof r.serial>()
  for (const s of r.serial) { const l = ser.get(s.series) ?? []; l.push(s); ser.set(s.series, l) }
  const later = r.serial.filter((s) => s.ep > 1)
  const lr = later.reduce((a, s) => a + s.readers, 0), ls = later.reduce((a, s) => a + s.prev_first, 0)

  return (
    <main style={{ fontFamily: FONT, maxWidth: 1040, margin: '0 auto', padding: '24px 16px 60px' }}>
      <h1 style={{ fontSize: 23, margin: 0 }}>Аналітика: читачі, джерела, тексти</h1>
      <N>Період: {days} дн. · <a href="?d=7">7</a> · <a href="?d=30">30</a> · <a href="?d=90">90</a>. Команда (браузери, з яких заходили в адмінку чи кабінет редактора) з показників читачів виключена.</N>

      <H>Висновки й поради ШІ (щопонеділка)</H>
      {ins ? (
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 14.5, lineHeight: 1.6, background: '#fff8ee', border: '1px solid #f3d9a8', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Сформовано: {new Date(ins.created_at).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}</div>
          {ins.text}
        </div>
      ) : <N>Перші висновки — у понеділок о 08:30 або кнопкою нижче.</N>}
      <p><a href="/api/cron/analytics-insights?back=1" style={{ color: GOLD }}>Сформувати висновки зараз (≈1 хв)</a></p>

      <H>Воронка: від візиту до дії</H>
      <T rows={r.funnel ? [r.funnel] : []} />
      <H>Звідки приходять на «Календар 2027»</H>
      <N>«Прямий захід» — набрали адресу, закладка, застосунок. Газетні QR і короткі адреси balabony.com/g/… мають мітку gazeta.</N>
      <T rows={r.calendar} />
      <H>Джерела всіх візитів</H><T rows={r.sources} />
      <H>Газета: візити з коротких адрес</H><T rows={r.newspaper} />
      <H>Які автори приводять читачів ззовні</H>
      <N>Візит почався зі сторінки твору автора, людина прийшла з іншого сайту чи за міткою (зазвичай автор поділився посиланням).</N>
      <T rows={r.authors} />
      <H>Скільки часу на сторінках</H><N>Лише видимий час. Медіана — типовий відвідувач.</N><T rows={r.pageTime} />
      <H>Повторні відвідувачі</H><T rows={r.returning ? [r.returning] : []} />
      <H>Частка команди</H><T rows={r.team} />
      <H>Де кидають читати</H><N>Частка читачів, що закрили твір на певному відсотку тексту (твори з 10+ читачами).</N><T rows={r.dropoff} />
      <H>Що працює в тексті: найкраще й найгірше дочитувані</H><T rows={r.works} />
      <H>Дочитуваність за довжиною твору</H><T rows={r.byLength} />
      <H>Пошук: запити без результатів</H><N>Готові теми для нових творів і рубрик.</N><T rows={r.searchZero} />
      <H>Пошук: найчастіші запити</H><T rows={r.searchTop} />
      <H>Аудіо проти тексту</H><T rows={r.audio ? [r.audio] : []} /><T rows={r.audioTop} />
      <H>Коли читають — години (Київ)</H><T rows={r.hours} />
      <H>Коли читають — дні тижня</H><T rows={r.weekdays} />

      <H>Серійне читання</H>
      <N>Для серій 2+: скільки дочитали і скільки з них перед тим дочитали попередню. Решта — хаотично.</N>
      {later.length > 0 && <p style={{ fontSize: 15, margin: '4px 0 10px' }}>Загалом <b>{pct(ls, lr)}</b> читачів серій 2+ читають підряд ({ls} з {lr}).</p>}
      {[...ser.entries()].slice(0, 40).map(([name, eps]) => (
        <details key={name} style={{ margin: '3px 0' }}>
          <summary style={{ cursor: 'pointer', fontSize: 13.5 }}>{name} — серій: {eps.length}, читачів серії 1: {eps.find((e) => e.ep === 1)?.readers ?? 0}</summary>
          <T rows={eps.map((e) => ({ seriia: e.ep, dochytaly: e.readers, poperednia: e.ep > 1 ? `${e.prev_first} (${pct(e.prev_first, e.readers)})` : '—' }))} />
        </details>
      ))}
    </main>
  )
}
