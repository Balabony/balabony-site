import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { getEditorByToken, EDITOR_COOKIE } from '@/lib/editor-auth'

/**
 * Збереження редакційної оцінки.
 *
 * ШІСТЬ КРИТЕРІЇВ, разом 50 балів. Ваги різні навмисно: слабка мова псує
 * весь текст, слабкий гачок — лише перший абзац.
 *   сюжет 12, мова 12, характери 8, композиція 8, фінал 6, гачок 4.
 *
 * КОМЕНТАР ОБОВ'ЯЗКОВИЙ, від 150 символів. Не для автора, а для протоколу:
 * підсумки підписують усі редактори, і кожен має бачити не лише чуже
 * число, а й чому воно таке.
 *
 * ПІСЛЯ ПОДАННЯ ПРАВИТИ НЕ МОЖНА. Це не UX-забаганка: оцінка входить у
 * підсумок, і можливість тихо її переписати після того, як стали відомі
 * дочитування, знецінила б увесь конкурс.
 *
 * СУМА НЕ ПРИХОДИТЬ ІЗ БРАУЗЕРА — колонка total рахується в базі як
 * generated always. Так її неможливо розійти з балами.
 */

export const dynamic = 'force-dynamic'

const FIELDS = [
  { key: 'plot',       max: 12 },
  { key: 'language',   max: 12 },
  { key: 'characters', max: 8 },
  { key: 'structure',  max: 8 },
  { key: 'ending',     max: 6 },
  { key: 'hook',       max: 4 },
] as const

export async function POST(req: NextRequest) {
  const editor = await getEditorByToken(req.cookies.get(EDITOR_COOKIE)?.value)
  if (!editor) {
    return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const entryId = String(body.entryId ?? '').trim()
  const action = String(body.action ?? '')
  const comment = String(body.comment ?? '').trim()

  if (!entryId) {
    return NextResponse.json({ ok: false, error: 'Не вказано роботу' }, { status: 400 })
  }
  if (action !== 'draft' && action !== 'submit') {
    return NextResponse.json({ ok: false, error: 'Невідома дія' }, { status: 400 })
  }

  // Оцінювати можна лише призначену тобі роботу.
  const assigned = await dbQuery(
    `select 1 from contest_assignments where entry_id = $1 and editor_id = $2 limit 1`,
    [entryId, editor.id],
  )
  if (!assigned.rowCount) {
    return NextResponse.json({ ok: false, error: 'Ця робота вам не призначена' }, { status: 403 })
  }

  // Уже подану оцінку не чіпаємо.
  const existing = await dbQuery(
    `select status from contest_scores where entry_id = $1 and editor_id = $2 limit 1`,
    [entryId, editor.id],
  )
  if (existing.rowCount && (existing.rows[0] as { status: string }).status === 'submitted') {
    return NextResponse.json(
      { ok: false, error: 'Оцінку вже подано, змінити її не можна' },
      { status: 409 },
    )
  }

  const values: number[] = []
  for (const f of FIELDS) {
    const raw = body[f.key]
    const n = Number(raw)
    if (!Number.isInteger(n) || n < 0 || n > f.max) {
      return NextResponse.json(
        { ok: false, error: `Бал «${f.key}» має бути цілим числом від 0 до ${f.max}` },
        { status: 400 },
      )
    }
    values.push(n)
  }

  // 150, а не 40: за умовами автор може оскаржити результат протягом десяти
  // днів, і коментар — це те, чим ми обґрунтовуємо бал. «Сюжет примітивний»
  // на сорок символів не обґрунтовує нічого. Поріг один, на загальний
  // коментар, а не на кожен із шести критеріїв — інакше це дев’ять сотень символів
  // на роботу, а редакторка читає двадцять серій на тиждень.
  if (comment.length < 150) {
    return NextResponse.json(
      { ok: false, error: `Коментар обов’язковий — щонайменше 150 символів, зараз ${comment.length}` },
      { status: 400 },
    )
  }

  const status = action === 'submit' ? 'submitted' : 'draft'

  try {
    await dbQuery(
      `insert into contest_scores
         (entry_id, editor_id, plot, language, characters, structure, ending, hook,
          comment, status, submitted_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, case when $10 = 'submitted' then now() end)
       on conflict (entry_id, editor_id) do update
          set plot = excluded.plot,
              language = excluded.language,
              characters = excluded.characters,
              structure = excluded.structure,
              ending = excluded.ending,
              hook = excluded.hook,
              comment = excluded.comment,
              status = excluded.status,
              submitted_at = excluded.submitted_at,
              updated_at = now()`,
      [entryId, editor.id, ...values, comment, status],
    )
    return NextResponse.json({ ok: true, status })
  } catch (err) {
    console.error('[editor/score]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти оцінку' }, { status: 500 })
  }
}
