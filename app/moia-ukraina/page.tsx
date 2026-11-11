// 11.11.2026: «Моя Україна на мапі» — освітня гра про міста України, історію й пам’ять (демоверсія для проєкту «Моє місце»).
import type { Metadata } from 'next'
import Game from './Game'

const TITLE = 'Моя Україна на мапі — гра про міста України для школярів'
const DESC = 'Безкоштовна гра для учнів 5–11 класів: понад 100 запитань про історію, пам’ять і культуру міст України, нитка від рідного міста до теперішнього на мапі й рейтинг шкіл. Без реєстрації.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: 'https://balabony.com/moia-ukraina' },
  openGraph: { title: TITLE, description: DESC, url: 'https://balabony.com/moia-ukraina', type: 'website', images: ['https://balabony.com/og-image-v6.jpg'] },
}

export default function Page() {
  return <Game />
}
