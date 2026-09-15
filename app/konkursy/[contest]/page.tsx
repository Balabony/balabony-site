import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import ContestReads from '@/app/components/ContestReads'
import { CONTESTS, findContest, isOpen, type Contest, prizeLine } from '@/lib/contests'

/**
 * Окрема сторінка одного конкурсу — під QR-код у газеті.
 *
 * НАВІЩО ОКРЕМО, КОЛИ Є /konkursy
 * Спільна сторінка важить понад сто кілобайт розмітки й починається з
 * вибору між чотирма конкурсами. Людина, що навела телефон на QR під
 * оголошенням про «П'ять вечорів», має одразу побачити цей конкурс, а не
 * вибір. Друкована адреса теж має бути короткою: balabony.com/konkursy/
 * pyat-vechoriv читається з паперу, посилання з якорем — ні.
 *
 * ЩО ТУТ Є І ЧОГО НЕМАЄ
 * Тільки те, заради чого людина прийшла: що це за конкурс, скільки платимо,
 * до якої дати надсилати, куди тиснути. Повні умови — окремим посиланням на
 * /konkursy, щоб не тримати два тексти правил, які колись розійдуться.
 *
 * ДАТИ Й СУМИ беруться з lib/contests — з того самого довідника, за яким
 * сторінка подачі вирішує, чи відкритий прийом. Продубльовані в текстах
 * правил суми — відома слабина, вона описана в самому довіднику.
 *
 * Статична, перезбирається щогодини: стан прийому рахується з дат, і без
 * revalidate сторінка застигла б на дні збірки.
 */

export const revalidate = 3600

export function generateStaticParams() {
  return CONTESTS.map(c => ({ contest: c.id }))
}

const FONT  = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', Georgia, serif"
const NAVY_DEEP = '#0a1628'
const NAVY  = '#0f1e3a'
const GOLD  = '#ef9f27'
const GOLD_SOFT = '#FAC775'
const CREAM = '#f5f0e8'
const SOFT  = '#dbe4f0'
const MUTED = '#9fb0c6'

const MONTHS = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
]

/** 2026-10-20 → 20 жовтня 2026. Порожню дату не вигадуємо. */
function humanDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** Якір потрібного блоку на спільній сторінці умов. */
function anchorFor(id: string): string {
  return id === 'ce-dovha-istoriya' ? 'dovha-istoriya' : id
}

export async function generateMetadata(
  { params }: { params: Promise<{ contest: string }> },
): Promise<Metadata> {
  const { contest } = await params
  const c = findContest(contest)
  if (!c) return { title: 'Конкурс — Balabony' }

  const title = `${c.name} — конкурс Balabony`
  const description = `${c.tagline} ${prizeLine(c)}. Заявки до ${humanDate(c.closesAt)}.`

  return {
    title,
    description,
    alternates: { canonical: `https://balabony.com/konkursy/${c.id}` },
    openGraph: { title, description, url: `https://balabony.com/konkursy/${c.id}`, type: 'article' },
  }
}

/** Стан прийому людською мовою — те саме правило, що на спільній сторінці. */
function acceptance(c: Contest): string {
  const today = new Date().toISOString().slice(0, 10)
  if (today < c.opensAt) return `Прийом відкриється ${humanDate(c.opensAt)}`
  if (isOpen(c))         return `Заявки приймаємо до ${humanDate(c.closesAt)}`
  if (c.stages.publishFrom && today < c.stages.publishFrom) {
    return `Прийом закрито · перша серія ${humanDate(c.stages.publishFrom)}`
  }
  if (c.stages.publishUntil && today <= c.stages.publishUntil) return 'Прийом закрито · серії виходять'
  if (c.stages.resultsAt && today < c.stages.resultsAt) {
    return `Прийом закрито · підсумки ${humanDate(c.stages.resultsAt)}`
  }
  return 'Конкурс завершено'
}

