'use client'

import { useEffect, useState } from 'react'

interface ProtectedEmailProps {
  user: string
  domain: string
  subject?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Захищений email — у HTML видно тільки фрагменти (data-атрибути),
 * боти-краулери не можуть зібрати робочу адресу.
 * На клієнті після hydration збирається повний email і робиться клікабельним.
 *
 * Використання:
 *   <ProtectedEmail user="nazar" domain="balabony.com" />
 *   <ProtectedEmail user="nazar" domain="balabony.com" subject="Заявка автора" />
 */
export default function ProtectedEmail({ user, domain, subject, className, style }: ProtectedEmailProps) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    // Невелика затримка щоб бот, який виконує JS, мав менше шансів встигнути
    const t = setTimeout(() => setRevealed(true), 50)
    return () => clearTimeout(t)
  }, [])

  if (!revealed) {
    // Що бачить бот: розірвані фрагменти, без @ і без .com
    return (
      <span
        className={className}
        style={style}
        data-u={user}
        data-d={domain}
        aria-label="email address (loading)"
      >
        {user}<span style={{ display: 'none' }}>NO-SPAM-PLEASE</span>
        <span aria-hidden="true">&#64;</span>
        {domain}
      </span>
    )
  }

  // Що бачить людина: робочий клікабельний email
  const href = `mailto:${user}@${domain}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`
  return (
    <a href={href} className={className} style={style}>
      {user}@{domain}
    </a>
  )
}
