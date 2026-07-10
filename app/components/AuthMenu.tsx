'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'

export default function AuthMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  if (loading) return null

  if (user) {
    return (
      <a
        href="/profile"
        title={user.email ?? 'Профіль'}
        style={{
          fontSize: 11, fontWeight: 700, padding: '5px 10px',
          border: '1px solid var(--accent-gold)', borderRadius: 8,
          background: 'var(--accent-gold)', color: 'var(--on-gold)',
          textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
          lineHeight: 1, whiteSpace: 'nowrap',
        }}
      >
        Профіль
      </a>
    )
  }

  return (
    <a
      href="/login"
      title="Увійти на Балабони"
      style={{
        fontSize: 11, fontWeight: 700, padding: '5px 10px',
        border: '1px solid var(--accent-gold)', borderRadius: 8,
        background: 'transparent', color: 'var(--accent-gold)',
        textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
        lineHeight: 1, whiteSpace: 'nowrap',
      }}
    >
      Увійти
    </a>
  )
}
