import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Створення авторського договору з кабінету.
 * Договір формується лише коли заповнені реквізити — інакше в тексті
 * будуть пропуски замість ПІБ та рахунку.
 *
 * Номер: 2026/001, 2026/002 … — наскрізна нумерація в межах року.
 * doc_url веде на сторінку договору, де текст підставлено даними автора.
 *
 * ВАЖЛИВО: увесь обробник загорнуто в try/catch. Раніше будь-яка помилка бази
 * віддавала HTML-сторінку 500, клієнт не міг її розібрати і показував автору
 * «Немає звʼязку» — хоча звʼязок був, а падала база. Тепер помилка завжди
 * повертається JSON-ом і пишеться в лог Vercel.
 */

const REQUIRED = ['full_name', 'rnokpp', 'address', 'phone', 'payout_iban', 'bank_name'] as const

const FIELD_LABEL: Record<string, string> = {
  full_name: 'прізвище, імʼя, по батькові',
  rnokpp: 'РНОКПП',
  address: 'адреса',
  phone: 'телефон',
  payout_iban: 'IBAN',
  bank_name: 'назва банку',
}

function fail(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...extra }, { status })
}

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fail('Потрібно увійти', 401)

    const p = await dbQuery(
      `select full_name, rnokpp, address, phone, payout_iban, bank_name, is_fop, revenue_share
         from author_profiles where user_id = $1 limit 1`,
      [user.id],
    )
    const prof = p.rows[0] as Record<string, string | number | boolean | null> | undefined
    if (!prof) return fail('Профіль не знайдено', 404)

    const missing = REQUIRED.filter(f => !String(prof[f] ?? '').trim())
    if (missing.length > 0) {
      return fail(
        `Спершу заповніть реквізити вище — бракує: ${missing.map(f => FIELD_LABEL[f] ?? f).join(', ')}`,
        400,
        { missing },
      )
    }

    const existing = await dbQuery(
      `select id from author_contracts where author_id = $1 and status <> 'terminated' limit 1`,
      [user.id],
    )
    if (existing.rowCount && existing.rowCount > 0) {
      // Договір уже є (наприклад, попередній клік усе-таки спрацював).
      // Це не помилка — віддаємо ok, клієнт просто перезавантажить сторінку.
      return NextResponse.json({ ok: true, id: existing.rows[0].id, existed: true })
    }

    const isFop = prof.is_fop === true
    // У профілі ставка лежить часткою (0.5 / 0.4), у договорі друкується відсотком.
    const shareFrac = prof.revenue_share == null ? (isFop ? 0.5 : 0.4) : Number(prof.revenue_share)
    const rate = Math.round(shareFrac * 100)

    const year = new Date().getFullYear()

    // Номер рахуємо за НАЙБІЛЬШИМ уже виданим, а не за кількістю договорів.
    // Кількість бреше, щойно хоч один договір видалили: лишився 2026/002,
    // count = 1, наступний номер вийшов би знову 2026/002 — і унікальний
    // індекс валив запит із помилкою 500. Саме через це договір не формувався.
    // Плюс до п'яти спроб: якщо два автори тиснуть кнопку водночас, другий
    // просто візьме наступний вільний номер, а не впаде.
    const insertWithNumber = async (): Promise<{ id: string; number: string }> => {
      let lastErr: unknown = null

      for (let attempt = 0; attempt < 5; attempt++) {
        const seq = await dbQuery(
          `select coalesce(max(nullif(regexp_replace(number, '^[0-9]+/', ''), '')::int), 0) as n
             from author_contracts
            where number ~ ('^' || $1 || '/[0-9]+$')`,
          [String(year)],
        )
        const n = ((seq.rows[0]?.n as number | undefined) ?? 0) + 1 + attempt
        const number = `${year}/${String(n).padStart(3, '0')}`

        try {
          const created = await dbQuery(
            `insert into author_contracts (author_id, number, status, rate, is_fop, created_at)
             values ($1, $2, 'draft', $3, $4, now())
             returning id`,
            [user.id, number, rate, isFop],
          )
          return { id: created.rows[0].id as string, number }
        } catch (e) {
          const err = e as { code?: string }
          // 23505 — порушення унікальності. Номер зайняли, беремо наступний.
          if (err?.code !== '23505') throw e
          lastErr = e
        }
      }

      throw lastErr ?? new Error('Не вдалося підібрати вільний номер договору')
    }

    const { id, number } = await insertWithNumber()

    await dbQuery(`update author_contracts set doc_url = $1 where id = $2`, [`/author/contract/${id}`, id])

    return NextResponse.json({ ok: true, id, number })
  } catch (e) {
    const err = e as { message?: string; code?: string; detail?: string }
    // Лог у Vercel → Logs, повний текст помилки бази
    console.error('[contracts/create]', err?.code, err?.message, err?.detail)
    return fail(
      'Помилка на сервері під час формування договору. Редакція вже бачить її в журналі — ми полагодимо і повідомимо вам.',
      500,
      { code: err?.code ?? null, detail: err?.message ?? null },
    )
  }
}
