import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'

/**
 * ШІ-коректура: список точкових правок + текст із застосованими правками.
 * Використовують кнопка «Грамотність» (app/api/admin/stories1/correct) і
 * щогодинна підготовка правок наперед (lib/ai-correct-auto.ts).
 * Чому лише список правок, а не весь текст, — див. коментар у маршруті.
 */

const MODEL = 'claude-sonnet-4-6'
const MAX_CHANGES = 40

export type Change = { id: number; original: string; corrected: string; reason?: string }

function prompt(text: string, genre?: string) {
  return `Ти — досвідчений редактор-коректор українських художніх текстів. Знайди помилки у творі${genre ? ` (жанр: ${genre})` : ''} і запропонуй точкові правки.

Що виправляти:
- орфографія, апостроф, м'який знак, великі літери;
- пунктуація: коми, тире в діалогах (пряма мова — тире «–» або «—» і пробіл), лапки «ялинки», крапка замість коми після слів автора, якщо репліка продовжується новим реченням;
- граматика: відмінки, узгодження, кличний відмінок у звертаннях;
- русизми й кальки в мові ОПОВІДАЧА («прийняти участь» → «взяти участь», «на протязі» → «протягом» тощо);
- явні стилістичні огріхи: пропущені слова, плутанина часів, незграбні звороти.

Чого НЕ робити:
- не переписуй авторський стиль і не «покращуй» вдалі речення;
- не виправляй суржик, діалектизми й розмовні слова в репліках персонажів — це характеристика героя;
- не змінюй сюжет, імена, факти.

Правила для кожної правки:
- "original" — ТОЧНА цитата з тексту, символ у символ, 2–15 слів, достатньо довга, щоб бути унікальною;
- "corrected" — той самий фрагмент після виправлення;
- "reason" — коротко, простими словами;
- до ${MAX_CHANGES} правок, найважливіші першими.

Текст:
---
${text}
---`
}

export function applyAll(text: string, changes: Change[]): string {
  let result = text
  for (const c of changes) {
  const pos = result.indexOf(c.original)
  if (pos === -1) continue
  result = result.slice(0, pos) + c.corrected + result.slice(pos + c.original.length)
  }
  return result
}

export function textHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 32)
}

export async function runCorrection(text: string, genre?: string): Promise<{ changes: Change[]; corrected_text: string }> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Немає ANTHROPIC_API_KEY')
  const client = new Anthropic({ apiKey: key })
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    tools: [{
      name: 'corrections',
      description: 'Список точкових правок тексту',
      input_schema: {
        type: 'object',
        properties: {
          changes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                original: { type: 'string' },
                corrected: { type: 'string' },
                reason: { type: 'string' },
              },
              required: ['original', 'corrected'],
            },
          },
        },
        required: ['changes'],
      },
    }],
    tool_choice: { type: 'tool', name: 'corrections' },
    messages: [{ role: 'user', content: prompt(text, genre) }],
  })

  const tool = message.content.find((c) => c.type === 'tool_use')
  const rawChanges = tool && tool.type === 'tool_use' && tool.input && typeof tool.input === 'object'
    ? (tool.input as { changes?: unknown }).changes
    : []

  const seen = new Set<string>()
  const changes: Change[] = (Array.isArray(rawChanges) ? rawChanges : [])
    .filter((c): c is { original: string; corrected: string; reason?: string } =>
      !!c && typeof c === 'object' &&
      typeof (c as Change).original === 'string' && typeof (c as Change).corrected === 'string')
    .map((c) => ({ original: c.original, corrected: c.corrected, reason: typeof c.reason === 'string' ? c.reason : '' }))
    // Лише правки, що справді щось змінюють і цитата яких є в тексті.
    .filter((c) => c.original && c.original !== c.corrected && text.includes(c.original))
    .filter((c) => (seen.has(c.original) ? false : (seen.add(c.original), true)))
    .slice(0, MAX_CHANGES)
    .map((c, i) => ({ id: i + 1, ...c }))

  return { changes, corrected_text: applyAll(text, changes) }
}
