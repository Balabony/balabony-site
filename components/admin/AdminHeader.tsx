'use client'

// =============================================================================
// ШАПКА АДМІНКИ
//
// Було: одинадцять посилань, вписаних просто в цей файл, при двадцяти трьох
// розділах. Решта жила лише прямими адресами — привʼязку авторів і перелік
// творів за договорами доводилось тримати в закладках.
//
// Стало: перелік береться з lib/admin-sections.ts (спільний з головною /admin).
// ВСІ розділи показані одразу, без випадного меню: очима знайти потрібне швидше,
// ніж розкривати список і шукати в ньому. Кнопки переносяться на кілька рядків
// і згруповані так само, як на головній — заголовок групи, під ним її розділи.
//
// Новий розділ додається у lib/admin-sections.ts, сюди лізти не треба.
// =============================================================================

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ADMIN_GROUPS } from '@/lib/admin-sections'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#d0a355'
const NAVY_DEEP = '#0a1628'
const NAVY      = '#0f1e3a'

const navBtnStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
  color: '#c8d4e8', fontFamily: FONT, cursor: 'pointer',
  textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
  whiteSpace: 'nowrap',
}

const activeNavBtnStyle: React.CSSProperties = {
  ...navBtnStyle,
  background: 'rgba(208, 163, 85,0.12)',
  border: '1px solid rgba(208, 163, 85,0.5)',
  color: GOLD,
}

const logoutBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
  color: '#8899bb', fontFamily: FONT, cursor: 'pointer', whiteSpace: 'nowrap',
}

// Перемикач розділів: помітна «залита» вкладка, щоб читалась як зміна розділу.
const switcherBtnStyle: React.CSSProperties = {
  background: GOLD, border: `1px solid ${GOLD}`,
  borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700,
  letterSpacing: 1, color: NAVY_DEEP, fontFamily: FONT, cursor: 'pointer',
  textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
  textTransform: 'uppercase', whiteSpace: 'nowrap',
}

export interface AdminHeaderProps { icon: ReactNode; title: string }

export default function AdminHeader({ icon, title }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  // На Тиші показуємо перемикач «Балабони», на Балабонах — «Тиша».
  const isTysha = pathname?.startsWith('/admin/tysha')
  const switcher = isTysha
    ? { href: '/admin/content/stories', label: 'Балабони' }
    : { href: '/admin/tysha',           label: 'Тиша' }

  // Розділ «Тиша» має власний перемикач у шапці, тому в переліку його не дублюємо.
  const groups = ADMIN_GROUPS.filter(g => g.title !== 'Тиша' || !isTysha)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: '0.5px solid rgba(255,255,255,0.07)',
      padding: '20px 0', fontFamily: FONT,
    }}>
      <Link
        href="/admin"
        title="Усі розділи адмінки"
        style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
      >
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
      </Link>

      <div style={{
        marginLeft: 'auto', display: 'flex', alignItems: 'flex-start',
        gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '78%',
      }}>
        <Link href={switcher.href} style={switcherBtnStyle}>
          {switcher.label}
        </Link>

        {/* Усі розділи одразу, згруповані. На Тиші показуємо теж — щоб
            повернутися до будь-чого можна було одним кліком. */}
        {groups.map(group => (
          <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
              textTransform: 'uppercase', color: 'rgba(208,163,85,0.75)',
              paddingLeft: 2,
            }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {group.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.note}
                  style={pathname === item.href ? activeNavBtnStyle : navBtnStyle}
                >
                  {item.short ?? item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button type="button" onClick={handleLogout} style={{ ...logoutBtnStyle, alignSelf: 'flex-end' }}>
          Вийти
        </button>
      </div>

    </div>
  )
}
