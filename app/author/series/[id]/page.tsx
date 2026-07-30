import type { Metadata } from 'next'
import Link from 'next/link'
import EpisodeMetaEditor from '@/app/components/EpisodeMetaEditor'

const NAVY_DEEP = '#0a1628'
const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

export const metadata: Metadata = {
  title: 'Супровідні тексти серії · Кабінет автора',
  robots: { index: false, follow: false },
}

export default async function AuthorEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <main style={{ background: NAVY_DEEP, padding: '40px 20px 64px', fontFamily: FONT }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/author/dashboard" style={{ fontSize: 13, color: 'rgba(245,240,232,0.55)', textDecoration: 'none' }}>
          ← Кабінет автора
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f5f0e8', margin: '12px 0 6px', lineHeight: 1.25 }}>
          Супровідні тексти
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: '#8fa3c4', margin: '0 0 22px' }}>
          Це те, що читач бачить навколо вашої серії: у стрічці, на початку наступної серії та у ваших соцмережах.
          Пишете ви — публікує редактор.
        </p>
        <EpisodeMetaEditor id={id} />
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(143,163,196,0.75)', margin: '18px 0 0' }}>
          Порада: анонс наступної серії найважчий і найважливіший. Він вирішує, чи читач повернеться через тиждень.
          Один рядок, жодного спойлера — <span style={{ color: GOLD }}>питання, а не переказ</span>.
        </p>
      </div>
    </main>
  )
}
