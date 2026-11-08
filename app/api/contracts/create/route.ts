import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { insertContract } from '@/lib/contract/create'

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

// Список мусить збігатися з двома іншими: формою реквізитів
// (app/components/AuthorRequisites.tsx, константа REQUIRED) і сторінкою
// договору (app/author/contract/[id]/page.tsx, масив missing). Поле
// birth_date додали до профілю пізніше за цей обробник, і воно лишилося
// тільки в тих двох. Наслідок був такий: договір ТУТ створювався без дати
// народження, а сторінка договору його не показувала й писала «Договір поки
// не сформовано» — автор бачив створений документ, який неможливо відкрити.
// Дата народження потрібна в самому тексті (п. 6.1-2, повноліття Автора),
// тож вирівнюємо по семи полях, а не навпаки.
// 08.11.2026 (рішення засновника): для підписання — лише особа і звʼязок. Адреса, IBAN і банк — перед першою виплатою (п. vars LATER).
const REQUIRED = ['full_name', 'rnokpp', 'birth_date', 'phone'] as const

const FIELD_LABEL: Record<string, string> = {
  full_name: 'прізвище, імʼя, по батькові',
  rnokpp: 'РНОКПП',
  birth_date: 'дата народження',
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
      `select full_name, rnokpp, birth_date, address, phone, payout_iban, bank_name, is_fop, revenue_share
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

    const { id, number } = await insertContract(user.id, rate, isFop)

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
