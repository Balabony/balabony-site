import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QrBlock from '@/app/components/QrBlock'
import PrintButton from '@/app/components/PrintButton'
import { findContest, isOpen } from '@/lib/contests'

/**
 * Друкована афіша конкурсу — A4 для бібліотек, спілок і шкіл.
 *
 * НАВІЩО. Розсилка дає адресатові лист, а повісити на стіну йому нічого.
 * Це аркуш, який бібліотекар відкриває, тисне Ctrl+P і чіпляє біля входу.
 * Тому все свідомо чорним по білому: кольорові принтери в бібліотеках рідкі,
 * а темний фон з'їдає тонер і робить QR нечитним.
 *
 * ОБЛІК СКАНУВАНЬ. Без параметрів QR веде прямо на сторінку конкурсу з
 * UTM-мітками — видно канал, але не видно, чий саме аркуш спрацював.
 * З `?code=xx` (короткий код, створений у /admin/qr) QR веде через
 * balabony.com/g/xx, і тоді кожне сканування пишеться в qr_hits окремо.
 * Так можна дати різні коди різним бібліотекам і побачити, де дошка
 * оголошень працює, а де ні.
 *
 * Приклад: /konkursy/pyat-vechoriv/afisha?code=b7
 *
 * Сторінка не в карті сайту й закрита від індексації: це службовий аркуш,
 * а не друга сторінка конкурсу з тим самим текстом — дубль у видачі
 * зашкодив би самому конкурсові.
 */

export const dynamic = 'force-dynamic'

const MONTHS = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
]

function humanDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  return `${d} ${MONTHS[m - 1]} ${y}`
}

export const metadata: Metadata = {
  title: 'Афіша конкурсу — Balabony',
  robots: { index: false, follow: false },
}

const PRINT_CSS = `
@page { size: A4 portrait; margin: 12mm; }

/* Аркуш має ті самі розміри на екрані й на папері: 210x297 мм із полями
   14 мм усередині. Інакше «на екрані вмістилося» нічого не означає — і
   бібліотекар отримує другу сторінку з самим підвалом. */
.a-sheet {
  width: 210mm;
  min-height: 297mm;
  padding: 16mm 16mm 14mm;
  box-sizing: border-box;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #ddd;
}

/* На телефоні 210 мм не влазять — стискаємо аркуш цілком, а не переверстуємо:
   так видно саме те, що вийде з принтера. */
@media (max-width: 800px) {
  .a-wrap { overflow-x: auto; }
  .a-sheet { transform: scale(.46); transform-origin: top left; margin: 0; }
  .a-wrap { height: 150mm; }
}

@media print {
  /* Обгортка сторінки не належить аркушу. Через min-height: 100vh і власні
     відступи <main> висота друку перевищувала A4 на кілька міліметрів — і
     підпис їхав на другу сторінку. */
  html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
  main { padding: 0 !important; min-height: 0 !important; }
  .a-no-print { display: none !important; }
  /* Панель навігації платформи друкувалася разом з аркушем. */
  .bb-root { display: none !important; }
  .a-wrap { overflow: visible !important; height: auto !important; }
  .a-sheet {
    border: none !important;
    transform: none !important;
    width: auto; min-height: 0;
    margin: 0; padding: 0;
  }
  /* Заборона розриву лише для аркуша цілком: якщо повісити її ще й на всі
     вкладені блоки, браузер починає виносити хвіст на наступну сторінку. */
  .a-sheet { break-inside: avoid; page-break-inside: avoid; }
}
`

export default async function AfishaPage(
  { params, searchParams }: {
    params: Promise<{ contest: string }>
    searchParams: Promise<{ code?: string }>
  },
) {
  const { contest } = await params
  const { code } = await searchParams
  const c = findContest(contest)
  if (!c) notFound()

  const site = 'https://balabony.com'
  const short = (code ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '')

  // Коротке посилання рахує сканування; пряме — ні, зате працює завжди,
  // навіть якщо коду в базі забули створити.
  const target = short
    ? `${site}/g/${short}`
    : `${site}/konkursy/${c.id}?utm_source=afisha&utm_medium=qr&utm_campaign=${c.id}`

  const human = short ? `balabony.com/g/${short}` : `balabony.com/konkursy/${c.id}`
  const open = isOpen(c)

  return (
    <main style={{ background: '#fff', color: '#111', fontFamily: "'Montserrat', Arial, sans-serif", minHeight: '100vh', padding: '24px 16px' }}>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="a-no-print" style={{ maxWidth: 720, margin: '0 auto 18px', fontSize: 13.5, color: '#555', lineHeight: 1.6 }}>
        <div style={{ marginBottom: 10 }}><PrintButton /></div>
        Аркуш A4, книжкова орієнтація. Кольори не потрібні — друкується чорно-білим.
        {!short && ' Щоб рахувати сканування окремо для кожного місця, створіть короткий код у /admin/qr і додайте до адреси ?code=<код>.'}
      </div>

      <div className="a-wrap">
      <div className="a-sheet">
        <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#111' }}>
          Літературний конкурс · Balabony
        </div>

        <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 40, lineHeight: 1.1, margin: '14px 0 0', fontWeight: 700 }}>
          {c.name}
        </h1>

        <div style={{ height: 3, width: 90, background: '#111', margin: '14px 0 16px' }} />

        <p style={{ fontSize: 17, lineHeight: 1.6, margin: '0 0 18px' }}>{c.tagline}</p>

        <div style={{ fontSize: 21, fontWeight: 800, margin: '0 0 4px' }}>{c.prizes}</div>
        <div style={{ fontSize: 16, margin: '0 0 22px' }}>
          {open
            ? <>Роботи приймаємо до <strong>{humanDate(c.closesAt)}</strong></>
            : <>Прийом робіт закрито{c.stages.resultsAt ? <> · підсумки {humanDate(c.stages.resultsAt)}</> : null}</>}
        </div>

        <div style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #ddd', paddingTop: 22 }}>
          <QrBlock url={target} />
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              Наведіть камеру телефона
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.65, marginBottom: 10 }}>
              Умови й форма подачі — на сторінці конкурсу.
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, wordBreak: 'break-all' }}>{human}</div>
          </div>
        </div>

        <ul style={{ fontSize: 14.5, lineHeight: 1.8, margin: '22px 0 0', paddingLeft: 20 }}>
          <li>
            {c.episodes > 1
              ? `${c.episodes} серій по ${c.minWords}–${c.maxWords} слів`
              : `одна історія ${c.minWords}–${c.maxWords} слів`}
            {' '}— українською, твір власний і раніше ніде не публікований
          </li>
          <li>Участь безкоштовна, від автора — одна робота</li>
          <li>Половину оцінки дають читачі, половину — редакція</li>
        </ul>

        <div style={{ fontSize: 12.5, color: '#555', marginTop: 22, borderTop: '1px solid #ddd', paddingTop: 12 }}>
          Balabony — українська платформа історій. balabony.com
        </div>
      </div>
      </div>
    </main>
  )
}
