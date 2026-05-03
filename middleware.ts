import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

export const config = {
  matcher: ['/admin/:path*', '/editor/:path*', '/api/editor/:path*'],
}
