'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <>
      <AdminHeader
        title="Балабони"
        icon={
          <>
            <rect x="2" y="3" width="16" height="14" rx="2"/>
            <path d="M5 7h10M5 10h7M5 13h5" strokeLinejoin="round"/>
          </>
        }
      />
      {children}
    </>
  )
}
