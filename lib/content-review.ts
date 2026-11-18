// =============================================================================
// ТВОРИ, ЗАТРИМАНІ ДО ПЕРЕВІРКИ → РЕДАКТОРИ (рішення Богдана 18.11.2026: «все розподіляй на редакторів»,
// «редактори вирішують самі»).
//
// Твір, який автор хотів опублікувати сам, але система затримала (перші 3 твори нового автора,
// ознаки для 18+) — статус content.status = 'review' і запис у content_moderation (outcome = 'review').
// Після перевірки на ШІ (lib/ai-authorship-watch.ts) такий твір сам призначається одному редакторові
// з правом оцінювати — тому, в кого зараз найменше неопрацьованих творів. Редактор вирішує сам:
//   «Опублікувати»        → status = 'published', автору лист;
//   «Повернути автору»    → status = 'draft', автору лист з коментарем редактора.
// Окремого статусу «відхилено» в базі немає (enum content_status), тому відмова = повернення в чернетки.
// Якщо автор виправив і подав знову (нова затримка), твір призначається редакторові ще раз.
//
// Тут НЕ розподіляються: твори, де ШІ-модерація дала 'block' (заборонений вміст) — їх вирішує засновник;
// твори, де обидві системи ознак ШІ ≥ 50 — вони чекають на засновника.
// Імені автора редактор не бачить.
// =============================================================================

import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { AI_DOUBT } from '@/lib/ai-style-gemini'

const SITE = 'https://balabony.com'
const TO = 'nazar@balabony.com'

function esc(v: string): string {
  return (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export class ContentDecisionError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export type ContentDecision = 'publish' | 'return'

let ready = false
export async function ensureContentReviewTable(): Promise<void> {
  if (ready) return
  await dbQuery(`create table if not exists content_reviews (
    id bigserial primary key,
    content_id uuid not null unique,
    editor_id integer not null,
    assigned_at timestamptz not null default now(),
    decision text,
    comment text,
    decided_at timestamptz
  )`)
  await dbQuery(`alter table content_reviews enable row level security`)
  ready = true
}

async function mail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !to) return false
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
      to, subject, html, ...(replyTo ? { replyTo } : {}),
    })
    return true
  } catch (e) {
    console.error('[content-review mail]', (e as Error)?.message)
    return false
  }
}

const wrap = (inner: string) => `
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:24px;max-width:640px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:14px;padding:22px;border:1px solid rgba(239,159,39,.5);">${inner}</div>
</body>`

/** Призначає твір редакторові з найменшим навантаженням. Повторно не призначає. */
export async function assignContentToEditor(contentId: string): Promise<{ editor: string } | null> {
  await ensureContentReviewTable()
  const pick = await dbQuery(
    `select ed.id, ed.name, ed.email,
            (select count(*) from content_reviews r where r.editor_id = ed.id and r.decision is null) as load
       from editors ed
      where ed.can_judge
      order by load asc, ed.name asc
      limit 1`,
  )
  const ed = pick.rows[0] as { id: number; name: string; email: string } | undefined
  if (!ed) return null
  const ins = await dbQuery(
    `insert into content_reviews (content_id, editor_id) values ($1, $2)
     on conflict (content_id) do update
        set editor_id = excluded.editor_id, assigned_at = now(), decision = null, comment = null, decided_at = null
      where content_reviews.decision is not null
     returning id`,
    [contentId, ed.id],
  )
  if (!ins.rowCount) return null
  const c = await dbQuery(
    `select title, genre, array_length(regexp_split_to_array(trim(coalesce(text,'')), '\\s+'), 1) as words from content where id = $1`,
    [contentId],
  )
  const w = c.rows[0] as { title: string | null; genre: string | null; words: number | null } | undefined
  const title = w?.title ?? 'Без назви'
  await mail(ed.email, `[Балабони] Твір на перевірку: «${title.slice(0, 80)}»`, wrap(`
    <p style="color:#c8d4e8;line-height:1.7;">Вітаємо, <strong style="color:#f5f0e8;">${esc(ed.name)}</strong>!</p>
    <p style="color:#c8d4e8;line-height:1.7;">Вам скеровано твір, який автор хотів опублікувати, але його затримано до перевірки редактором:</p>
    <p style="color:#f5f0e8;font-size:16px;line-height:1.7;"><strong>«${esc(title)}»</strong><br><span style="color:#8899bb;">${esc(w?.genre ?? '')}${w?.genre ? ' · ' : ''}${w?.words ?? '—'} слів</span></p>
    <p style="color:#c8d4e8;line-height:1.7;">Прочитайте й вирішіть: опублікувати чи повернути автору з коментарем. Рішення остаточне, автор одразу отримає лист.</p>
    <a href="${SITE}/editor/tvir/${esc(contentId)}" style="display:block;text-align:center;background:#f0a500;color:#081420;padding:15px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin:20px 0;">Відкрити твір</a>
    <p style="font-size:13px;color:#8899bb;line-height:1.6;margin:0;">Якщо попросить увійти — введіть свою пошту, посилання для входу прийде листом.</p>`))
  return { editor: ed.name }
}

