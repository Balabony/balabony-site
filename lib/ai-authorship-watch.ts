import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { runStyleCheck, runStyleCheckGemini, textHash, STYLE_MODEL } from '@/lib/ai-style-check'
import { AI_DOUBT, ensureGeminiTable } from '@/lib/ai-style-gemini'
import type { Answers } from '@/lib/author-questions'

/**
 * Автоматичний нагляд за ШІ-авторством (рішення Богдана 17.11.2026, п. 8.11 договору v8.8).
 *
 *  1) Звичайні твори (таблиця content) — свіжі, опубліковані або затримані до перевірки:
 *     перевіряє Claude; якщо ≥ AI_DOUBT — ще й Gemini.
 *  1а) 18.11.2026: заявки авторів (author_applications, статус new) — те саме, з відповідями автора на запитання.
 *  2) Конкурсні заявки перевіряють уже наявні cron (contest-style, contest-style-gemini).
 *  3) Тут — лише лист на nazar@balabony.com, коли ОБИДВІ системи ≥ AI_DOUBT.
 *     Один лист на твір (таблиця ai_authorship_alerts), без повторів.
 *
 * 18.11.2026 (рішення Богдана): коли обидві системи ≥ AI_DOUBT, автору одразу йде лист-попередження
 * (п. 8.11, 14 днів на переписування). Лист — один на твір: його шле лише той запуск, що вперше зафіксував
 * підозру (рядок у ai_authorship_alerts), тож твори, які вже були в підозрі, повторних листів не отримають.
 * Вимкнути автолист без деплою: змінна середовища AI_AUTHOR_LETTER=off (лист Богдану тоді йде як раніше).
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

type AppRow = { id: string; title: string; genre: string | null; body: string; answers: Answers | null }

/** Крок 1а (18.11.2026): нові заявки авторів, яких ще не перевіряли. Та сама логіка, що для творів,
 *  але разом із відповідями автора (як у кнопці «Перевірити стиль (ШІ)» на /admin/zayavky-avtoriv). */
async function checkApplications(started: number, budgetMs: number): Promise<string[]> {
  await ensureGeminiTable()
  const done: string[] = []
  const r = await dbQuery(
    `select a.id::text as id, a.title, a.genre, a.body, a.answers
       from author_applications a
      where a.status = 'new'
        and length(coalesce(a.body, '')) > 800
        and a.created_at > now() - ($1 || ' days')::interval
        and not exists (select 1 from ai_style_checks s where s.source = 'application' and s.source_id = a.id::text)
      order by a.created_at desc
      limit 3`,
    [String(WINDOW_DAYS)],
  )
  for (const w of r.rows as AppRow[]) {
    if (Date.now() - started > budgetMs - 150_000 && done.length > 0) break
    try {
      const words = w.body.split(/\s+/).filter(Boolean).length
      if (words < 150) continue
      const hash = textHash(w.body, w.answers)
      const prev = await dbQuery(`select stats, result, model, words from ai_style_checks where text_hash = $1 order by created_at desc limit 1`, [hash])
      let idx: number
      if (prev.rows[0]) {
        const p = prev.rows[0] as { stats: unknown; result: { index?: number }; model: string; words: number }
        await dbQuery(
          `insert into ai_style_checks (source, source_id, title, text_hash, words, stats, result, model)
           values ('application', $1, $2, $3, $4, $5, $6, $7)`,
          [w.id, w.title, hash, p.words, JSON.stringify(p.stats), JSON.stringify(p.result), p.model],
        )
        idx = Number(p.result?.index ?? 0)
      } else {
        const { stats, result } = await runStyleCheck({ title: w.title, genre: w.genre ?? '', text: w.body, answers: w.answers })
        await dbQuery(
          `insert into ai_style_checks (source, source_id, title, text_hash, words, stats, result, model)
           values ('application', $1, $2, $3, $4, $5, $6, $7)`,
          [w.id, w.title, hash, stats.words, JSON.stringify(stats), JSON.stringify(result), STYLE_MODEL],
        )
        idx = Number(result.index ?? 0)
      }
      done.push(`заявка «${w.title}»: Claude ${idx}/100`)
      if (idx < AI_DOUBT) continue
      const g = await dbQuery(`select 1 from ai_style_checks_gemini where text_hash = $1 limit 1`, [hash])
      if (!g.rows[0]) {
        const out = await runStyleCheckGemini({ title: w.title, genre: w.genre ?? '', text: w.body, answers: w.answers })
        await dbQuery(
          `insert into ai_style_checks_gemini (source, source_id, title, text_hash, words, stats, result, model)
           values ('application', $1, $2, $3, $4, $5, $6, $7)`,
          [w.id, w.title, hash, out.stats.words, JSON.stringify(out.stats), JSON.stringify(out.result), out.model],
        )
        done.push(`заявка «${w.title}»: Gemini ${Number(out.result.index ?? 0)}/100`)
      }
    } catch (err) {
      console.error('[ai-watch application]', w.id, (err as Error)?.message)
    }
  }
  return done
}

