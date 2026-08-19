'use client'
/**
 * Обкладинка через next/image з запасним варіантом.
 *
 * Навіщо: звичайний <img> тягне файл із Supabase повз кеш Vercel — саме це
 * з'їдало egress. next/image віддає стиснену копію з CDN і робить це один раз
 * на розмір, а не на кожне відкриття сторінки.
 *
 * mode="fill"  — картинка розтягується на батьківський блок.
 *                Батько ОБОВ'ЯЗКОВО має position: relative і задану висоту.
 * mode="fixed" — картинка має власні width/height.
 *
 * focus — точка, довкола якої обрізається картинка в режимі fill.
 *   За замовчуванням '50% 22%': по горизонталі центр, по вертикалі ближче до
 *   верху. Обкладинки в нас вертикальні, а рамки ширші, тому при звичайному
 *   центруванні браузер зрізав однаково зверху й знизу — і голова persona
 *   опинялася за кадром. Зсув угору лишає обличчя, а зрізає порожню землю.
 *   Якщо для якоїсь картки потрібно інакше, передайте своє значення:
 *   focus="50% 50%" — рівно центр, focus="center top" — по верхньому краю.
 */
import Image from 'next/image'
import { useState } from 'react'
import type { CSSProperties } from 'react'

const FALLBACK = '/og-image.jpg'
const DEFAULT_FOCUS = '50% 22%'

type Props = {
  src:          string | null | undefined
  alt:          string
  className?:   string
  style?:       CSSProperties
  /** Підказка браузеру про ширину. Для fill бажано вказати. */
  sizes?:       string
  /** true — перші екранні картинки, вантажаться одразу без ліниво. */
  priority?:    boolean
  /** Замість запасної картинки просто нічого не показувати. */
  hideOnError?: boolean
  /** Точка обрізання для mode="fill". Типово '50% 22%'. */
  focus?:       string
} & (
  | { mode: 'fill';  width?: never;  height?: never }
  | { mode: 'fixed'; width: number;  height: number }
)

export default function CoverImage(props: Props) {
  const { src, alt, className, style, sizes, priority, hideOnError, focus } = props
  const [failed, setFailed] = useState(false)

  if (!src) return null
  if (failed && hideOnError) return null

  const finalSrc = failed ? FALLBACK : src

  if (props.mode === 'fill') {
    return (
      <Image
        src={finalSrc}
        alt={alt}
        fill
        sizes={sizes ?? '(max-width: 768px) 100vw, 400px'}
        priority={priority}
        className={className}
        style={{
          objectFit: 'cover',
          objectPosition: focus ?? DEFAULT_FOCUS,
          ...style,
        }}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <Image
      src={finalSrc}
      alt={alt}
      width={props.width}
      height={props.height}
      sizes={sizes}
      priority={priority}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}
