import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Чернетки опису історії для редактора (20.09.2026).
 *
 * Для стрічки UKR.NET потрібен короткий зміст на 3–4 речення без HTML.
 * ШІ лише ПРОПОНУЄ три варіанти — нічого не зберігає. Опис лягає в базу
 * тільки коли редактор сам обере/виправить варіант і натисне «Зберегти»
 * на /admin/bez-opysu. Поле — short_description (для стрічок); картковий
 * опис автора (description) не чіпаємо.
 */

// 20.09.2026: Haiku давав помилки в українській (відмінки, сленг) і переказував фінал.
// Sonnet пише чистіше; модель та сама, що вже працює в інших маршрутах проєкту.
const MODEL = 'claude-sonnet-4-6'

// Sonnet на довгому тексті відповідає 15–30 с — більше, ніж типовий ліміт функції Vercel.
// Без цього запит обривався тайм-аутом (504), і чернетки не з'являлися.
export const maxDuration = 60
const MIN = 150
const MAX = 380
// ШІ бачить лише початок твору: не знаючи фіналу, він не може його розкрити.
const OPENING_SHARE = 0.35
const MAX_OPENING = 6000

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  let id = ''
  try {
    id = String(((await req.json()) as { id?: string }).id ?? '').trim()
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }
  if (!id) return NextResponse.json({ ok: false, error: 'Не вказано історію' }, { status: 400 })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ ok: false, error: 'Сервіс підказок недоступний' }, { status: 500 })

  const { data, error } = await getSupabaseAdmin()
    .from('content')
    .select('title, author_name, text, corrected_text')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return NextResponse.json({ ok: false, error: 'Історію не знайдено' }, { status: 404 })

  const row = data as { title: string | null; author_name: string | null; text: string | null; corrected_text: string | null }
  const text = (row.corrected_text || row.text || '').replace(/<[^>]*>/g, ' ').trim()
  if (text.length < 300) return NextResponse.json({ ok: false, error: 'Текст закороткий для опису' }, { status: 400 })

  // Початок твору: перша третина, але не менше 1500 знаків і не більше MAX_OPENING. Обрізаємо по кінцю абзацу чи речення.
  const want = Math.min(MAX_OPENING, Math.max(1500, Math.round(text.length * OPENING_SHARE)))
  let opening = text.slice(0, want)
  if (want < text.length) {
    const cut = Math.max(opening.lastIndexOf('\n'), opening.lastIndexOf('. '), opening.lastIndexOf('! '), opening.lastIndexOf('? '))
    if (cut > want * 0.6) opening = opening.slice(0, cut + 1)
  }

  const prompt = [
    'Ти редактор української літературної платформи. Склади короткий зміст оповідання для новинної стрічки.',
    '',
    'Правила:',
    `— 3–4 речення, разом від ${MIN} до ${MAX} символів;`,
    '— літературна українська мова: без сленгу й жаргону («менти», «тачка» тощо), без русизмів і канцеляриту;',
    '— перевір граматику: відмінки («мати», а не «матір» у називному), числівники («обоє дітей»), дієприслівники, орфографію;',
    '— імена героїв — точно як у тексті;',
    '— тобі дано лише ПОЧАТОК твору; опиши героя, місце й зав’язку — з чого все починається;',
    '— не переказуй події послідовно й не вгадуй, чим закінчиться; останнє речення лишає інтригу;',
    '— без оцінок («зворушлива», «неймовірна»), без закликів читати, без емодзі;',
    '— не починай зі слів «Історія про», «Розповідь про», «Оповідання про»;',
    '— без HTML, без лапок навколо всього тексту;',
    '— не вигадуй того, чого немає в тексті.',
    '',
    'Поверни рівно три різні варіанти як JSON-масив рядків. Нічого, крім масиву.',
    '',
    `Назва: ${row.title ?? ''}`,
    `Автор: ${row.author_name ?? ''}`,
    '',
    'Початок твору:',
    opening,
  ].join('\n')

  let raw = ''
  try {
    const msg = await new Anthropic({ apiKey: key }).messages.create({
      model: MODEL,
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })
    raw = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('').trim()
  } catch {
    return NextResponse.json({ ok: false, error: 'Не вдалося скласти опис — спробуйте ще раз' }, { status: 502 })
  }

  let variants: string[] = []
  try {
    const parsed: unknown = JSON.parse(raw.replace(/```json|```/g, '').trim())
    if (Array.isArray(parsed)) variants = parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    /* нижче — порожній результат */
  }
  variants = variants
    .map((v) => v.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((v) => v.length >= 80)
    .map((v) => (v.length > 400 ? v.slice(0, 397).trimEnd() + '…' : v))
    .slice(0, 3)

  if (!variants.length) return NextResponse.json({ ok: false, error: 'Не вдалося скласти опис — спробуйте ще раз' }, { status: 502 })
  return NextResponse.json({ ok: true, variants })
}
