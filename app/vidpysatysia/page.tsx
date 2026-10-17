import type { Metadata } from 'next'
import { dbQuery } from '@/lib/db'

/**
 * /vidpysatysia?t=ТОКЕН — відписка від листів Балабонів і Клубу (17.10.2026).
 * Токен — subscribers.token. Відписка ставить unsubscribed_at; рядок не видаляємо,
 * щоб повторна підписка й облік лишалися чесними.
 */
export const metadata: Metadata = { title: 'Відписка від листів — Балабони', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function Vidpysatysia({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams
  let ok = false
  if (t && /^[0-9a-f-]{20,64}$/i.test(t)) {
    try {
      const r = await dbQuery(`update subscribers set unsubscribed_at = coalesce(unsubscribed_at, now()) where token = $1 returning email`, [t])
      ok = r.rows.length > 0
    } catch { ok = false }
  }
  return (
    <main style={{ background: '#0E1A2B', minHeight: '70vh', color: '#FFF8EE', fontFamily: "'Montserrat', Arial, sans-serif", padding: '60px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 400, fontSize: '2rem', color: '#FAC775' }}>
          {ok ? 'Ви відписалися' : 'Посилання не спрацювало'}
        </h1>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#B8C6D8' }}>
          {ok
            ? 'Листів від Балабонів більше не надсилатимемо. Якщо передумаєте — підписатися знову можна на головній чи на сторінці клубу.'
            : 'Можливо, посилання застаріло або скопійоване не повністю. Напишіть нам на nazar@balabony.com — відпишемо вручну.'}
        </p>
        <p><a href="/" style={{ color: '#EF9F27', fontWeight: 700 }}>На головну</a></p>
      </div>
    </main>
  )
}
