import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ============================================
  // 0) Захист API адмінки: 401 JSON (не редирект).
  //    Раніше /api/admin/* не покривався proxy — 18 роутів були відкриті,
  //    включно з генеративними (palили AI-бюджет) і редакційними.
  //    Login/logout — у винятку, щоб можна було заходити.
  // ============================================
  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
      return NextResponse.next()
    }
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession || adminSession !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // ============================================
  // 1) Захист адмінки/редакторів (стара логіка)
  // ============================================
  const isAdminScope =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/editor') ||
    pathname.startsWith('/api/editor')

  if (isAdminScope) {
    // Public paths — no admin auth required
    if (
      pathname === '/admin/login' ||
      pathname.startsWith('/editor') ||
      pathname.startsWith('/api/editor')
    ) {
      return NextResponse.next()
    }

    const session = request.cookies.get('admin_session')?.value
    const isAuthed = !!session && session === process.env.ADMIN_PASSWORD

    if (!isAuthed) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return NextResponse.next()
  }

  // ============================================
  // 2) Оновлення Supabase-сесії на всіх інших шляхах
  // ============================================
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Оновлюємо сесію, якщо вона є
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    // Усе, крім статики, картинок, favicon
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}