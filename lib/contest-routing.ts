// =============================================================================
// АВТОМАТИЧНЕ СКЕРУВАННЯ КОНКУРСНИХ РОБІТ (рішення Богдана 13.10.2026).
//
// Богдан не встигає вручну приймати, нумерувати й призначати. Тепер:
//   1. номер роботи видається одразу при подачі (у межах конкурсу,
//      наскрізно, раз присвоєний — не змінюється);
//   2. робота сама призначається редактору — тому, в кого зараз найменше
//      основних призначень (при рівності — за алфавітом), і редактор
//      отримує лист;
//   3. ручна заміна редактора лишається в «Конкурсних заявках» (редактор
//      вибув або впізнав автора).
//
// Статус заявки ('new' / 'accepted') тут НЕ змінюється: «прийняти» в
// адмінці означає створити чернетки для публікації — це окремий крок.
// =============================================================================

import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { findContest } from '@/lib/contests'

const SITE = 'https://balabony.com'

export async function ensureNumber(entryId: string, contest: string): Promise<number | null> {
  const r = await dbQuery(
    `update contest_entries e
        set entry_number = (select coalesce(max(entry_number), 0) + 1 from contest_entries where contest = $2)
      where e.id::text = $1 and e.entry_number is null
      returning entry_number`,
    [entryId, contest],
  )
  if (r.rowCount) return (r.rows[0] as { entry_number: number }).entry_number
  const cur = await dbQuery(`select entry_number from contest_entries where id::text = $1`, [entryId])
  return (cur.rows[0] as { entry_number: number | null } | undefined)?.entry_number ?? null
}

type Editor = { id: number; name: string; email: string }

/** Призначає основного редактора, якщо його ще немає. Повертає нового редактора або null. */
export async function ensureEditor(entryId: string): Promise<Editor | null> {
  const has = await dbQuery(
    `select 1 from contest_assignments where entry_id::text = $1 and role = 'primary' limit 1`,
    [entryId],
  )
  if (has.rowCount) return null
  const pick = await dbQuery(
    `select ed.id, ed.name, ed.email,
            (select count(*) from contest_assignments a where a.editor_id = ed.id and a.role = 'primary') as load
       from editors ed
      order by load asc, ed.name asc
      limit 1`,
  )
  const ed = pick.rows[0] as Editor | undefined
  if (!ed) return null
  await dbQuery(
    `insert into contest_assignments (entry_id, editor_id, role)
     select e.id, $2, 'primary' from contest_entries e where e.id::text = $1
     on conflict (entry_id) where role = 'primary' do nothing`,
    [entryId, ed.id],
  )
  return ed
}

export async function sendEditorAssignedEmail(p: { to: string; editorName: string; number: number | null; title: string; contest: string }) {
  if (!process.env.RESEND_API_KEY || !p.to) return
  const c = findContest(p.contest)
  const html = `
<!DOCTYPE html>
<html lang="uk">
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px;max-width:600px;margin:0 auto;">
<div style="background:#0f1e3a;border-radius:16px;padding:28px;border:1px solid rgba(240,165,0,0.3);">
  <div style="font-size:22px;font-weight:700;color:#f0a500;margin-bottom:4px;">Balabony</div>
  <div style="font-size:11px;color:#8899bb;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;">Редакція конкурсів</div>
  <p style="color:#c8d4e8;line-height:1.7;">Вітаємо, <strong style="color:#f5f0e8;">${esc(p.editorName)}</strong>!</p>
  <p style="color:#c8d4e8;line-height:1.7;">Вам скеровано нову конкурсну роботу:</p>
  <p style="color:#f5f0e8;line-height:1.7;font-size:16px;"><strong>№ ${p.number ?? '—'} · «${esc(p.title)}»</strong><br><span style="color:#8899bb;">${esc(c?.name ?? p.contest)}</span></p>
  <p style="color:#c8d4e8;line-height:1.7;">Умови конкурсу й інструкція, як оцінювати, — у кабінеті поруч із текстом.</p>
  <a href="${SITE}/editor/login" style="display:block;text-align:center;background:#f0a500;color:#081420;padding:15px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin:20px 0;">Відкрити кабінет редактора</a>
  <p style="font-size:13px;color:#8899bb;line-height:1.6;margin:0;">Введіть свою пошту — посилання для входу прийде листом.</p>
</div>
<p style="font-size:11px;color:#445566;margin-top:18px;text-align:center;">Команда Балабонів</p>
</body>
</html>`
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
      to: p.to,
      subject: `[Балабони] Вам скеровано роботу № ${p.number ?? '—'}`,
      html,
    })
  } catch (e) {
    console.error('[contest-routing] editor mail', (e as Error)?.message)
  }
}

/** Номер + редактор + лист редактору. Безпечно викликати повторно. */
export async function routeEntry(entryId: string): Promise<{ number: number | null; editor: Editor | null }> {
  const r = await dbQuery(`select contest, title from contest_entries where id::text = $1`, [entryId])
  const row = r.rows[0] as { contest: string; title: string } | undefined
  if (!row) return { number: null, editor: null }
  const number = await ensureNumber(entryId, row.contest)
  const editor = await ensureEditor(entryId)
  if (editor) await sendEditorAssignedEmail({ to: editor.email, editorName: editor.name, number, title: row.title, contest: row.contest })
  return { number, editor }
}

function esc(v: string): string {
  return (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
