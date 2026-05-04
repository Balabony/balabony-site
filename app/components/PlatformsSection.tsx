'use client'

const platforms = [
  {
    name: 'Telegram', sub: '@balabony_bot',
    href: 'https://t.me/balabony_bot', bg: '#229ED9',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
        <path d="M17 3L2 8.5l5 2 2 5.5 2-3.5 4 3L17 3z" /><path d="M7 10.5l8-6" />
      </svg>
    )
  },
  {
    name: 'Viber', sub: 'Viber-канал',
    href: 'https://connect.viber.com/business/fc54c304-3c99-11f1-954e-c29e734e1403', bg: '#7360F2',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="2" width="14" height="14" rx="4" />
        <path d="M7 8c.5-2 4.5-2 5 0 .3 1.3-.7 2-1.5 2.5V12" />
        <circle cx="10.5" cy="13" r=".5" fill="currentColor" />
      </svg>
    )
  },
  {
    name: 'Instagram', sub: '@balabony_',
    href: 'https://www.instagram.com/balabony_', bg: '#E4405F',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="3" width="14" height="14" rx="4" />
        <circle cx="10" cy="10" r="4" />
        <circle cx="14.5" cy="5.5" r=".5" fill="currentColor" />
      </svg>
    )
  },
  {
    name: 'TikTok', sub: '@balabony_',
    href: 'https://www.tiktok.com/@balabony_', bg: '#000000',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
        <path d="M13 3c.5 2 2 3.5 4 4v2c-1.5 0-3-.5-4-1.5V14a5 5 0 11-5-5v2a3 3 0 103 3V3h2z" />
      </svg>
    )
  },
  {
    name: 'Facebook', sub: 'Сторінка проєкту',
    href: 'https://www.facebook.com/profile.php?id=61568006368489', bg: '#1877F2',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
        <path d="M17 2H3a1 1 0 00-1 1v14a1 1 0 001 1h7v-6H8V9h2V7a3 3 0 013-3h2v3h-2a1 1 0 00-1 1v2h3l-.5 3H12v6h5a1 1 0 001-1V3a1 1 0 00-1-1z" />
      </svg>
    )
  },
  {
    name: 'WhatsApp', sub: 'Чат підтримки',
    href: 'https://wa.me/380000000000', bg: '#25D366',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    )
  },
]

export default function PlatformsSection() {
  return (
    <section id="platforms" style={{ marginBottom: 56 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-gold)', display: 'block', marginBottom: 8 }}>
        Де читати
      </span>
      <h2 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 700, color: '#FFFFFF', marginBottom: 28 }}>
        Доступно на шести платформах
      </h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <a key={p.name} href={p.href} target="_blank" rel="noreferrer" style={{
            background: p.bg, border: '1.5px solid #f5a623', borderRadius: 14,
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
            textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 140
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, background: 'rgba(255,255,255,0.2)' }}>
              {p.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{p.sub}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
