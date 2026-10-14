// =============================================================================
// ЩОДЕННИЙ ЛИСТ ПРО НОВІ ТВОРИ (рішення Богдана 14.10.2026: «спрости і автоматизуй»).
//
// Раніше на кожен доданий чи опублікований автором твір ішов окремий лист —
// Тетяна Біденко за пів години додала ~20 творів, і прийшло ~40 листів.
// Тепер — ОДИН лист щоранку (cron pending-check, 10:00 за Києвом): що автори
// додали й що опублікували за минулу добу, згруповано за автором.
// Якщо за добу нічого — листа немає.
// =============================================================================

import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'

const TO = 'nazar@balabony.com'
const SITE = 'https://balabony.com'

type Row = { id: string; title: string | null; author_name: string | null; status: string; published: boolean }

function esc(v: string): string {
  return (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Повертає кількість творів у листі (0 — лист не надсилався). */
export async function sendNewWorksDigest(): Promise<number> {
  if (!process.env.RESEND_API_KEY) return 0
  const r = await dbQuery(
    `select id::text, title, author_name, status::text as status,
            (published_at > now() - interval '24 hours') as published
       from content
      where author_id is not null
        and (created_at > now() - interval '24 hours' or published_at > now() - interval '24 hours')
      order by author_name nulls last, created_at`,
  )
  const rows = r.rows as Row[]
  if (!rows.length) return 0

  const byAuthor = new Map<string, Row[]>()
  for (const w of rows) {
    const k = w.author_name || 'Без імені'
    byAuthor.set(k, [...(byAuthor.get(k) ?? []), w])
  }
  const pub = rows.filter(w => w.published).length

  const blocks = [...byAuthor.entries()].map(([author, list]) => `
    <div style="margin:0 0 16px;">
      <div style="font-weight:700;color:#f5f0e8;margin-bottom:6px;">${esc(author)} — ${list.length}</div>
      ${list.map(w => `<div style="margin:0 0 4px;color:#c8d4e8;">
        ${w.published ? '🟢 опубліковано' : '📝 чернетка'} ·
        <a href="${SITE}/admin/content/stories/${esc(w.id)}/edit" style="color:#ef9f27;">«${esc(w.title ?? 'Без назви')}»</a>
      </div>`).join('')}
    </div>`).join('')

  const html = `
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:24px;max-width:640px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:14px;padding:22px;border:1px solid rgba(239,159,39,.5);">
    <div style="font-size:20px;font-weight:700;margin-bottom:6px;">Нове від авторів за добу</div>
    <p style="color:#8899bb;margin:0 0 18px;">Усього ${rows.length} · опубліковано самими авторами ${pub} — варто, щоб редактор переглянув.</p>
    ${blocks}
    <a href="${SITE}/admin/works" style="display:inline-block;margin-top:8px;background:#ef9f27;color:#0a1628;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Каталог творів</a>
  </div>
</body>`
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
      to: TO,
      subject: `[Балабони] Нове від авторів за добу: ${rows.length} (опубліковано ${pub})`,
      html,
    })
  } catch (e) {
    console.error('[new-works-digest]', (e as Error)?.message)
  }
  return rows.length
}
