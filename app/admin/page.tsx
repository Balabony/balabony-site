// =============================================================================
// АДМІНКА — ГОЛОВНА
//
// Досі /admin просто редиректив на /admin/login, тому посилання «← В адмінку»
// з усіх сторінок вело на екран входу. І з двадцяти з гаком розділів у меню
// вміщалось десять — решта жила лише прямими адресами.
//
// Тут — повний перелік. Доступ уже перекритий у proxy.ts: неавторизованого
// на /admin не пустить, тому сторінку видно тільки після входу.
//
// Сам перелік розділів переїхав у lib/admin-sections.ts, бо його читає ще й
// шапка (AdminHeader). Новий розділ вписуйте туди — і він зʼявиться в обох
// місцях одразу.
// =============================================================================

import { ADMIN_GROUPS } from '@/lib/admin-sections'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'

const cardStyle: React.CSSProperties = {
  display: 'block',
  background: NAVY,
  border: `1px solid ${LINE}`,
  borderRadius: 14,
  padding: '15px 17px',
  textDecoration: 'none',
}

export default function AdminHomePage() {
  return (
    <main style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 20px 90px' }}>

        <h1 style={{ color: GOLD, fontSize: 26, margin: 0 }}>Адмінка</h1>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, marginTop: 10, marginBottom: 4 }}>
          Усі розділи. Той самий перелік доступний з будь-якої сторінки — кнопка «Ще» у шапці.
        </p>

        {ADMIN_GROUPS.map((g) => (
          <section key={g.title} style={{ marginTop: 30 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, letterSpacing: 1.4,
              textTransform: 'uppercase', color: GOLD, marginBottom: 12,
            }}>
              {g.title}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 12,
            }}>
              {g.items.map((it) => (
                <a key={it.href} href={it.href} style={cardStyle}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: CREAM }}>
                    {it.label}
                  </div>
                  <div style={{ fontSize: 12.5, color: MUTED, marginTop: 5, lineHeight: 1.5 }}>
                    {it.note}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'rgba(185,198,219,0.5)', marginTop: 7, fontFamily: 'monospace' }}>
                    {it.href}
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

      </div>
    </main>
  )
}
