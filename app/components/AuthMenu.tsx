'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'

/**
 * Кнопка входу/акаунта в шапці.
 *
 * Раніше після входу тут завжди писало «Профіль» і вело на /profile. Для
 * читача це правильно, а для автора — зайвий крок: він шукає слово «кабінет»,
 * бачить «Профіль», не тисне і вважає, що кабінету немає. Саме про це написала
 * авторка, у якої вхід насправді спрацював.
 *
 * Тепер, якщо в людини є активний профіль автора, кнопка веде прямо в кабінет
 * і називається відповідно. Читача це не зачіпає.
 *
 * Перевірка йде з браузера під сесією користувача — політика
 * «author reads own profile» (auth.uid() = user_id) це дозволяє. Помилку
 * ковтаємо: не змогли з'ясувати — поводимось як раніше.
 */
export default function AuthMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    let cancelled = false

    async function checkAuthor(u: User | null) {
      if (!u) {
        if (!cancelled) setIsAuthor(false)
        return
      }
      // Питаємо сервер, а не таблицю з браузера. Клієнтський запит залежав від
      // того, чи встигла сесія долетіти до політики доступу, і коли не встигав,
      // автор бачив «Профіль». Помилка при цьому ковталася, тож збій виглядав
      // як випадковість: учора заходило, сьогодні ні.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch('/api/author/whoami', { cache: 'no-store' })
          if (!res.ok) throw new Error(String(res.status))
          const data = (await res.json()) as { isAuthor?: boolean }
          if (!cancelled) setIsAuthor(Boolean(data.isAuthor))
          return
        } catch {
          // Перша невдача — почекати й спробувати ще раз. Друга — лишити як є:
          // краще кнопка без змін, ніж автора мовчки відправити в читацький профіль.
          if (attempt === 0) await new Promise((r) => setTimeout(r, 700))
        }
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      setUser(data.user)
      setLoading(false)
      void checkAuthor(data.user)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      const next = session?.user ?? null
      setUser(next)
      void checkAuthor(next)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return null

  const base = {
    fontSize: 11,
    fontWeight: 700,
    padding: '5px 10px',
    border: '1px solid var(--accent-gold)',
    borderRadius: 8,
    textDecoration: 'none',
    fontFamily: "'Montserrat', sans-serif",
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
  }

  if (user) {
    const href  = isAuthor ? '/author/dashboard' : '/profile'
    const label = isAuthor ? 'Кабінет автора' : 'Профіль'
    return (
      <a
        href={href}
        title={user.email ?? label}
        style={{ ...base, background: 'var(--accent-gold)', color: 'var(--on-gold)' }}
      >
        {label}
      </a>
    )
  }

  return (
    <a
      href="/login"
      title="Увійти на Балабони"
      style={{ ...base, background: 'transparent', color: 'var(--accent-gold)' }}
    >
      Увійти
    </a>
  )
}
