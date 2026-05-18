'use client'
import { FaTelegram, FaViber, FaInstagram, FaFacebook, FaWhatsapp } from 'react-icons/fa'
import { FaTiktok } from 'react-icons/fa6'

const platforms = [
  {
    name: 'Telegram', sub: '@balabony_bot',
    href: 'https://t.me/balabony_bot', bg: '#229ED9',
    icon: <FaTelegram size={22} color="#fff" />
  },
  {
    name: 'Viber', sub: 'Viber-канал',
    href: 'https://connect.viber.com/business/fc54c304-3c99-11f1-954e-c29e734e1403', bg: '#7360F2',
    icon: <FaViber size={22} color="#fff" />
  },
  {
    name: 'Instagram', sub: '@balabony_',
    href: 'https://www.instagram.com/balabony_', bg: '#E4405F',
    icon: <FaInstagram size={22} color="#fff" />
  },
  {
    name: 'TikTok', sub: '@balabony_',
    href: 'https://www.tiktok.com/@balabony_', bg: '#000000',
    icon: <FaTiktok size={22} color="#fff" />
  },
  {
    name: 'Facebook', sub: 'Сторінка проєкту',
    href: 'https://www.facebook.com/profile.php?id=61568006368489', bg: '#1877F2',
    icon: <FaFacebook size={22} color="#fff" />
  },
  {
    name: 'WhatsApp', sub: 'Чат підтримки',
    href: 'https://wa.me/380505859141', bg: '#25D366',
    icon: <FaWhatsapp size={22} color="#fff" />
  },
]

export default function PlatformsSection() {
  return (
    <section id="platforms" style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#1a2f4a', border: '1.5px solid rgba(245,166,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
            <rect x="6" y="12" width="32" height="22" rx="3" stroke="#f5a623" strokeWidth="2" fill="none"/>
            <line x1="22" y1="34" x2="22" y2="40" stroke="#f5a623" strokeWidth="2" strokeLinecap="round"/>
            <line x1="15" y1="40" x2="29" y2="40" stroke="#f5a623" strokeWidth="2" strokeLinecap="round"/>
            <rect x="38" y="22" width="12" height="18" rx="3" stroke="#f5a623" strokeWidth="1.5" fill="none"/>
            <line x1="41" y1="37" x2="47" y2="37" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: "'Montserrat', Arial, sans-serif", marginBottom: 3 }}>Де читати</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: "'Montserrat', Arial, sans-serif" }}>Шість каналів. Один досвід.</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <a key={p.name} className="platforms-card" href={p.href} target="_blank" rel="noreferrer" style={{
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
