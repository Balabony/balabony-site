import Link from 'next/link'

/**
 * Невеликий блок-запрошення до Клубу Балабонів (17.10.2026) — перелінковка
 * з конкурсів, календарів, пільги й підтримки на /klub (і навпаки, див. /klub).
 */
export default function KlubCta({ text }: { text?: string }) {
  return (
    <aside aria-label="Клуб Балабонів" style={{ maxWidth: 820, margin: '2rem auto', padding: '0 0' }}>
      <Link href="/klub" style={{
        display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none',
        background: '#14253B', border: '1px solid rgba(239,159,39,.4)', borderRadius: 14, padding: '.9rem 1.1rem',
        color: '#FFF8EE', fontFamily: "'Montserrat', Arial, sans-serif",
      }}>
        <img src="/klub/balabon-klub-600.webp" width={72} height={72} alt="" style={{ borderRadius: 12, flex: 'none' }} />
        <span style={{ lineHeight: 1.5 }}>
          <strong style={{ color: '#FAC775', display: 'block', fontSize: '1.05rem' }}>Клуб Балабонів — безкоштовно</strong>
          <span style={{ color: '#B8C6D8', fontSize: '.95rem' }}>
            {text ?? 'Нові історії щотижня, першими — про конкурси, а щогрудня найактивнішим — календар у подарунок.'}
          </span>
          <span style={{ color: '#EF9F27', fontWeight: 700, display: 'block', marginTop: '.2rem' }}>Вступити →</span>
        </span>
      </Link>
    </aside>
  )
}
