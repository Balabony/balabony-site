/**
 * lib/anon-user.ts
 *
 * Anonymous user identification via HttpOnly cookie.
 * Used by /api/pick to track which free content a user has chosen
 * without requiring registration.
 *
 * Cookie name: balabony_uid
 * Value: UUID v4
 * Lifespan: 1 year
 * Flags: HttpOnly, Secure (prod), SameSite=Lax, Path=/
 *
 * Why HttpOnly: prevents trivial JS access (DevTools/console).
 * Why Secure: only sent over HTTPS in production.
 * Why SameSite=Lax: prevents CSRF while allowing normal navigation.
 *
 * Usage in Route Handlers (Next.js 16):
 *
 *   import { getOrCreateAnonUserId } from '@/lib/anon-user'
 *
 *   export async function GET() {
 *     const userId = await getOrCreateAnonUserId()
 *     // ... query DB by userId
 *   }
 */

import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const COOKIE_NAME = 'balabony_uid'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 1 year

// Strict UUID v4 validation (length 36, hyphens at fixed positions, valid hex)
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUuid(value: string | undefined): value is string {
  return typeof value === 'string' && UUID_V4_RE.test(value)
}

/**
 * Read the anonymous user_id from cookie, or create + set a new one.
 * Always returns a valid UUID string.
 *
 * Safe to call in Route Handlers and Server Actions.
 * NOT safe to call in pure Server Components that may be prerendered
 * (it sets cookies, which forces dynamic rendering).
 */
export async function getOrCreateAnonUserId(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(COOKIE_NAME)?.value

  if (isValidUuid(existing)) {
    return existing
  }

  // Generate new UUID and set cookie
  const newId = randomUUID()
  cookieStore.set(COOKIE_NAME, newId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  })

  return newId
}

/**
 * Read the anonymous user_id from cookie without creating one.
 * Returns null if the cookie is absent or invalid.
 *
 * Use this when you want to check if the user already has an ID
 * but don't want the side effect of creating one (e.g. read-only paths).
 */
export async function getAnonUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(COOKIE_NAME)?.value
  return isValidUuid(existing) ? existing : null
}

/**
 * Export cookie name for testing / debugging.
 * Do NOT use this to read the cookie directly — use getAnonUserId/getOrCreateAnonUserId.
 */
export const ANON_USER_COOKIE_NAME = COOKIE_NAME