export default async function ContestPage(
  { params }: { params: Promise<{ contest: string }> },
) {
  const { contest } = await params
  const c = findContest(contest)
  if (!c) notFound()

  const open = isOpen(c)

  const facts: { k: string; v: string }[] = [
    {
      k: 'Обсяг',
      v: c.episodes > 1
        ? `${c.episodes} серій по ${c.minWords}–${c.maxWords} слів`
        : `одна історія ${c.minWords}–${c.maxWords} слів`,
    },
    ...(c.episodes > 1
      ? [{ k: 'Як надсилати', v: c.atOnce ? 'усі серії за один раз' : 'серії можна досилати по черзі' }]
      : []),
    { k: 'Прийом', v: `${humanDate(c.opensAt)} — ${humanDate(c.closesAt)}` },
    ...(c.stages.publishFrom ? [{ k: 'Перша серія', v: humanDate(c.stages.publishFrom) }] : []),
    ...(c.stages.resultsAt ? [{ k: 'Підсумки', v: humanDate(c.stages.resultsAt) }] : []),
  ]

  return (
    <main style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT, minHeight: '100vh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '30px 20px calc(80px + env(safe-area-inset-bottom, 0px))' }}>

        <Breadcrumbs items={[{ label: 'Конкурси', href: '/konkursy' }, { label: c.name }]} />

        <div style={{
          marginTop: 20, padding: '30px 24px 26px', borderRadius: 18,
          background: NAVY, border: `1px solid rgba(239,159,39,0.28)`,
        }}>
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 2,
            textTransform: 'uppercase', color: GOLD,
            background: 'rgba(239,159,39,0.14)', border: '1px solid rgba(239,159,39,0.5)',
            borderRadius: 6, padding: '6px 12px',
          }}>
            Конкурс Балабонів
          </span>

          <h1 style={{
            fontFamily: SERIF, fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700,
            lineHeight: 1.12, margin: '16px 0 0', color: CREAM,
          }}>
            {c.name}
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.65, color: SOFT, margin: '14px 0 0' }}>
            {c.tagline}
          </p>

          <div style={{
            marginTop: 20, padding: '14px 16px', borderRadius: 10,
            background: NAVY_DEEP, borderLeft: `3px solid ${GOLD}`,
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: GOLD_SOFT }}>{prizeLine(c)}</div>
            <div style={{ fontSize: 14, color: MUTED, marginTop: 5 }}>{acceptance(c)}</div>
          </div>

          <div style={{ marginTop: 22 }}>
            {facts.map((f, i) => (
              <div key={f.k} style={{
                display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
                padding: '11px 14px', borderRadius: 9,
                background: i % 2 === 0 ? NAVY_DEEP : 'transparent',
              }}>
                <span style={{ fontSize: 15, color: SOFT }}>{f.k}</span>
                <span style={{ fontSize: 15, color: GOLD_SOFT, fontWeight: 700 }}>{f.v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            {open && (
              <Link href="/konkursy/podaty" style={{
                fontSize: 15, fontWeight: 700, color: '#14213a', background: GOLD,
                border: `1px solid ${GOLD}`, borderRadius: 10,
                padding: '12px 22px', textDecoration: 'none',
              }}>
                Подати твір
              </Link>
            )}
            <Link href={`/konkursy#${anchorFor(c.id)}`} style={{
              fontSize: 15, fontWeight: 700, color: GOLD_SOFT, background: 'transparent',
              border: '1px solid rgba(239,159,39,0.4)', borderRadius: 10,
              padding: '12px 22px', textDecoration: 'none',
            }}>
              Повні умови
            </Link>
          </div>

          <p style={{ fontSize: 13.5, lineHeight: 1.65, color: MUTED, margin: '18px 0 0' }}>
            Половину підсумкової оцінки дають зараховані дочитування, другу половину —
            редакція. Дочитування зараховується лише від читача, який увійшов у свій
            акаунт: без входу неможливо відрізнити одну людину від тієї самої людини
            в трьох браузерах. Поріг допуску до призових місць — {c.threshold} дочитувань.
          </p>

          <ContestReads contest={c.id} />
        </div>

        <p style={{ fontSize: 13.5, color: MUTED, margin: '22px 0 0', textAlign: 'center' }}>
          <Link href="/konkursy" style={{ color: GOLD_SOFT }}>Усі чотири конкурси</Link>
        </p>
      </div>
    </main>
  )
}
