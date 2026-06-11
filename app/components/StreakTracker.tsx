'use client'

import { useEffect } from 'react'

// Невидимий компонент. При відкритті серії фіксує «читання сьогодні»
// для стріку. Тихо ігнорує помилки — стрік не критичний для читання.
export default function StreakTracker() {
  useEffect(() => {
    fetch('/api/streak', { method: 'POST' }).catch(() => {})
  }, [])
  return null
}