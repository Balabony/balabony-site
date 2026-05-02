'use client'

const platforms = [
  {
    name: 'Telegram', sub: '@balabony_bot',
    href: 'https://t.me/balabony_bot', bg: '#e8f0fe',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round">
        <path d="M17 3L2 8.5l5 2 2 5.5 2-3.5 4 3L17 3z" /><path d="M7 10.5l8-6" />
      </svg>
    )
  },
  {
    name: 'Viber', sub: 'Viber-канал',
    href: 'https://connect.viber.com/business/fc54c304-3c99-11f1-954e-c29e734e1403', bg: '#f3e8fd',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#7360f2" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="2" width="14" height="14" rx="4" />
        <path d="M7 8c.5-2 4.5-2 5 0 .3 1.3-.7 2-1.5 2.5V12" />
        <circle cx="10.5" cy="13" r=".5" fill="currentColor" />
      </svg>
    )
  },
  {
    name: 'Instagram', sub: '@balabony_',
    href: 'https://www.instagram.com/balabony_', bg: '#fce8f0',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#e4405f" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="3" width="14" height="14" rx="4" />
        <circle cx="10" cy="10" r="4" />
        <circle cx="14.5" cy="5.5" r=".5" fill="currentColor" />
      </svg>
    )
  },
  {
    name: 'TikTok', sub: '@balabony_',
    href: 'https://www.tiktok.com/@balabony_', bg: '#fce8f0',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
        <path d="M13 3c.5 2 2 3.5 4 4v2c-1.5 0-3-.5-4-1.5V14a5 5 0 11-5-5v2a3 3 0 103 3V3h2z" />
      </svg>
    )
  },
  {
    name: 'Facebook', sub: 'Сторінка проєкту',
    href: 'https://www.facebook.com/profile.php?id=61568006368489', bg: '#e8f0fe',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#1877f2" strokeWidth="1.5" strokeLinecap="round">
        <path d="M17 2H3a1 1 0 00-1 1v14a1 1 0 001 1h7v-6H8V9h2V7a3 3 0 013-3h2v3h-2a1 1 0 00-1 1v2h3l-.5 3H12v6h5a1 1 0 001-1V3a1 1 0 00-1-1z" />
      </svg>
    )
  },
]

export default function PlatformsSection() {
  return (
    <section id="platforms" style={{ marginBottom: 56 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-gold)', display: 'block', marginBottom: 8 }}>
        Де слухати
      </span>
      <h2 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 700, color: '#FFFFFF', marginBottom: 28 }}>
        Доступно на 5 платформах
      </h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <a key={p.name} href={p.href} target="_blank" rel="noreferrer" style={{
            background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
            textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 150
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, background: p.bg }}>
              {p.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.sub}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
