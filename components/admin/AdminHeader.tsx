'use client'

// =============================================================================
// ШАПКА АДМІНКИ
//
// Було: одинадцять посилань, вписаних просто в цей файл, при двадцяти трьох
// розділах. Решта жила лише прямими адресами — привʼязку авторів і перелік
// творів за договорами доводилось тримати в закладках.
//
// Стало: перелік береться з lib/admin-sections.ts (спільний з головною /admin).
// Найчастіші розділи — окремими кнопками, решта — під кнопкою «Ще», згруповані
// так само, як на головній. Тобто дістатись можна куди завгодно, не виходячи
// зі сторінки.
//
// Новий розділ додається у lib/admin-sections.ts, сюди лізти не треба.
// =============================================================================

import { ReactNode, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ADMIN_GROUPS, ADMIN_QUICK } from '@/lib/admin-sections'

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

const moreBtnStyle: React.CSSProperties = {
  ...navBtnStyle,
  border: '1px solid rgba(208, 163, 85,0.45)',
  color: GOLD,
  gap: 6,
}

export interface AdminHeaderProps { icon: ReactNode; title: string }

export default function AdminHeader({ icon, title }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Закриваємо список кліком поза ним і клавішею Esc.
  useEffect(() => {
    if (!open) return

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const node = menuRef.current
      if (node && e.target instanceof Node && !node.contains(e.target)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Перехід на іншу сторінку має згортати список.
  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  // На Тиші показуємо перемикач «Балабони», на Балабонах — «Тиша».
  const isTysha = pathname?.startsWith('/admin/tysha')
  const switcher = isTysha
    ? { href: '/admin/content/stories', label: 'Балабони' }
    : { href: '/admin/tysha',           label: 'Тиша' }

  // На Тиші не дублюємо вкладки Балабонів — лише перемикач назад і «Ще».
  const quickItems = isTysha ? [] : ADMIN_QUICK

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

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Link href={switcher.href} style={switcherBtnStyle}>
          {switcher.label}
        </Link>

        {quickItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={pathname === item.href ? activeNavBtnStyle : navBtnStyle}
          >
            {item.short ?? item.label}
          </Link>
        ))}

        {/* Повний перелік розділів — щоб не тримати адреси в закладках. */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-haspopup="true"
            style={moreBtnStyle}
          >
            Ще
            <span style={{ fontSize: 9, lineHeight: 1 }}>{open ? '▲' : '▼'}</span>
          </button>

          {open && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 300, maxHeight: '70vh', overflowY: 'auto',
                background: NAVY, border: '1px solid rgba(143,163,196,0.28)',
                borderRadius: 12, padding: '10px 0',
                boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
                zIndex: 1000,
              }}
            >
              {ADMIN_GROUPS.map(group => (
                <div key={group.title} style={{ padding: '4px 0' }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1.3,
                    textTransform: 'uppercase', color: GOLD,
                    padding: '8px 14px 6px',
                  }}>
                    {group.title}
                  </div>

                  {group.items.map(item => {
                    const active = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          display: 'block', padding: '7px 14px',
                          fontSize: 13, fontWeight: active ? 700 : 500,
                          color: active ? GOLD : '#dbe4f2',
                          textDecoration: 'none', lineHeight: 1.35,
                        }}
                      >
                        {item.label}
                        <div style={{ fontSize: 11, color: 'rgba(185,198,219,0.62)', marginTop: 2 }}>
                          {item.note}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ))}

              <div style={{ borderTop: '1px solid rgba(143,163,196,0.2)', marginTop: 6, paddingTop: 6 }}>
                <Link
                  href="/admin"
                  style={{
                    display: 'block', padding: '7px 14px', fontSize: 12.5,
                    fontWeight: 600, color: '#b9c6db', textDecoration: 'none',
                  }}
                >
                  ← Головна адмінки
                </Link>
              </div>
            </div>
          )}
        </div>

        <button onClick={handleLogout} style={logoutBtnStyle}>Вийти</button>
      </div>
    </div>
  )
}
