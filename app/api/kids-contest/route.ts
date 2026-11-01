import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { KIDS_CONTEST, AGE_GROUPS, MAX_PER_CHILD, MAX_LINES, MAX_CHARS, contestState, groupLabel } from '@/lib/kids-contest'

/**
 * 01.11.2026: дитячий конкурс «Скоромовка Балабонів» — /api/kids-contest
 *
 * GET  → { user, state, entries } — чи увійшов дорослий, чи йде прийом, його подані скоромовки.
 * POST → подати одну скоромовку. Подає дорослий (батьки / вчитель) після входу.
 *        До 3 скоромовок на одну дитину. Таблиця kids_contest_entries.
 */

export const dynamic = 'force-dynamic'

const NAME_RE = /^[A-Za-zА-Яа-яЇїІіЄєҐґ'’ʼ\-]{2,30}$/

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const state = contestState()
  if (!user) return NextResponse.json({ user: null, state, entries: [] })
  try {
    const r = await dbQuery(
      `select id::text, child_name, child_age, age_group, title, body, status, created_at
         from kids_contest_entries where user_id = $1 and contest = $2 order by created_at desc`,
      [user.id, KIDS_CONTEST.id],
    )
    return NextResponse.json({ user: { email: user.email ?? '' }, state, entries: r.rows })
  } catch (err) {
    console.error('[kids-contest GET]', (err as Error)?.message)
    return NextResponse.json({ user: { email: user.email ?? '' }, state, entries: [] })
  }
}

type Body = {
  role?: string; adultName?: string; school?: string; childName?: string; childAge?: unknown
  ageGroup?: string; city?: string; title?: string; text?: string; consent?: boolean; eduOptin?: boolean
}

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return bad('Спершу увійдіть на Балабони', 401)

  const state = contestState()
  if (state === 'soon') return bad(`Прийом робіт почнеться ${KIDS_CONTEST.startText}`)
  if (state === 'closed') return bad('Прийом робіт завершено')

  let b: Body
  try { b = await req.json() } catch { return bad('Порожній запит') }

  const role = b.role === 'teacher' ? 'teacher' : b.role === 'parent' ? 'parent' : ''
  const adultName = String(b.adultName ?? '').trim().slice(0, 120)
  const school = String(b.school ?? '').trim().slice(0, 200)
  const childName = String(b.childName ?? '').trim()
  const childAge = Number(b.childAge)
  const ageGroup = String(b.ageGroup ?? '')
  const city = String(b.city ?? '').trim().slice(0, 80)
  const title = String(b.title ?? '').trim().slice(0, 120)
  const lines = String(b.text ?? '').replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean)
  const text = lines.join('\n')

  if (!role) return bad('Оберіть, хто подає: батьки чи вчитель')
  if (adultName.length < 3) return bad('Вкажіть ваше ім’я та прізвище')
  if (role === 'teacher' && school.length < 3) return bad('Вкажіть школу і клас')
  if (!NAME_RE.test(childName)) return bad('Ім’я дитини — лише ім’я, одним словом, без прізвища')
  if (!Number.isInteger(childAge) || childAge < 5 || childAge > 18) return bad('Вік дитини — від 5 до 18 років')
  if (!AGE_GROUPS.some((g) => g.id === ageGroup)) return bad('Оберіть вікову групу')
  if (city.length < 2) return bad('Вкажіть місто або село')
  if (!lines.length || text.length < 10) return bad('Напишіть скоромовку')
  if (lines.length > MAX_LINES) return bad(`Скоромовка — до ${MAX_LINES} рядків`)
  if (text.length > MAX_CHARS) return bad(`Скоромовка — до ${MAX_CHARS} знаків`)
  if (b.consent !== true) return bad('Потрібна згода законного представника дитини')

  try {
    const c = await dbQuery(
      `select count(*)::int as n from kids_contest_entries
        where user_id = $1 and contest = $2 and lower(child_name) = lower($3)`,
      [user.id, KIDS_CONTEST.id, childName],
    )
    const n = (c.rows[0] as { n: number } | undefined)?.n ?? 0
    if (n >= MAX_PER_CHILD) return bad(`Від однієї дитини — до ${MAX_PER_CHILD} скоромовок`)
    const dup = await dbQuery(
      `select 1 from kids_contest_entries where contest = $1 and lower(body) = lower($2) limit 1`,
      [KIDS_CONTEST.id, text],
    )
    if (dup.rowCount) return bad('Таку скоромовку вже подано')

    const ins = await dbQuery(
      `insert into kids_contest_entries
         (contest, user_id, email, role, adult_name, school, child_name, child_age, age_group, city, title, body, consent, edu_optin)
       values ($1,$2,$3,$4,$5,nullif($6,''),$7,$8,$9,$10,nullif($11,''),$12,true,$13)
       returning id::text`,
      [KIDS_CONTEST.id, user.id, user.email ?? '', role, adultName, school, childName, childAge, ageGroup, city, title, text, b.eduOptin === true],
    )
    const id = (ins.rows[0] as { id: string } | undefined)?.id ?? ''

    // Сповіщення в Telegram — без прізвищ і пошти.
    const tok = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID
    if (tok && chat) {
      const msg = `🗣 Скоромовка № ${id}\n${childName}, ${childAge} р., ${city} · ${groupLabel(ageGroup)}${role === 'teacher' ? ' · від вчителя' : ''}\n\n${text}`
      await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: msg }),
      }).catch(() => null)
    }
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[kids-contest POST]', (err as Error)?.message)
    return bad('Не вдалося зберегти. Спробуйте ще раз за хвилину.', 500)
  }
}