type Hit = { source: 'contest' | 'content' | 'application'; id: string; title: string; author: string; email: string; claude: number; gemini: number }

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
  // 18.11.2026: заявки авторів (лише нові, ще не розглянуті)
  const a = await dbQuery(
    `with cl as (
       select distinct on (source_id) source_id, (result->>'index')::int as idx
         from ai_style_checks where source = 'application' order by source_id, created_at desc),
     ge as (
       select distinct on (source_id) source_id, (result->>'index')::int as idx
         from ai_style_checks_gemini where source = 'application' order by source_id, created_at desc)
     select a.id::text as id, a.title, coalesce(a.full_name, '') as author, coalesce(a.email, '') as email,
            cl.idx as claude, ge.idx as gemini
       from author_applications a
       join cl on cl.source_id = a.id::text
       join ge on ge.source_id = a.id::text
      where a.status = 'new' and cl.idx >= $1 and ge.idx >= $1
        and not exists (select 1 from ai_authorship_alerts x where x.source = 'application' and x.source_id = a.id::text)`,
    [AI_DOUBT],
  )
  for (const x of a.rows as Omit<Hit, 'source'>[]) hits.push({ source: 'application', ...x })
  return hits
}

function authorGreeting(full: string): string {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean)
  // «Прізвище Імʼя [По батькові]» → звертаємось на імʼя; якщо не вийшло — без імені
  return parts.length >= 2 ? `Вітаємо, ${esc(parts[1])}!` : 'Вітаємо!'
}

