'use client'

/**
 * Посторінковий показ списку історій.
 *
 * Сторінка /stories малювала всі 908 карток одним полотном — браузер будував
 * величезний DOM, і сторінка відкривалась із затримкою в десятки секунд.
 * Дані з бази приходять усі одразу (це вже лише уривки, ~900 кБ), а от у DOM
 * потрапляє порція: так перший екран з'являється миттєво, а решта — за кліком,
 * без нового запиту на сервер.
 */

import { useState } from 'react'
import FreshStoriesGrid, { type Story } from './FreshStoriesGrid'

const PAGE_SIZE = 24

export default function StoriesPaged({
  stories,
  showHeading = false,
}: {
  stories: Story[]
  showHeading?: boolean
}) {
  const [shown, setShown] = useState(PAGE_SIZE)

  const visible = stories.slice(0, shown)
  const left = stories.length - visible.length

  return (
    <>
      <FreshStoriesGrid stories={visible} showHeading={showHeading} />

      {left > 0 && (
        <div style={{ textAlign: 'center', padding: '0 20px 48px' }}>
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            style={{
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--accent-gold)',
              border: '1.5px solid var(--accent-gold)',
              borderRadius: 999,
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Montserrat', Arial, sans-serif",
              letterSpacing: 0.5,
            }}
          >
            Показати ще · лишилось {left}
          </button>
        </div>
      )}
    </>
  )
}
