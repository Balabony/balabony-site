import Anthropic from '@anthropic-ai/sdk'
import { dbQuery } from '@/lib/db'

// =============================================================================
// ШІ-МОДЕРАЦІЯ ПРИ САМОСТІЙНІЙ ПУБЛІКАЦІЇ (рішення Богдана 15.11.2026).
//
// Привід: «Всередині» (Трегубов) — героїня-школярка й сексуальні сцени —
// автор опублікував сам, і твір висів на сайті, де є дитячі конкурси.
//
// Правила:
//  1. Перед публікацією ШІ перевіряє текст за червоними лініями.
//     verdict 'block'  → твір іде в 'review', редактор отримує лист.
//     verdict 'adult'  → публікується з позначкою 18+ (is_adult = true).
//     verdict 'ok'     → публікується як є.
//  2. Новий автор (менше TRUSTED_AFTER опублікованих творів) — завжди через
//     редактора ('review'), навіть якщо ШІ не має зауважень.
//  3. Якщо ШІ недоступний — обережно: 'review'.
//  4. Редагування вже опублікованого твору теж перевіряється; 'block' знімає
//     твір із сайту в 'review'.
// =============================================================================

const MODEL = 'claude-sonnet-4-6'
const MAX_CHARS = 120_000
export const TRUSTED_AFTER = 3

export type Verdict = 'ok' | 'adult' | 'block'
export type ModerationResult = { verdict: Verdict; reasons: string[]; error?: string }

function prompt(title: string, text: string) {
  return `Ти — модератор української літературної платформи «Балабони». Її читають і дорослі, і діти; на ній проходять дитячі конкурси. Оціни твір і обери ОДИН вердикт.

"block" — твір НЕ можна публікувати без перевірки редактором, якщо є хоч щось із цього:
- будь-який сексуальний контент, сексуальні стосунки чи сексуалізація з участю неповнолітніх (школярі, підлітки, діти до 18), навіть натяком, навіть без натуралізму, навіть як спогад, описаний сценою;
- відверті, детальні сцени сексу між дорослими;
- натуралістичне, смакуване насильство, катування, жорстокість до тварин у деталях;
- розпалювання ненависті до груп людей, пропаганда держави-агресора, виправдання війни проти України;
- схвалення чи інструкції самоушкодження, самогубства, розладів харчування;
- інструкції зі зброї, вибухівки, наркотиків;
- небезпечні медичні поради: лікування раку, тяжких хвороб чи залежностей отруйними рослинами, грибами чи іншими «народними» засобами замість медицини;
- спам, реклама товарів чи послуг.

"adult" — можна публікувати, але з позначкою 18+, ЛИШЕ якщо є хоч щось із цього:
- нецензурна лайка (мат);
- вживання наркотиків, пияцтво чи алкоголізм як помітна тема;
- еротичні сцени чи відверті натяки між дорослими (без детальних сцен — інакше "block");
- детально описане насильство, кримінал, жорстокість (бійки з кров'ю, вбивства в подробицях);
- інтимні послуги, зрада з відвертими подробицями.

НЕ є підставою для 18+ (це "ok"): війна, загибель, смерть, хвороба, горе, втрата, бідність, корупція, кримінал без подробиць, згадка про алкоголь, сум, складні стосунки, важкі життєві теми. Військова проза й життєві історії про втрати — це "ok", якщо немає мату, натуралізму чи еротики.

"ok" — усе інше, текст придатний для всіх читачів.

Пам'ятай: на платформі є художня проза, а також інтерв'ю, життєві історії, нариси й публіцистика з газет — нехудожній текст сам по собі НЕ порушення. Серйозні теми самі по собі не порушення. Але щодо неповнолітніх і сексуального контенту будь суворим: сумнів — "block".

"reasons" — 1–3 короткі причини українською, конкретно (що саме в тексті). Пиши ввічливо й нейтрально — ці причини отримає сам автор у листі; без оцінок на кшталт «псевдо-», «низькоякісний». Для "ok" — порожній список.

Назва: ${title}
Текст:
---
${text.slice(0, MAX_CHARS)}
---`
}