/** 18.11.2026: лист-попередження автору. Теми й кількість запитань розмови-перевірки НЕ розкриваємо. */
async function sendAuthorLetter(h: Hit): Promise<boolean> {
  if (process.env.AI_AUTHOR_LETTER === 'off') return false
  if (!process.env.RESEND_API_KEY || !h.email || !h.email.includes('@')) return false
  const until = new Date(Date.now() + 14 * 86400000).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', timeZone: 'Europe/Kyiv' })
  const what = h.source === 'application' ? 'історію' : 'твір'
  const consequence = h.source === 'contest'
    ? 'Якщо авторство не підтвердиться, твір буде знято з конкурсу.'
    : h.source === 'application'
      ? 'Якщо авторство не підтвердиться, заявку не буде прийнято.'
      : 'Якщо авторство не підтвердиться, твір буде знято з публікації.'
  const html = `
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:24px;max-width:640px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:14px;padding:22px;border:1px solid rgba(239,159,39,.5);">
    <div style="font-size:22px;font-weight:700;color:#f0a500;margin-bottom:14px;">Балабони</div>
    <p style="color:#c8d4e8;line-height:1.7;">${authorGreeting(h.author)}</p>
    <p style="color:#c8d4e8;line-height:1.7;">Автоматична перевірка ${what} <strong style="color:#ef9f27;">«${esc(h.title)}»</strong> показала значну концентрацію ознак, сумісних із використанням штучного інтелекту. Дві незалежні системи дали такі показники ознак ШІ: <strong style="color:#f5f0e8;">${h.claude}</strong> і <strong style="color:#f5f0e8;">${h.gemini}</strong> зі 100 (0–30 — низька концентрація, 31–55 — помірна, 56–75 — значна, 76–100 — дуже значна). Це не доказ і не відсоток тексту, написаного ШІ, але ми просимо вас розібратися.</p>
    <p style="color:#c8d4e8;line-height:1.7;">Відповідно до п. 8.11 авторського договору (редакція 8.8) твори на Балабонах мають бути написані людиною. Протягом 14 днів, до <strong style="color:#f5f0e8;">${until}</strong>, перепишіть ${what} самостійно й надішліть нову версію у відповідь на цей лист. Якщо ви вважаєте, що сталася помилка, напишіть нам про це у відповідь. ${consequence}</p>
    <p style="font-size:12px;color:#8899bb;margin:16px 0 0;">Команда Балабонів</p>
  </div>
</body>`
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
      to: h.email,
      replyTo: TO,
      subject: `[Балабони] Щодо ${h.source === 'application' ? 'вашої історії' : 'вашого твору'} «${h.title.slice(0, 80)}»`,
      html,
    })
    return true
  } catch (e) {
    console.error('[ai-watch author mail]', (e as Error)?.message)
    return false
  }
}

async function sendAlert(h: Hit, authorMailed: boolean): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false
  const link = h.source === 'contest' ? `${SITE}/admin/ocinka-shi` : h.source === 'application' ? `${SITE}/admin/zayavky-avtoriv` : `${SITE}/admin/content/stories/${esc(h.id)}/edit`
  const html = `
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:24px;max-width:640px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:14px;padding:22px;border:1px solid rgba(239,159,39,.5);">
    <div style="font-size:13px;color:#ef9f27;margin-bottom:6px;">${h.source === 'application' ? 'Заявка автора: ' : ''}Підозра на ШІ: обидві системи 50+ (п. 8.11)</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:12px;">«${esc(h.title)}»</div>
    <p style="color:#c8d4e8;margin:0 0 6px;"><b>Автор:</b> ${esc(h.author || '—')}${h.email ? ` · ${esc(h.email)}` : ''}</p>
    <p style="color:#c8d4e8;margin:0 0 6px;"><b>Ознаки ШІ:</b> Claude ${h.claude}/100 · Gemini ${h.gemini}/100</p>
    <p style="color:#ffb4a8;margin:10px 0 0;">${authorMailed ? `Автору (${esc(h.email)}) автоматично надіслано лист-попередження: 14 днів, щоб переписати твір. Відповіді прийдуть на цю пошту.` : 'Автору лист НЕ надіслано (немає пошти або автолист вимкнено): підстава написати вручну — 14 днів, щоб переписати твір або підтвердити авторство.'}</p>
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
  const checked = [...(await checkApplications(started, budgetMs)), ...(await checkContent(started, budgetMs))]
  const alerted: string[] = []
  for (const h of await findHits()) {
    // Спершу фіксуємо, потім шлемо: краще пропустити лист, ніж слати щогодини.
    const ins = await dbQuery(
      `insert into ai_authorship_alerts (source, source_id) values ($1, $2) on conflict do nothing returning 1`,
      [h.source, h.id],
    )
    if (!ins.rows[0]) continue
    const mailed = await sendAuthorLetter(h)
    if (await sendAlert(h, mailed)) alerted.push(`«${h.title}» (${h.claude}/${h.gemini})${mailed ? ' + лист автору' : ''}`)
  }
  return { checked, alerted }
}
