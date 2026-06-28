'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Розділ «Тиша» має свій підпис у шапці, щоб візуально відрізнятися від Балабонів.
  const isTysha = pathname?.startsWith('/admin/tysha')
  const title = isTysha ? 'ТИША' : 'Балабони'

  return (
    <>
      <AdminHeader
        title={title}
        icon={
          isTysha ? (
            // Тиша: мінімалістична «пауза/тиша» — дві вертикальні риски
            <>
              <line x1="7" y1="4" x2="7" y2="16" />
              <line x1="13" y1="4" x2="13" y2="16" />
            </>
          ) : (
            <>
              <rect x="2" y="3" width="16" height="14" rx="2"/>
              <path d="M5 7h10M5 10h7M5 13h5" strokeLinejoin="round"/>
            </>
          )
        }
      />
      {children}
    </>
  )
}
