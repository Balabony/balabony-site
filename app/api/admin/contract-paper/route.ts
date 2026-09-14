import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Позначити договір підписаним НА ПАПЕРІ.
 *
 * НАВІЩО. Частина авторів не має КЕП і не збирається його заводити: вони
 * друкують договір, підписують ручкою і надсилають Укрпоштою. Досі цей шлях
 * ніде не фіксувався — підписаний примірник лежав у шафі, а в базі договір
 * лишався `draft`. Тобто в адмінці, у звітах і в переліку «хто підписав»
 * така людина рахувалася непідписаною.
 *
 * ЧОМУ ОКРЕМИЙ sign_method, А НЕ ПРОСТО status = 'signed'. КЕП і папір
 * доводяться по-різному: перший — сертифікатом, який можна перевірити на
 * порталі ЦЗО, другий — фізичним примірником у шафі. Якщо колись дійде до
 * спору, треба знати, що саме шукати. Колонка sign_method у таблиці вже
 * була, ми лише почали нею користуватися.
 *
 * ЩО ЦЕЙ РОУТ НЕ РОБИТЬ. Він не приймає скан і нічого не завантажує:
 * оригінал зберігається паперовим, і вдавати, ніби в нас є електронна копія,
 * було б гірше, ніж чесний запис «підписано на папері».
 *
 * Дію можна скасувати — якщо натиснули помилково, той самий роут з
 * undo: true повертає договір у попередній стан.
 */

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: { contractId?: string; undo?: boolean }
  try {
    body = await req.json() as { contractId?: string; undo?: boolean }
  } catch {
    return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
  }

  const id = String(body.contractId ?? '')
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Не вказано договір' }, { status: 400 })
  }

  try {
    if (body.undo) {
      // Знімаємо ТІЛЬКИ паперову позначку. Договір, підписаний КЕП, цим
      // роутом зачепити не можна — інакше помилковий клік знищив би
      // підтверджений електронний підпис.
      const r = await dbQuery(
        `update author_contracts
            set status = 'awaiting', signed_at = null, sign_method = null
          where id = $1 and sign_method = 'paper'
          returning number`,
        [id],
      )
      if (!r.rowCount) {
        return NextResponse.json(
          { ok: false, error: 'Цей договір не позначений як підписаний на папері' },
          { status: 409 },
        )
      }
      return NextResponse.json({ ok: true, undone: true })
    }

    // Не чіпаємо вже підписані: якщо КЕП пройшов, паперова позначка зайва
    // і тільки заплутає, чим саме доведено підпис.
    const r = await dbQuery(
      `update author_contracts
          set status = 'signed', signed_at = now(), sign_method = 'paper'
        where id = $1 and status <> 'signed'
        returning number`,
      [id],
    )
    if (!r.rowCount) {
      return NextResponse.json(
        { ok: false, error: 'Договір уже підписаний' },
        { status: 409 },
      )
    }
    return NextResponse.json({ ok: true, number: (r.rows[0] as { number: string }).number })
  } catch (err) {
    console.error('[admin/contract-paper]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти' }, { status: 500 })
  }
}
