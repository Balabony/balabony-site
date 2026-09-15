import type { Metadata } from 'next'
import QrBlock from '@/app/components/QrBlock'
import PrintButton from '@/app/components/PrintButton'
import { CONTESTS, isOpen, type Contest, prizeLine } from '@/lib/contests'

/**
 * Зведена афіша: усі чотири конкурси на одному аркуші A4, один QR.
 *
 * НАВІЩО ОКРЕМО ВІД АФІШ ПО КОНКУРСАХ. Бібліотека чи спілка не вішатиме
 * чотири аркуші поруч — повісить один. Людині біля дошки треба за десять
 * секунд зрозуміти, що конкурсів кілька і який її, а деталі вона прочитає
 * з телефона. Тому тут по три рядки на конкурс і жодних умов: усе, що
 * довше, читається вже на сайті.
 *
 * ОДИН КОД, А НЕ ЧОТИРИ. Чотири коди на аркуші людина не сканує — вона
 * сканує перший або жоден. Код веде на /konkursy, де стоїть вибір із
 * чотирьох плиток; це рівно та сторінка, з якої й починається вибір.
 *
 * ?code=xx — коротке посилання з /admin/qr замість прямого. Тоді кожне
 * сканування пишеться в qr_hits, і видно, чия дошка спрацювала.
 *
 * Від індексації закрито: це службовий аркуш, а не сторінка конкурсів.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Афіша конкурсів — Balabony',
  robots: { index: false, follow: false },
}

const MONTHS = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
]

function humanDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  return `${d} ${MONTHS[m - 1]}`
}

/** Один рядок про строк: або прийом, або що вже далі. */
function deadline(c: Contest): string {
  const today = new Date().toISOString().slice(0, 10)
  if (today < c.opensAt) return `прийом з ${humanDate(c.opensAt)}`
  if (isOpen(c))         return `до ${humanDate(c.closesAt)} ${c.closesAt.slice(0, 4)}`
  return 'прийом закрито'
}

const PRINT_CSS = `
@page { size: A4 portrait; margin: 12mm; }

.a-sheet {
  width: 210mm;
  min-height: 297mm;
  padding: 16mm 16mm 14mm;
  box-sizing: border-box;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #ddd;
}

@media (max-width: 800px) {
  .a-wrap { overflow-x: auto; height: 150mm; }
  .a-sheet { transform: scale(.46); transform-origin: top left; margin: 0; }
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

export default async function AllContestsAfisha(
  { searchParams }: { searchParams: Promise<{ code?: string }> },
) {
  const { code } = await searchParams
  const site = 'https://balabony.com'
  const short = (code ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '')

  const target = short
    ? `${site}/g/${short}`
    : `${site}/konkursy?utm_source=afisha&utm_medium=qr&utm_campaign=vsi-konkursy`
  const human = short ? `balabony.com/g/${short}` : 'balabony.com/konkursy'

  return (
    <main style={{ background: '#fff', color: '#111', fontFamily: "'Montserrat', Arial, sans-serif", minHeight: '100vh', padding: '24px 16px' }}>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="a-no-print" style={{ maxWidth: 720, margin: '0 auto 18px', fontSize: 13.5, color: '#555', lineHeight: 1.6 }}>
        <div style={{ marginBottom: 10 }}><PrintButton /></div>
        Аркуш A4, книжкова орієнтація. Кольори не потрібні — друкується чорно-білим.
        {!short && ' Щоб рахувати сканування окремо для кожного місця, створіть код у /admin/qr і додайте ?code=<код>.'}
      </div>

      <div className="a-wrap">
      <div className="a-sheet">

        <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase' }}>
          Balabony · літературні конкурси
        </div>

        <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 38, lineHeight: 1.1, margin: '12px 0 0', fontWeight: 700 }}>
          Чотири конкурси. Пишіть українською.
        </h1>

        <div style={{ height: 3, width: 90, background: '#111', margin: '13px 0 14px' }} />

        <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: '0 0 18px' }}>
          Не треба бути письменником. Треба історія, від якої важко відірватися.
          Участь безкоштовна, від автора — одна робота на конкурс.
        </p>

        {CONTESTS.map(c => (
          <div key={c.id} style={{ borderTop: '1px solid #ddd', padding: '13px 0 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 20, fontWeight: 700 }}>
                {c.name}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>
                {deadline(c)}
              </div>
            </div>
            <div style={{ fontSize: 14.5, lineHeight: 1.6, margin: '4px 0 0' }}>{c.tagline}</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, margin: '3px 0 0' }}>{prizeLine(c)}</div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #ddd', paddingTop: 20, marginTop: 6 }}>
          <QrBlock url={target} size={190} />
          <div style={{ flex: '1 1 230px', minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Наведіть камеру телефона</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.65, marginBottom: 10 }}>
              Умови всіх чотирьох конкурсів і форма подачі.
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, wordBreak: 'break-all' }}>{human}</div>
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: '#555', marginTop: 18, borderTop: '1px solid #ddd', paddingTop: 11 }}>
          Balabony — українська платформа історій. balabony.com
        </div>

      </div>
      </div>
    </main>
  )
}
