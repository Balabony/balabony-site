import type { NextResponse } from 'next/server'

/**
 * Позначка «щойно створено акаунт» для конверсії «Реєстрація читача».
 * Сервер не знає джерела сесії, тому ставимо коротку cookie, а AnalyticsTracker
 * у браузері її бачить, шле подію reiestratsiia (GA4 + conversion_events) і стирає.
 * Новим вважаємо акаунт, створений не раніше ніж 15 хвилин тому.
 */
export function markIfNewAccount(res: NextResponse, createdAt: string | undefined | null): NextResponse {
  try {
    if (!createdAt) return res
    const age = Date.now() - new Date(createdAt).getTime()
    if (age >= 0 && age < 15 * 60 * 1000) {
      res.cookies.set('bly_new_reg', '1', { path: '/', maxAge: 600, sameSite: 'lax', secure: true, httpOnly: false })
    }
  } catch { /* не ламаємо вхід */ }
  return res
}
