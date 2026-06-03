import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Вхід — Balabony™',
  description: 'Увійдіть до свого облікового запису Balabony, щоб продовжити читати та слухати українські історії.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
