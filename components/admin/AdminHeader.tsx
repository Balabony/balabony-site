'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY_DEEP = '#0a1628'

const navBtnStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
  color: '#c8d4e8', fontFamily: FONT, cursor: 'pointer',
  textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
}

const logoutBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
  color: '#8899bb', fontFamily: FONT, cursor: 'pointer',
}

export interface AdminHeaderProps { icon: ReactNode; title: string }

export default function AdminHeader({ icon, title }: AdminHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

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

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/admin/stories"      style={navBtnStyle}>Редактор серій</Link>
        <Link href="/admin/series-list"  style={navBtnStyle}>Список серій</Link>
        <Link href="/admin/reviews"      style={navBtnStyle}>Відгуки</Link>
        <Link href="/admin/editors"      style={navBtnStyle}>Редактори</Link>
        <Link href="/admin/batch-review" style={navBtnStyle}>Пакетна перевірка</Link>
        <Link href="/admin/analytics"    style={navBtnStyle}>Аналітика</Link>
        <button onClick={handleLogout}   style={logoutBtnStyle}>Вийти</button>
      </div>
    </div>
  )
}
