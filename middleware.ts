import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/admin/login'

  const session = request.cookies.get('admin_session')?.value
  const isAuthed = !!session && session === process.env.ADMIN_PASSWORD

  if (!isAuthed && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (isAuthed && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/stories', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
