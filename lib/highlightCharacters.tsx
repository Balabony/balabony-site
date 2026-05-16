// lib/highlightCharacters.tsx
// Виділяє ім'я персонажа золотим жирним у форматі "Ім'я: текст репліки".
// Робота тільки з початком абзацу — не чіпає згадки імен всередині речень.
//
// Використання:
//   import { highlightCharacters } from '@/lib/highlightCharacters'
//   <p>{highlightCharacters(paragraphText)}</p>

import React from 'react'
import { CHARACTER_REGEX } from './characters'

const GOLD = '#f5a623' // той самий accent-gold що в ReaderSection

export function highlightCharacters(paragraph: string): React.ReactNode {
  if (!paragraph) return paragraph

  const match = paragraph.match(CHARACTER_REGEX)
  if (!match) {
    // Це звичайний абзац без репліки — повертаємо як є
    return paragraph
  }

  const name = match[1] // ім'я персонажа
  const rest = paragraph.slice(match[0].length) // все що після "Ім'я:"

  return (
    <>
      <span
        style={{
          color: GOLD,
          fontWeight: 700,
        }}
      >
        {name}:
      </span>
      {rest}
    </>
  )
}
