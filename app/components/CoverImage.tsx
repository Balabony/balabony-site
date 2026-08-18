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
 */

import Image from 'next/image'
import { useState } from 'react'
import type { CSSProperties } from 'react'

const FALLBACK = '/og-image.jpg'

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
} & (
  | { mode: 'fill';  width?: never;  height?: never }
  | { mode: 'fixed'; width: number;  height: number }
)

export default function CoverImage(props: Props) {
  const { src, alt, className, style, sizes, priority, hideOnError } = props
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
        style={{ objectFit: 'cover', ...style }}
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
