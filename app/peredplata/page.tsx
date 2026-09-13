import type { Metadata } from 'next'
import PricingSection from '@/app/components/PricingSection'
import Breadcrumbs from '@/app/components/Breadcrumbs'

/**
 * Сторінка передплати.
 *
 * Чому вона існує. До 13.09.2026 усі пакети стояли блоком на головній.
 * Перші три місяці мета — трафік, а не продаж: гість, який одразу бачить
 * прайс, читає сайт як платний і йде. Тому на головній лишилася лише
 * місійна частина (пільга 1 ₴ і безкоштовний доступ), а вся комерція —
 * тут.
 *
 * Код НЕ дублюється: це той самий PricingSection, лише з variant="full".
 * На головній він рендериться з variant="home". Ціни правляться в одному
 * місці — app/components/PricingSection.tsx.
 */

export const metadata: Metadata = {
  title: 'Передплата — Балабони',
  description:
    'Тарифи Балабонів: місячна і річна передплата, сімейний і пенсійний пакети, разова оплата, подарункова підписка. Пільговий доступ 1 ₴ на рік для ветеранів, ВПО та людей з інвалідністю.',
  alternates: { canonical: 'https://balabony.com/peredplata' },
  openGraph: {
    title: 'Передплата — Балабони',
    description:
      'Тарифи Балабонів, подарункова підписка і пільговий доступ 1 ₴ на рік.',
    url: 'https://balabony.com/peredplata',
    type: 'website',
  },
}

export default function PeredplataPage() {
  return (
    <main style={{ background: '#0a1628', minHeight: '100vh' }}>
      <Breadcrumbs items={[{ label: 'Передплата' }]} />
      <PricingSection variant="full" />
    </main>
  )
}
