import { NextRequest, NextResponse } from 'next/server'

/**
 * Захист адмінських сторінок.
 *
 * До цього перевірка стояла лише на API-роутах: сторінки /admin/* відкривалися
 * будь-кому, хто знав адресу. Даних вони не показували (роути віддавали 403),
 * але всі форми — заведення авторів, редагування серій, імпорт — були видні.
 *
 * Тут перевіряється та сама cookie, що й у роутах: admin_session === ADMIN_PASSWORD.
 * Порівняння посимвольне з фіксованим часом, щоб не підказувати пароль
 * різницею у швидкості відповіді.
 */

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Сторінка входу має лишатися доступною, інакше зайти буде нікуди.
  if (pathname === '/admin/login') return NextResponse.next()

  const expected = process.env.ADMIN_PASSWORD ?? ''
  const got = req.cookies.get('admin_session')?.value ?? ''

  if (expected && got && safeEqual(got, expected)) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search = `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*'],
}
