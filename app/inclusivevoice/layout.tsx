import type { Metadata } from 'next'
import type { ReactNode } from 'react'

/**
 * МЕТАДАНІ ДЛЯ КЛІЄНТСЬКОЇ СТОРІНКИ (17.09.2026, за результатом аудиту).
 *
 * Сама сторінка — `'use client'`, а Next.js не дозволяє клієнтському
 * компоненту експортувати `metadata`. Через це 22 сторінки в sitemap
 * успадковували title і description із app/layout.tsx, тобто в пошуку всі
 * звалися «Українські історії, казки й серіали онлайн — Балабони».
 *
 * Розбивати кожну сторінку на серверну обгортку й клієнтський компонент не
 * знадобилося: `layout.tsx` у тій самій папці метадані експортувати МОЖЕ,
 * і рендеринг від цього не змінюється — layout просто віддає children.
 */
export const metadata: Metadata = {
  title: 'InclusiveVoice — Balabony',
  description: 'A voice-first path into reading and storytelling for people for whom the keyboard is a barrier.',
  alternates: { canonical: '/inclusivevoice' },
  openGraph: {
    title: 'InclusiveVoice — Balabony',
    description: 'A voice-first path into reading and storytelling for people for whom the keyboard is a barrier.',
    url: 'https://balabony.com/inclusivevoice',
    type: 'website',
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
