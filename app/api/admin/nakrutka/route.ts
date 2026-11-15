import { NextRequest, NextResponse } from 'next/server'
import { farmingCheck } from '@/lib/contest-reads'

/**
 * Перевірка накрутки для адмінки конкурсів — див. farmingCheck у lib/contest-reads.ts.
 * Окремий маршрут, щоб важкий запит не сповільнював щоразу список заявок:
 * запускається лише кнопкою.
 */

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await farmingCheck()
    return NextResponse.json({ ok: true, rows })
  } catch (err) {
    console.error('[admin/nakrutka]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося виконати перевірку' }, { status: 500 })
  }
}
