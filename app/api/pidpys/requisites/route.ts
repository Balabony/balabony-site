// 08.11.2026: персональне посилання на підпис (/pidpys/<токен>) — автор без входу в кабінет вписує 4 поля
// (ПІБ, РНОКПП, дата народження, телефон), і договір формується одразу. Решта реквізитів — у кабінеті перед виплатою.
import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { readSignToken } from '@/lib/contract/sign-link'
import { insertContract } from '@/lib/contract/create'

export const dynamic = 'force-dynamic'
const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status })

export async function POST(req: NextRequest) {
  let b: { token?: string; fullName?: string; rnokpp?: string; birthDate?: string; phone?: string; isFop?: boolean }
  try { b = await req.json() } catch { return bad('Невірний запит') }
  const authorId = readSignToken(b.token)
  if (!authorId) return bad('Посилання застаріло. Попросіть у редакції нове.', 401)

  const fullName = String(b.fullName ?? '').trim().replace(/\s+/g, ' ')
  const rnokpp = String(b.rnokpp ?? '').replace(/\D/g, '')
  const birthDate = String(b.birthDate ?? '').trim()
  const phone = String(b.phone ?? '').trim()
  const isFop = b.isFop === true
  if (fullName.split(' ').length < 3) return bad('Впишіть прізвище, імʼя та по батькові повністю — три слова.')
  if (rnokpp.length !== 10) return bad(`РНОКПП — рівно 10 цифр, зараз ${rnokpp.length}.`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || isNaN(new Date(birthDate).getTime())) return bad('Оберіть дату народження.')
  const born = new Date(birthDate)
  if (new Date(born.getFullYear() + 18, born.getMonth(), born.getDate()) > new Date()) return bad('Договір укладається з особами, які досягли 18 років. Напишіть нам — оформимо за згодою батьків.')
  if (phone.replace(/\D/g, '').length < 10) return bad('Впишіть номер телефону повністю, 10 цифр.')

  try {
    const up = await dbQuery(
      `update author_profiles set full_name = $1, rnokpp = $2, birth_date = $3, phone = $4, is_fop = $5,
              revenue_share = $6, requisites_updated_at = now()
        where user_id = $7`,
      [fullName, rnokpp, birthDate, phone, isFop, isFop ? 0.5 : 0.4, authorId],
    )
    if (!up.rowCount) return bad('Профіль автора не знайдено — напишіть у редакцію.', 404)
    const ex = await dbQuery(`select id from author_contracts where author_id = $1 and status <> 'terminated' order by created_at desc limit 1`, [authorId])
    if (ex.rows[0]) {
      await dbQuery(`update author_contracts set rate = $1, is_fop = $2 where id = $3 and status <> 'signed'`, [isFop ? 50 : 40, isFop, ex.rows[0].id])
      return NextResponse.json({ ok: true, contractId: ex.rows[0].id })
    }
    const c = await insertContract(authorId, isFop ? 50 : 40, isFop)
    return NextResponse.json({ ok: true, contractId: c.id })
  } catch (e) {
    console.error('[pidpys/requisites]', e)
    return bad('Помилка на сервері. Спробуйте ще раз або напишіть у редакцію.', 500)
  }
}
