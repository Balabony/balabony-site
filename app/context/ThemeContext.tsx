'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Theme = 'night' | 'day'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
  isNight: boolean
  colors: {
    bg: string
    cardBg: string
    fg: string
    muted: string
  }
}

const COLORS = {
  night: { bg: '#0D1B2A', cardBg: '#081420', fg: '#FFFFFF', muted: '#8CA0B8' },
  day:   { bg: '#EEF3F8', cardBg: '#FFFFFF', fg: '#081420', muted: '#5A6A7A' },
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'night', toggle: () => {}, isNight: true, colors: COLORS.night,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('night')

  useEffect(() => {
    const saved = localStorage.getItem('balabony-night')
    if (saved === 'false') setTheme('day')
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'night')
  }, [theme])

  const toggle = () => {
    const next: Theme = theme === 'night' ? 'day' : 'night'
    localStorage.setItem('balabony-night', String(next === 'night'))
    setTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, isNight: theme === 'night', colors: COLORS[theme] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
