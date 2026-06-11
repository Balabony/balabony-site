'use client'

import { useEffect } from 'react'

export default function ReadTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return
    fetch('/api/reads', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ slug }),
    }).catch(() => {})
  }, [slug])
  return null
}
