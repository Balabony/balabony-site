import type { Metadata } from 'next'
import Breadcrumbs from '@/app/components/Breadcrumbs'

/**
 * Перелік друкованих видань — виконання п. 1.11 авторського договору:
 * «Перелік чинних і колишніх Друкованих видань публікується на вебсайті Платформи».
 *
 * Щоб додати видання — допишіть рядок у масив VYDANNYA нижче.
 * Поля: name (назва в лапках без лапок), kind ('газета' | 'журнал'),
 * founded (рік заснування або порожньо), status ('chynne' | 'kolyshnie'),
 * note (один короткий рядок, необовʼязково).
 */

export const metadata: Metadata = {
  title: 'Друковані видання · Балабони',
  description:
    'Перелік чинних і колишніх друкованих видань, з якими співпрацює платформа Балабони: газети «Життя», «Життя. Історії», «Життєві історії», «Найкращі жіночі історії».',
}

type Vydannya = {
  name: string
  kind: 'газета' | 'журнал'
  founded?: string
  status: 'chynne' | 'kolyshnie'
  note?: string
}

const VYDANNYA: Vydannya[] = [
  { name: 'Життя', kind: 'газета', founded: '2003', status: 'chynne',
    note: 'Виходить щотижня, наклад 20 000 примірників' },
  { name: 'Життя. Історії', kind: 'газета', status: 'chynne' },
  { name: 'Життєві історії', kind: 'газета', status: 'chynne' },
  { name: 'Найкращі жіночі історії', kind: 'газета', status: 'chynne' },
  { name: 'Коліжанка', kind: 'журнал', status: 'kolyshnie' },
  { name: 'Історії кохання', kind: 'журнал', status: 'kolyshnie' },
]

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.18)'

export default function VydannyaPage() {
  const chynni = VYDANNYA.filter((v) => v.status === 'chynne')
  const kolyshni = VYDANNYA.filter((v) => v.status === 'kolyshnie')

  const Card = ({ v }: { v: Vydannya }) => (
    <div style={{
      background: NAVY, border: `1px solid ${LINE}`, borderRadius: 14,
      padding: '20px 22px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 19, color: CREAM, fontWeight: 700 }}>«{v.name}»</h3>
        <span style={{ fontSize: 12.5, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>{v.kind}</span>
      </div>
      {(v.founded || v.note) && (
        <p style={{ margin: '8px 0 0', fontSize: 14.5, color: MUTED, lineHeight: 1.6 }}>
          {v.founded ? `Заснована ${v.founded} року` : ''}
          {v.founded && v.note ? ' · ' : ''}
          {v.note ?? ''}
        </p>
      )}
    </div>
  )

  return (
    <main style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT, minHeight: '60vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 20px 96px' }}>

        <Breadcrumbs items={[{ label: 'Друковані видання' }]} />

        <h1 style={{ color: GOLD, fontSize: 30, margin: '20px 0 10px', lineHeight: 1.25 }}>
          Друковані видання
        </h1>

        <p style={{ color: MUTED, fontSize: 15.5, lineHeight: 1.75, maxWidth: 640 }}>
          Історії, які виходять на Балабонах, друкуються також у паперових виданнях —
          для читачів без надійного інтернету, для сіл і містечок, куди газета приходить
          «Укрпоштою». Засновником зазначених видань є Хомин Богдан Іванович.
        </p>

        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, maxWidth: 640, marginTop: 14 }}>
          Цей перелік ведеться на виконання пункту 1.11 авторського договору: автор має
          бачити, у яких саме виданнях може вийти його твір.
        </p>

        <h2 style={{ color: CREAM, fontSize: 20, margin: '34px 0 16px' }}>Чинні видання</h2>
        {chynni.map((v) => <Card key={v.name} v={v} />)}

        {kolyshni.length > 0 && (
          <>
            <h2 style={{ color: CREAM, fontSize: 20, margin: '34px 0 16px' }}>Видання, які вже не виходять</h2>
            {kolyshni.map((v) => <Card key={v.name} v={v} />)}
          </>
        )}

        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, marginTop: 30 }}>
          Публікація твору в цих виданнях не вважається публікацією в інших виданнях
          у розумінні авторського договору — умови викладені в{' '}
          <a href="/legal/author-contract" style={{ color: GOLD }}>умовах договору з автором</a>.
        </p>
      </div>
    </main>
  )
}
