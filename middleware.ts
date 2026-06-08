import { NextRequest, NextResponse } from 'next/server'

// Централізований захист усіх /api/admin/* роутів.
// Раніше кожен роут мусив перевіряти cookie сам — частина забувала, і 18 роутів
// (включно з генеративними) були відкриті. Тепер перевірка в одному місці й
// автоматично покриває будь-які нові admin-роути.
//
// Виняток: /api/admin/login та /api/admin/logout — мають працювати без сесії.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
    return NextResponse.next()
  }

  const session = req.cookies.get('admin_session')?.value
  if (!session || session !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/admin/:path*'],
}
