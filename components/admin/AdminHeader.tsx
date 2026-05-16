'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY_DEEP = '#0a1628'

const navBtnStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
  color: '#c8d4e8', fontFamily: FONT, cursor: 'pointer',
  textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
}

const activeNavBtnStyle: React.CSSProperties = {
  ...navBtnStyle,
  background: 'rgba(240,165,0,0.12)',
  border: '1px solid rgba(240,165,0,0.5)',
  color: GOLD,
}

const logoutBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
  color: '#8899bb', fontFamily: FONT, cursor: 'pointer',
}

export interface AdminHeaderProps { icon: ReactNode; title: string }

export default function AdminHeader({ icon, title }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin/content/stories', label: 'Історії'        },
    { href: '/admin/stories',      label: 'Редактор серій' },
    { href: '/admin/series-list',  label: 'Список серій' },
    { href: '/admin/reviews',      label: 'Відгуки' },
    { href: '/admin/editors',      label: 'Редактори' },
    { href: '/admin/batch-review', label: 'Пакет перегляд' },
    { href: '/admin/review',       label: 'AI-Перегляд' },
    { href: '/admin/analytics',    label: 'Аналітика' },
    { href: '/admin/stories1',     label: 'Авторські' },
    { href: '/admin/editorial',    label: 'Редакція' },
  ]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: '0.5px solid rgba(255,255,255,0.07)',
      padding: '20px 0', fontFamily: FONT,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: GOLD,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
          stroke={NAVY_DEEP} strokeWidth="1.6" strokeLinecap="round">
          {icon}
        </svg>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 2, fontFamily: FONT }}>
          Адмін панель
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>
          {title}
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={pathname === item.href ? activeNavBtnStyle : navBtnStyle}
          >
            {item.label}
          </Link>
        ))}
        <button onClick={handleLogout} style={logoutBtnStyle}>Вийти</button>
      </div>
    </div>
  )
}