/** Рішення редактора. Помилки — ContentDecisionError. */
export async function decideContent(p: {
  contentId: string; editorId: number; editorName: string; decision: ContentDecision; comment: string
}): Promise<{ status: 'published' | 'draft'; authorMailed: boolean }> {
  await ensureContentReviewTable()
  const rv = await dbQuery(
    `select id from content_reviews where content_id = $1 and editor_id = $2 and decision is null`,
    [p.contentId, p.editorId],
  )
  if (!rv.rowCount) throw new ContentDecisionError('Твір вам не призначено або рішення вже ухвалено', 403)

  const c = await dbQuery(
    `select c.title, c.author_name, c.status::text as status, u.email
       from content c left join auth.users u on u.id = c.author_id
      where c.id = $1`,
    [p.contentId],
  )
  const row = c.rows[0] as { title: string | null; author_name: string | null; status: string; email: string | null } | undefined
  if (!row) throw new ContentDecisionError('Твір не знайдено', 404)
  if (row.status !== 'review') throw new ContentDecisionError('Цей твір уже не на перевірці (його вже опрацювала редакція)', 409)

  const next = p.decision === 'publish' ? 'published' : 'draft'
  const upd = await dbQuery(
    `update content set status = $2::content_status where id = $1 and status::text = 'review' returning id`,
    [p.contentId, next],
  )
  if (!upd.rowCount) throw new ContentDecisionError('Цей твір уже не на перевірці', 409)
  await dbQuery(
    `update content_reviews set decision = $2, comment = nullif($3,''), decided_at = now() where content_id = $1`,
    [p.contentId, p.decision, p.comment],
  )
  try {
    await dbQuery(`update content_moderation set outcome = $2 where content_id = $1`, [p.contentId, p.decision === 'publish' ? 'published' : 'returned'])
  } catch (e) { console.error('[content-review moderation outcome]', (e as Error)?.message) }

  const title = row.title ?? 'Без назви'
  const hello = row.author_name ? `Вітаємо, ${esc(row.author_name)}!` : 'Вітаємо!'
  const note = p.comment ? `<p style="color:#c8d4e8;line-height:1.7;"><b>Коментар редактора:</b><br><span style="white-space:pre-wrap;">${esc(p.comment)}</span></p>` : ''
  const authorHtml = wrap(p.decision === 'publish'
    ? `<div style="font-size:22px;font-weight:700;color:#f0a500;margin-bottom:12px;">Балабони</div>
       <p style="color:#c8d4e8;line-height:1.7;">${hello}</p>
       <p style="color:#c8d4e8;line-height:1.7;">Редактор перевірив ваш твір <strong style="color:#ef9f27;">«${esc(title)}»</strong> і опублікував його. Дякуємо!</p>${note}
       <p style="color:#c8d4e8;line-height:1.7;">Ваш кабінет: <a href="${SITE}/author/dashboard" style="color:#ef9f27;">${SITE}/author/dashboard</a></p>
       <p style="font-size:12px;color:#8899bb;margin:16px 0 0;">Редакція Балабонів</p>`
    : `<div style="font-size:22px;font-weight:700;color:#f0a500;margin-bottom:12px;">Балабони</div>
       <p style="color:#c8d4e8;line-height:1.7;">${hello}</p>
       <p style="color:#c8d4e8;line-height:1.7;">Редактор перевірив ваш твір <strong style="color:#ef9f27;">«${esc(title)}»</strong> і повернув його на доопрацювання. Твір повернувся до ваших чернеток.</p>${note}
       <p style="color:#c8d4e8;line-height:1.7;">Виправте текст у кабінеті й натисніть «Опублікувати» ще раз: <a href="${SITE}/author/dashboard" style="color:#ef9f27;">${SITE}/author/dashboard</a></p>
       <p style="font-size:12px;color:#8899bb;margin:16px 0 0;">Редакція Балабонів</p>`)
  const authorMailed = row.email
    ? await mail(row.email, p.decision === 'publish' ? `Балабони: твір «${title.slice(0, 80)}» опубліковано` : `Балабони: твір «${title.slice(0, 80)}» повернуто на доопрацювання`, authorHtml, TO)
    : false

  await mail(TO, `[Балабони] ${p.editorName}: «${title.slice(0, 80)}» — ${p.decision === 'publish' ? 'опубліковано' : 'повернуто автору'}`, wrap(`
    <p style="color:#c8d4e8;line-height:1.7;">Редактор <strong style="color:#f5f0e8;">${esc(p.editorName)}</strong> ухвалив рішення щодо твору «${esc(title)}»:</p>
    <p style="color:#ef9f27;font-size:17px;font-weight:700;">${p.decision === 'publish' ? 'ОПУБЛІКОВАНО' : 'ПОВЕРНУТО АВТОРУ'}${authorMailed ? '' : ' (лист автору не надіслано: немає пошти)'}</p>
    ${note}
    <a href="${SITE}/admin/content/stories/${esc(p.contentId)}/edit" style="display:inline-block;margin-top:8px;color:#ef9f27;">Відкрити твір</a>`))
  return { status: next, authorMailed }
}

