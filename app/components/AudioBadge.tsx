import React from 'react'

// Фірмова піктограма + бейдж статусу аудіо.
// Іконка «звукова хвиля у крузі» — тонкі делікатні лінії; єдине джерело для всього сайту.

const GOLD = '#EF9F27'
const GOLD_SOFT = '#FAC775'
const MUTED = '#8AA0B8'
const FONT = "'Montserrat', Arial, sans-serif"

export function AudioWaveIcon({
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
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="8.5" vectorEffect="non-scaling-stroke" />
      <line x1="8.5" y1="13.5" x2="8.5" y2="10.5" vectorEffect="non-scaling-stroke" />
      <line x1="10.8" y1="14.5" x2="10.8" y2="9.5" vectorEffect="non-scaling-stroke" />
      <line x1="13.2" y1="15" x2="13.2" y2="9" vectorEffect="non-scaling-stroke" />
      <line x1="15.5" y1="14" x2="15.5" y2="10" vectorEffect="non-scaling-stroke" />
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
  const color = hasAudio ? GOLD : MUTED
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: size,
        fontWeight: 600,
        fontFamily: FONT,
        color,
      }}
    >
      <AudioWaveIcon size={size + 5} color={color} />
      {hasAudio ? 'Аудіо доступно' : 'Аудіо готується'}
    </span>
  )
}

export { GOLD_SOFT }
