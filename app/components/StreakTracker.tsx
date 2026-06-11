'use client'

import { useEffect } from 'react'

export default function StreakTracker() {
  useEffect(() => {
    fetch('/api/streak', { method: 'POST' }).catch(() => {})
  }, [])
  return null
}