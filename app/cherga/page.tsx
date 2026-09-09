import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import VoiceQueue from '@/app/components/VoiceQueue'
import { VOTE_COST } from '@/lib/voice-queue'

/**
 * Черга на озвучення.
 *
 * Бали в кабінеті були видимі, але витратити їх не було на що. Обмін на
 * платний доступ віддавав би те, чого ми ще не почали продавати. Натомість
 * читач впливає на єдиний справжній дефіцит платформи — на те, що озвучимо
 * першим, коли з'являться кошти.
 */

export const metadata: Metadata = {
  title: 'Черга на озвучення — голосування читачів · Балабони',
  description: 'Читачі Балабонів вирішують, які історії озвучимо першими. Голос коштує бали, які нараховуються за читання, відгуки й запрошених друзів.',
  alternates: { canonical: '/cherga' },
}

const GOLD = '#ef9f27'
const CREAM = '#f5f0e8'
const TEXT = '#dbe4f0'
const SERIF = "'Lora', Georgia, serif"

export default function Page() {
  return (
    <main style={{ background: '#0a1628', minHeight: '100vh', padding: '1.5rem 1rem 4rem' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <Breadcrumbs items={[{ label: 'Черга на озвучення' }]} />

        <h1 style={{ fontFamily: SERIF, fontSize: '2rem', color: CREAM, margin: '1rem 0 0.75rem' }}>
          Що озвучимо першим — вирішуєте ви
        </h1>

        <p style={{ color: TEXT, lineHeight: 1.75, marginBottom: '0.9rem' }}>
          Скажемо прямо: коштів на озвучення в нас поки немає. Записати голоси коштує грошей,
          і ми подали кілька грантових заявок саме на це. Коли гроші з&apos;являться, ми не
          гадатимемо, з чого почати — почнемо з того, що обрали читачі.
        </p>

        <p style={{ color: TEXT, lineHeight: 1.75, marginBottom: '0.9rem' }}>
          Голос коштує {VOTE_COST} балів. Бали нараховуються за прочитану серію, за читання
          кілька днів поспіль, за відгук, за пройдене опитування і за друга, який прийшов
          за вашим запрошенням. За кожен твір можна проголосувати один раз.
        </p>

        <p style={{ color: TEXT, lineHeight: 1.75, marginBottom: '2rem' }}>
          Оберіть автора зі списку — і побачите всі його історії. Про самі голоси,
          якими читатимемо, — на сторінці{' '}
          <Link href="/holosy" style={{ color: GOLD }}>Голоси платформи</Link>.
        </p>

        <VoiceQueue cost={VOTE_COST} />
      </div>
    </main>
  )
}