export async function moderateText(title: string, text: string): Promise<ModerationResult> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return { verdict: 'block', reasons: ['ШІ-перевірка недоступна'], error: 'no key' }
  try {
    const client = new Anthropic({ apiKey: key })
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      tools: [{
        name: 'moderation',
        description: 'Вердикт модерації твору',
        input_schema: {
          type: 'object',
          properties: {
            verdict: { type: 'string', enum: ['ok', 'adult', 'block'] },
            reasons: { type: 'array', items: { type: 'string' } },
          },
          required: ['verdict', 'reasons'],
        },
      }],
      tool_choice: { type: 'tool', name: 'moderation' },
      messages: [{ role: 'user', content: prompt(title, text) }],
    })
    const tool = message.content.find((c) => c.type === 'tool_use')
    const input = (tool && tool.type === 'tool_use' ? tool.input : {}) as { verdict?: string; reasons?: unknown }
    const verdict: Verdict = input.verdict === 'ok' || input.verdict === 'adult' || input.verdict === 'block'
      ? input.verdict
      : 'block'
    const reasons = (Array.isArray(input.reasons) ? input.reasons : [])
      .filter((r): r is string => typeof r === 'string')
      .slice(0, 3)
    return { verdict, reasons }
  } catch (e) {
    return { verdict: 'block', reasons: ['ШІ-перевірка не відповіла — потрібна ручна перевірка'], error: (e as Error)?.message }
  }
}

export async function ensureModerationTable() {
  await dbQuery(`create table if not exists content_moderation (
    content_id uuid primary key,
    verdict text not null,
    reasons jsonb not null default '[]',
    trusted boolean not null default false,
    outcome text not null,
    checked_at timestamptz not null default now()
  )`)
}

/** Скільки опублікованих творів уже має автор (крім цього). */
export async function publishedCount(authorId: string, exceptId: string): Promise<number> {
  const r = await dbQuery(
    `select count(*)::int as n from content
      where author_id = $1 and id::text <> $2 and status::text = 'published'`,
    [authorId, exceptId],
  )
  return (r.rows[0] as { n: number } | undefined)?.n ?? 0
}

export async function saveModeration(contentId: string, res: ModerationResult, trusted: boolean, outcome: string) {
  try {
    await ensureModerationTable()
    await dbQuery(
      `insert into content_moderation (content_id, verdict, reasons, trusted, outcome, checked_at)
       values ($1, $2, $3::jsonb, $4, $5, now())
       on conflict (content_id) do update set verdict = excluded.verdict, reasons = excluded.reasons,
         trusted = excluded.trusted, outcome = excluded.outcome, checked_at = now()`,
      [contentId, res.verdict, JSON.stringify(res.reasons), trusted, outcome],
    )
  } catch (e) {
    console.error('[moderation save]', (e as Error)?.message)
  }
}

// -----------------------------------------------------------------------------
// Разова (і далі щогодинна) перевірка ВЖЕ опублікованих авторських творів.
// 'block' → твір знімається в 'review' + лист редактору одразу;
// 'adult' → is_adult = true; кожен твір перевіряється один раз.
// -----------------------------------------------------------------------------
export async function scanPublished(budgetMs = 250_000, parallel = 4) {
  const { alertForContent } = await import('@/lib/new-work-alert')
  await ensureModerationTable()
  const started = Date.now()
  const stats = { checked: 0, held: 0, adult: 0, errors: 0, left: 0 }
  for (;;) {
    if (Date.now() - started > budgetMs - 40_000) break
    const r = await dbQuery(
      `select c.id::text as id, c.title, c.text
         from content c
        where c.author_id is not null and c.status::text = 'published'
          and length(coalesce(c.text, '')) > 0
          and not exists (select 1 from content_moderation m where m.content_id = c.id)
        order by coalesce(c.published_at, c.created_at) desc
        limit $1`,
      [parallel],
    )
    const rows = r.rows as { id: string; title: string | null; text: string }[]
    if (!rows.length) break
    await Promise.all(rows.map(async (w) => {
      const mod = await moderateText(w.title ?? '', w.text)
      stats.checked++
      if (mod.error) {
        // ШІ не відповів — не знімаємо твір, спробуємо наступного разу.
        stats.errors++
        return
      }
      if (mod.verdict === 'block') {
        await dbQuery(`update content set status = 'review' where id::text = $1 and status::text = 'published'`, [w.id])
        await saveModeration(w.id, mod, true, 'review')
        await alertForContent('moderation', w.id, null, ['Перевірка вже опублікованих творів: знято з сайту до вашого рішення', ...mod.reasons])
        await sendAuthorModerationLetter(w.id, 'block', mod.reasons)
        stats.held++
      } else {
        if (mod.verdict === 'adult') {
          await dbQuery(`update content set is_adult = true where id::text = $1`, [w.id])
          stats.adult++
        }
        await saveModeration(w.id, mod, true, 'published')
      }
    }))
    if (stats.errors >= 3) break
  }
  const left = await dbQuery(
    `select count(*)::int as n from content c
      where c.author_id is not null and c.status::text = 'published' and length(coalesce(c.text, '')) > 0
        and not exists (select 1 from content_moderation m where m.content_id = c.id)`,
  )
  stats.left = (left.rows[0] as { n: number }).n
  return stats
}

