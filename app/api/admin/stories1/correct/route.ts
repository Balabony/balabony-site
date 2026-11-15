import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Грамотність: редакторська правка тексту (кнопка «Грамотність» у редакторських інструментах).
 *
 * 15.11.2026 (Богдан: «правка ШІ граматики не працює»). Раніше модель мала
 * повернути ВЕСЬ виправлений текст. На творах у 10–15 тис. знаків відповідь
 * обрізалася на ліміті токенів (8000), маркер ===ENDTEXT=== не доходив — і
 * редактор отримував або сирий шматок відповіді, або нічого; ще й без
 * maxDuration запит падав за таймаутом.
 *
 * Тепер модель повертає ЛИШЕ список правок (через інструмент — JSON завжди
 * валідний). Виправлений текст збираємо тут, застосовуючи правки до
 * оригіналу. Відповідь у 5–10 разів коротша, нічого не обрізається, а правки,
 * цитати яких немає в тексті, відкидаються (захист від вигаданих помилок).
 * Формат відповіді той самий: { corrected_text, changes }.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MODEL = 'claude-sonnet-4-6'
const MAX_CHANGES = 40

type Change = { id: number; original: string; corrected: string; reason?: string }

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

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

function applyAll(text: string, changes: Change[]): string {
  let result = text
  for (const c of changes) {
    const pos = result.indexOf(c.original)
    if (pos === -1) continue
    result = result.slice(0, pos) + c.corrected + result.slice(pos + c.original.length)
  }
  return result
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { text, genre } = await req.json() as { text?: string; genre?: string }
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'Немає ANTHROPIC_API_KEY' }, { status: 500 })

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

    return NextResponse.json({
      corrected_text: applyAll(text, changes),
      changes,
    })
  } catch (err) {
    console.error('[stories1/correct]', (err as Error)?.message)
    return NextResponse.json({ error: `Перевірка не вдалася: ${(err as Error)?.message ?? String(err)}` }, { status: 500 })
  }
}
