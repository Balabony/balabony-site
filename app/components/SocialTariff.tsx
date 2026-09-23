'use client'

/**
 * Соціальний тариф (пільга 1 ₴ на рік) — одне джерело правди.
 *
 * Звідки взялося. 23.09.2026 під пільгу зробили окрему сторінку /pilga,
 * щоб місійна воронка (ветерани, ВПО, люди з інвалідністю) мала власну
 * адресу й власну картинку для прев'ю, а головна — комерційну.
 * Перелік статусів раніше жив лише всередині PricingSection. Щоб на двох
 * сторінках він не розійшовся, винесли його сюди: PricingSection і /pilga
 * беруть той самий SOCIAL_TARIFF_OPTIONS.
 */

import { useState } from 'react'
import DiiaValidationModal, { type DiiaOption } from './DiiaValidationModal'

export const SOCIAL_TARIFF_TITLE = 'Соціальний тариф'
export const SOCIAL_TARIFF_SUBTITLE =
  // Не «через Дію»: люди з інвалідністю підтверджують статус документом.
  'Оберіть свою категорію — доступ за соціальним тарифом на рік'

export const SOCIAL_TARIFF_OPTIONS: DiiaOption[] = [
  {
    docType: 'reference-internally-displaced-person',
    label: 'Внутрішньо переміщена особа (ВПО)',
    hint: 'Довідка ВПО',
  },
  {
    docType: 'veteran-certificate',
    // Дія підтвердила: veteran-certificate покриває і УБД,
    // і посвідчення особи з інвалідністю внаслідок війни.
    // Пишемо обидва, інакше люди з ОІВВ не здогадаються обрати цю гілку.
    label: 'Учасник бойових дій або особа з інвалідністю внаслідок війни',
    hint: 'Посвідчення УБД або ОІВВ',
  },
  {
    // Цивільну інвалідність Дія не валідує — окремого типу документа
    // немає. Тому ручна перевірка: пільга діє одразу, скан дивиться редактор.
    manual: true,
    category: 'disability',
    label: 'Людина з інвалідністю',
    docHint: 'Довідка МСЕК, посвідчення особи з інвалідністю або пенсійне посвідчення із зазначенням інвалідності.',
  },
]

/** Кнопка, що відкриває підтвердження статусу. Використовується на /pilga. */
export default function SocialTariffButton({ label = 'Отримати пільговий доступ' }: { label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-block',
          background: '#EF9F27',
          color: '#0E1A2B',
          border: 'none',
          borderRadius: 999,
          padding: '16px 32px',
          fontSize: 18,
          fontWeight: 800,
          fontFamily: "'Montserrat', Arial, sans-serif",
          cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(0,0,0,0.25)',
        }}
      >
        {label}
      </button>
      {open && (
        <DiiaValidationModal
          title={SOCIAL_TARIFF_TITLE}
          subtitle={SOCIAL_TARIFF_SUBTITLE}
          options={SOCIAL_TARIFF_OPTIONS}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
