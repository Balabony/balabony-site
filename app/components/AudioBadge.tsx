import React from 'react'

// Фірмова піктограма + бейдж статусу аудіо.
// Єдине джерело іконки навушників для всього сайту — щоб скрізь однаково.

const GOLD = '#EF9F27'
const GOLD_SOFT = '#FAC775'
const MUTED = '#8AA0B8'
const FONT = "'Montserrat', Arial, sans-serif"

export function HeadphonesIcon({
  size = 14,
  color = GOLD,
}: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M3 18v-6a9 9 0 0118 0v6" />
      <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
    </svg>
  )
}

// Бейдж статусу аудіо: «Аудіо доступно» (золотий) / «Аудіо готується» (приглушений).
export default function AudioBadge({
  hasAudio,
  size = 11,
}: {
  hasAudio: boolean
  size?: number
}) {
  const textColor = hasAudio ? GOLD : MUTED
  const iconColor = hasAudio ? GOLD : MUTED
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: size,
        fontWeight: 600,
        fontFamily: FONT,
        color: textColor,
      }}
    >
      <HeadphonesIcon size={size + 3} color={iconColor} />
      {hasAudio ? 'Аудіо доступно' : 'Аудіо готується'}
    </span>
  )
}

export { GOLD_SOFT }
