import React from 'react'

// Фірмові піктограми (тонкі делікатні лінії) — єдине джерело для всього сайту.
//   AudioWaveIcon — коло + вертикальні хвилі (аудіо)
//   ReadIcon      — коло + горизонтальні рядки (читання) — пара до аудіо

const GOLD = '#EF9F27'
const GOLD_SOFT = '#FAC775'
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
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="8.5" vectorEffect="non-scaling-stroke" />
      <line x1="8.6" y1="13" x2="8.6" y2="11" vectorEffect="non-scaling-stroke" />
      <line x1="10.9" y1="14.5" x2="10.9" y2="9.5" vectorEffect="non-scaling-stroke" />
      <line x1="13.1" y1="15" x2="13.1" y2="9" vectorEffect="non-scaling-stroke" />
      <line x1="15.4" y1="13.5" x2="15.4" y2="10.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function ReadIcon({
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
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="8.5" vectorEffect="non-scaling-stroke" />
      <line x1="7.8" y1="9.5" x2="16.2" y2="9.5" vectorEffect="non-scaling-stroke" />
      <line x1="7.8" y1="12" x2="16.2" y2="12" vectorEffect="non-scaling-stroke" />
      <line x1="7.8" y1="14.5" x2="13.2" y2="14.5" vectorEffect="non-scaling-stroke" />
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
  // Без реального звуку мітки немає взагалі.
  //
  // Було «Аудіо скоро» на кожній серії — обіцянка без дати, яку видно на
  // головній сторінці. Аудіо в розробці, коли воно зʼявиться — невідомо, і
  // казати «скоро» тим часом означає обіцяти те, чого не можемо виконати.
  if (!hasAudio) return null

  const color = GOLD
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
      Аудіо доступно
    </span>
  )
}

export { GOLD_SOFT }