/** Умова «перевірку ШІ пройдено, тримати для засновника не треба» — для вибірки в cron. */
export const CONTENT_ASSIGN_SQL = `
  with cl as (
    select distinct on (source_id) source_id, (result->>'index')::int as idx
      from ai_style_checks where source = 'content' order by source_id, created_at desc),
  ge as (
    select distinct on (source_id) source_id, (result->>'index')::int as idx
      from ai_style_checks_gemini where source = 'content' order by source_id, created_at desc)
  select c.id::text as id, c.title
    from content c
    join content_moderation m on m.content_id = c.id
    left join cl on cl.source_id = c.id::text
    left join ge on ge.source_id = c.id::text
   where c.status::text = 'review'
     and m.outcome = 'review'
     and m.verdict <> 'block'
     and not exists (select 1 from content_reviews r where r.content_id = c.id and (r.decision is null or r.decided_at >= m.checked_at))
     and (
           (cl.idx is not null and (cl.idx < $1 or ge.idx < $1))
        or (cl.idx is null and (length(coalesce(c.text, '')) <= 800 or m.checked_at < now() - interval '6 hours'))
     )
   order by m.checked_at
   limit 10`

export async function assignCheckedContent(): Promise<string[]> {
  await ensureContentReviewTable()
  const out: string[] = []
  const r = await dbQuery(CONTENT_ASSIGN_SQL, [AI_DOUBT])
  for (const x of r.rows as { id: string; title: string }[]) {
    try {
      const a = await assignContentToEditor(x.id)
      if (a) out.push(`твір «${x.title}» → ${a.editor}`)
    } catch (err) {
      console.error('[content-review assign]', x.id, (err as Error)?.message)
    }
  }
  return out
}
