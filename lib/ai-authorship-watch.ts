import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { runStyleCheck, runStyleCheckGemini, textHash, STYLE_MODEL } from '@/lib/ai-style-check'
import { AI_DOUBT, ensureGeminiTable } from '@/lib/ai-style-gemini'

/**
 * Автоматичний нагляд за ШІ-авторством (рішення Богдана 17.11.2026, п. 8.11 договору v8.8).
 *
 *  1) Звичайні твори (таблиця content) — свіжі, опубліковані або затримані до перевірки:
 *     перевіряє Claude; якщо ≥ AI_DOUBT — ще й Gemini.
 *  2) Конкурсні заявки перевіряють уже наявні cron (contest-style, contest-style-gemini).
 *  3) Тут — лише лист на nazar@balabony.com, коли ОБИДВІ системи ≥ AI_DOUBT.
 *     Один лист на твір (таблиця ai_authorship_alerts), без повторів.
 *
 * Лист автору НЕ надсилається автоматично: це рішення людини (п. 8.11, 14 днів).
 */

const TO = 'nazar@balabony.com'
const SITE = 'https://balabony.com'
const WINDOW_DAYS = 14   // перевіряємо лише твори за останні 14 днів, архів не чіпаємо

function esc(v: string): string {
  return (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

let ready = false
async function ensureAlertsTable() {
  if (ready) return
  await dbQuery(`create table if not exists ai_authorship_alerts (
    source text not null,
    source_id text not null,
    sent_at timestamptz not null default now(),
    primary key (source, source_id)
  )`)
  await dbQuery(`alter table ai_authorship_alerts enable row level security`)
  ready = true
}

type Row = { id: string; title: string; genre: string | null; text: string }

/** Крок 1: перевірити свіжі звичайні твори, яких ще не перевіряли. */
async function checkContent(started: number, budgetMs: number): Promise<string[]> {
  await ensureGeminiTable()
  const done: string[] = []
  const r = await dbQuery(
    `select c.id::text as id, c.title, c.genre, c.text
       from content c
      where c.author_id is not null
        and c.status::text in ('published', 'review', 'pending', 'moderation')
        and length(coalesce(c.text, '')) > 800
        and coalesce(c.published_at, c.created_at) > now() - ($1 || ' days')::interval
        and not exists (select 1 from ai_style_checks s where s.source = 'content' and s.source_id = c.id::text)
      order by coalesce(c.published_at, c.created_at) desc
      limit 5`,
    [String(WINDOW_DAYS)],
  )
  for (const w of r.rows as Row[]) {
    if (Date.now() - started > budgetMs - 150_000 && done.length > 0) break
    try {
      const words = w.text.split(/\s+/).filter(Boolean).length
      if (words < 150) continue
      const hash = textHash(w.text, null)
      // Claude (кеш за текстом: платимо раз)
      const prev = await dbQuery(`select stats, result, model, words from ai_style_checks where text_hash = $1 order by created_at desc limit 1`, [hash])
      let idx: number
      if (prev.rows[0]) {
        const p = prev.rows[0] as { stats: unknown; result: { index?: number }; model: string; words: number }
        await dbQuery(
          `insert into ai_style_checks (source, source_id, title, text_hash, words, stats, result, model)
           values ('content', $1, $2, $3, $4, $5, $6, $7)`,
          [w.id, w.title, hash, p.words, JSON.stringify(p.stats), JSON.stringify(p.result), p.model],
        )
        idx = Number(p.result?.index ?? 0)
      } else {
        const { stats, result } = await runStyleCheck({ title: w.title, genre: w.genre ?? '', text: w.text, answers: null })
        await dbQuery(
          `insert into ai_style_checks (source, source_id, title, text_hash, words, stats, result, model)
           values ('content', $1, $2, $3, $4, $5, $6, $7)`,
          [w.id, w.title, hash, stats.words, JSON.stringify(stats), JSON.stringify(result), STYLE_MODEL],
        )
        idx = Number(result.index ?? 0)
      }
      done.push(`«${w.title}»: Claude ${idx}/100`)
      if (idx < AI_DOUBT) continue
      // Друга думка Gemini — лише при сумніві
      const g = await dbQuery(`select 1 from ai_style_checks_gemini where text_hash = $1 limit 1`, [hash])
      if (!g.rows[0]) {
        const out = await runStyleCheckGemini({ title: w.title, genre: w.genre ?? '', text: w.text, answers: null })
        await dbQuery(
          `insert into ai_style_checks_gemini (source, source_id, title, text_hash, words, stats, result, model)
           values ('content', $1, $2, $3, $4, $5, $6, $7)`,
          [w.id, w.title, hash, out.stats.words, JSON.stringify(out.stats), JSON.stringify(out.result), out.model],
        )
        done.push(`«${w.title}»: Gemini ${Number(out.result.index ?? 0)}/100`)
      }
    } catch (err) {
      console.error('[ai-watch content]', w.id, (err as Error)?.message)
    }
  }
  return done
}

type Hit = { source: 'contest' | 'content'; id: string; title: string; author: string; email: string; claude: number; gemini: number }

/** Крок 3: твори, де обидві системи ≥ AI_DOUBT і лист ще не слали. */
async function findHits(): Promise<Hit[]> {
  const hits: Hit[] = []
  // Конкурсні заявки (лише не відхилені)
  const c = await dbQuery(
    `with cl as (
       select distinct on (source_id) source_id, (result->>'index')::int as idx
         from ai_style_checks where source = 'contest' order by source_id, created_at desc),
     ge as (
       select distinct on (source_id) source_id, (result->>'index')::int as idx
         from ai_style_checks_gemini order by source_id, created_at desc)
     select e.id::text as id, e.title, coalesce(e.author_name, '') as author, coalesce(e.email, '') as email,
            cl.idx as claude, ge.idx as gemini
       from contest_entries e
       join cl on cl.source_id = e.id::text
       join ge on ge.source_id = e.id::text
      where e.status <> 'rejected' and cl.idx >= $1 and ge.idx >= $1
        and e.created_at > now() - ($2 || ' days')::interval
        and not exists (select 1 from ai_authorship_alerts a where a.source = 'contest' and a.source_id = e.id::text)`,
    [AI_DOUBT, String(WINDOW_DAYS)],
  )
  for (const x of c.rows as Omit<Hit, 'source'>[]) hits.push({ source: 'contest', ...x })
  // Звичайні твори
  const w = await dbQuery(
    `with cl as (
       select distinct on (source_id) source_id, (result->>'index')::int as idx
         from ai_style_checks where source = 'content' order by source_id, created_at desc),
     ge as (
       select distinct on (source_id) source_id, (result->>'index')::int as idx
         from ai_style_checks_gemini where source = 'content' order by source_id, created_at desc)
     select c.id::text as id, c.title, coalesce(c.author_name, '') as author, coalesce(u.email, '') as email,
            cl.idx as claude, ge.idx as gemini
       from content c
       join cl on cl.source_id = c.id::text
       join ge on ge.source_id = c.id::text
       left join auth.users u on u.id = c.author_id
      where cl.idx >= $1 and ge.idx >= $1
        and not exists (select 1 from ai_authorship_alerts a where a.source = 'content' and a.source_id = c.id::text)`,
    [AI_DOUBT],
  )
  for (const x of w.rows as Omit<Hit, 'source'>[]) hits.push({ source: 'content', ...x })
  return hits
}

async function sendAlert(h: Hit): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false
  const link = h.source === 'contest' ? `${SITE}/admin/ocinka-shi` : `${SITE}/admin/content/stories/${esc(h.id)}/edit`
  const html = `
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:24px;max-width:640px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:14px;padding:22px;border:1px solid rgba(239,159,39,.5);">
    <div style="font-size:13px;color:#ef9f27;margin-bottom:6px;">Підозра на ШІ: обидві системи 50+ (п. 8.11)</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:12px;">«${esc(h.title)}»</div>
    <p style="color:#c8d4e8;margin:0 0 6px;"><b>Автор:</b> ${esc(h.author || '—')}${h.email ? ` · ${esc(h.email)}` : ''}</p>
    <p style="color:#c8d4e8;margin:0 0 6px;"><b>Ознаки ШІ:</b> Claude ${h.claude}/100 · Gemini ${h.gemini}/100</p>
    <p style="color:#ffb4a8;margin:10px 0 0;">Підстава написати автору: 14 днів, щоб переписати твір або підтвердити авторство. Автоматично автору нічого не надсилалось.</p>
    <a href="${link}" style="display:inline-block;margin-top:12px;background:#ef9f27;color:#0a1628;padding:12px 18px;border-radius:8px;font-weight:700;text-decoration:none;">Відкрити</a>
  </div>
</body>`
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
      to: TO,
      subject: `[Балабони] Підозра на ШІ: «${h.title.slice(0, 80)}» — ${h.author}`,
      html,
    })
    return true
  } catch (e) {
    console.error('[ai-watch mail]', (e as Error)?.message)
    return false
  }
}

export async function runAiAuthorshipWatch(budgetMs = 240_000): Promise<{ checked: string[]; alerted: string[] }> {
  const started = Date.now()
  await ensureAlertsTable()
  const checked = await checkContent(started, budgetMs)
  const alerted: string[] = []
  for (const h of await findHits()) {
    // Спершу фіксуємо, потім шлемо: краще пропустити лист, ніж слати щогодини.
    const ins = await dbQuery(
      `insert into ai_authorship_alerts (source, source_id) values ($1, $2) on conflict do nothing returning 1`,
      [h.source, h.id],
    )
    if (!ins.rows[0]) continue
    if (await sendAlert(h)) alerted.push(`«${h.title}» (${h.claude}/${h.gemini})`)
  }
  return { checked, alerted }
}
