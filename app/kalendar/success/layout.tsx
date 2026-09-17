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
  title: 'Замовлення прийнято — Балабони',
  description: 'Сторінка підтвердження замовлення календаря.',
  // Сторінка-подяка: у пошуку вона не потрібна й показувала б чужий
  // результат поза контекстом.
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