// -----------------------------------------------------------------------------
// Лист АВТОРУ з поясненням (рішення Богдана 15.11.2026: «кожному автору
// автоматично шлемо листа із поясненням причини»).
//   kind 'block'  — твір порушує правила; причини від ШІ.
//   kind 'new'    — новий автор: перші твори виходять після перевірки редактором.
// «Відповісти» — лист піде редактору.
// -----------------------------------------------------------------------------
function escHtml(v: string): string {
  return (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function sendAuthorModerationLetter(contentId: string, kind: 'block' | 'new', reasons: string[] = []) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const r = await dbQuery(
      `select c.title, c.author_name, u.email
         from content c join auth.users u on u.id = c.author_id
        where c.id::text = $1`,
      [contentId],
    )
    const row = r.rows[0] as { title: string | null; author_name: string | null; email: string | null } | undefined
    if (!row?.email) return
    const title = row.title ?? 'Без назви'
    const hello = row.author_name ? `Вітаємо, ${escHtml(row.author_name)}!` : 'Вітаємо!'
    const body = kind === 'new'
      ? `<p>Дякуємо за твір «${escHtml(title)}». Перші три твори нового автора на Балабонах виходять після перевірки редактором — це стосується всіх авторів. Ми переглянемо текст найближчим часом і опублікуємо його.</p>`
      : `<p>Ваш твір «${escHtml(title)}» ми поки не можемо опублікувати: він тимчасово знятий з публікації й чекає рішення редактора.</p>
         <p><b>Причина:</b></p>
         <ul>${reasons.map((x) => `<li>${escHtml(x)}</li>`).join('')}</ul>
         <p>Балабони читають і діти, тому ми не публікуємо сексуальний контент за участі неповнолітніх, відверті сцени сексу, натуралістичне насильство, ненависть до людей, пропаганду держави-агресора, небезпечні медичні поради, схвалення самоушкодження, інструкції щодо зброї чи наркотиків, рекламу.</p>
         <p>Якщо ви можете доопрацювати текст — відредагуйте його в кабінеті автора й напишіть нам, ми переглянемо ще раз. Якщо вважаєте, що сталася помилка, просто відповідайте на цей лист.</p>`
    const html = `<body style="font-family:Arial,sans-serif;color:#1c1917;line-height:1.6;max-width:620px;margin:0 auto;padding:20px;">
      <p>${hello}</p>${body}
      <p>Ваш кабінет: <a href="https://balabony.com/author/dashboard">https://balabony.com/author/dashboard</a></p>
      <p>З повагою,<br>Редакція Балабонів</p></body>`
    const { Resend } = await import('resend')
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
      to: row.email,
      replyTo: 'nazar@balabony.com',
      subject: kind === 'new'
        ? `Балабони: твір «${title.slice(0, 80)}» на перевірці редактора`
        : `Балабони: твір «${title.slice(0, 80)}» потребує доопрацювання`,
      html,
    })
  } catch (e) {
    console.error('[moderation author letter]', (e as Error)?.message)
  }
}
