import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { findContest } from '@/lib/contests'

/**
 * Намір автора взяти участь у конкурсі.
 *
 * НАВІЩО. Стелі учасників у серіальному конкурсі більше немає, і кількість
 * робіт наперед невідома. А кожна серія проходить редактуру перед виходом:
 * двадцять серіалів — це двісті серій за десять тижнів. Треба бачити
 * порядок цифр ЗАРАНІ, а не 25 листопада.
 *
 * ЧОМУ ЧОТИРИ ГАЛОЧКИ, А НЕ ОДНА. Навантаження в конкурсах різне на
 * порядок: серіал — десять серій, «Один день» — одна. Загальне «братиму
 * участь» не переводиться в години роботи, а по конкурсах — переводиться.
 *
 * ЦЕ НЕ ЗАЯВКА І НЕ БРОНЮВАННЯ МІСЦЯ. Галочку можна зняти будь-коли, вона
 * ні до чого не зобов'язує і місця не резервує; подавати все одно треба
 * через /konkursy/podaty. Так і написано в кабінеті — інакше хтось
 * поставить її і чекатиме, що вже записаний.
 *
 * GET  → { intents: string[] } — які галочки стоять у цього автора.
 * POST { contest, on } → ставить або знімає одну галочку.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ intents: [] })

  try {
    const r = await dbQuery(
      `select contest from contest_intents where user_id = $1`,
      [user.id],
    )
    return NextResponse.json({ intents: r.rows.map(x => (x as { contest: string }).contest) })
  } catch (err) {
    console.error('[contest/intent] get', (err as Error)?.message)
    return NextResponse.json({ intents: [] })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
  }

  let body: { contest?: string; on?: boolean }
  try {
    body = await req.json() as { contest?: string; on?: boolean }
  } catch {
    return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
  }

  const contestId = String(body.contest ?? '')
  if (!findContest(contestId)) {
    return NextResponse.json({ ok: false, error: 'Невідомий конкурс' }, { status: 400 })
  }

  try {
    if (body.on) {
      // Повторне натискання нічого не зламає — ключ із двох колонок.
      await dbQuery(
        `insert into contest_intents (user_id, contest)
         values ($1, $2)
         on conflict (user_id, contest) do nothing`,
        [user.id, contestId],
      )
    } else {
      await dbQuery(
        `delete from contest_intents where user_id = $1 and contest = $2`,
        [user.id, contestId],
      )
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contest/intent] post', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти' }, { status: 500 })
  }
}
