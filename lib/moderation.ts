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
- спам, реклама, не художній текст.

"adult" — можна публікувати, але з позначкою 18+: алкоголь, наркотики, кримінал, корупція, смерть, війна, ненасильницька жорстокість, нецензурна лексика, еротичні натяки між дорослими без сцен, важкі дорослі теми.

"ok" — усе інше, текст придатний для всіх читачів.

Пам'ятай: це художня література, серйозні теми самі по собі не порушення. Але щодо неповнолітніх і сексуального контенту будь суворим: сумнів — "block".

"reasons" — 1–3 короткі причини українською, конкретно (що саме в тексті). Для "ok" — порожній список.

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
