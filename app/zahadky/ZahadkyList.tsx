import type { Zahadka } from '@/lib/zahadky'

/**
 * Список загадок. Відповідь схована в <details> — без JavaScript:
 * працює з екранним читачем і з клавіатури, а пошуковик бачить і загадку,
 * і відповідь (саме за «з відповідями» люди й шукають).
 *
 * Шрифт навмисно великий: розділ читають уголос дітям, часто бабусі й
 * дідусі — та сама аудиторія 55+, що й у «Клубі довголіття».
 */
export default function ZahadkyList({ items }: { items: Zahadka[] }) {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
      {items.map((z, i) => (
        <li
          key={i}
          style={{
            background: '#0f1e3a',
            border: '1px solid rgba(143,163,196,0.22)',
            borderRadius: 14,
            padding: '18px 20px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 20,
              lineHeight: 1.55,
              color: '#f5f0e8',
            }}
          >
            <span aria-hidden="true" style={{ color: 'var(--accent-gold)', fontWeight: 700, marginRight: 8 }}>
              {i + 1}.
            </span>
            {z.q}
          </p>
          {z.author && (
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#8899bb' }}>Автор: {z.author}</p>
          )}
          <details style={{ marginTop: 12 }}>
            <summary
              style={{
                cursor: 'pointer',
                display: 'inline-block',
                fontSize: 15,
                fontWeight: 700,
                color: '#0a1628',
                background: 'var(--accent-gold)',
                borderRadius: 9,
                padding: '8px 16px',
                listStyle: 'none',
              }}
            >
              Показати відповідь
            </summary>
            <p style={{ margin: '12px 0 0', fontSize: 19, fontWeight: 700, color: '#FAC775' }}>
              {z.a}
            </p>
            {z.more && (
              <p style={{ margin: '8px 0 0', fontSize: 15 }}>
                <a href={z.more.href} style={{ color: '#FAC775' }}>{z.more.label}</a>
              </p>
            )}
          </details>
        </li>
      ))}
    </ol>
  )
}
