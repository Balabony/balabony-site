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
  title: 'Стати автором на Балабонах — Балабони',
  description: 'Як опублікувати свої оповідання на Балабонах: умови для авторів, договір, винагорода за дочитування, участь у конкурсах.',
  alternates: { canonical: '/become-author' },
  openGraph: {
    title: 'Стати автором на Балабонах — Балабони',
    description: 'Як опублікувати свої оповідання на Балабонах: умови для авторів, договір, винагорода за дочитування, участь у конкурсах.',
    url: 'https://balabony.com/become-author',
    type: 'website',
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
