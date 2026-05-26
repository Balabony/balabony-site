import LongevityClubSection from '../components/LongevityClubSection'
import Breadcrumbs from '../components/Breadcrumbs'

export const metadata = {
  title: 'Ігри · Балабони',
  description: 'Інтерактивні ігри та головоломки',
}

export default function GamesPage() {
  return (
    <>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 0' }}>
        <Breadcrumbs items={[{ label: 'Ігри' }]} />
      </div>
      <LongevityClubSection />
    </>
  )
}
