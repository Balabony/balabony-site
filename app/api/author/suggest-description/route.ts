import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Підказка опису для картки твору.
 *
 * Автор тисне «Запропонувати опис» у кабінеті, отримує три варіанти,
 * обирає один і правит його на свій розсуд — або пише власний.
 * Нічого не зберігається: опис лягає в поле лише тоді, коли автор
 * сам натисне «Зберегти» у формі супровідних текстів.
 *
 * Володіння перевіряємо через author_story_stats — так само, як у
 * /api/author/episode.
 */

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_DESC = 160
const MAX_TEXT = 12000

type Row = { title: string | null; text: string | null }

async function ownedByUser(contentId: string) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401, error: 'Потрібно увійти' }

  const { data } = await supabase
    .from('author_story_stats')
    .select('content_id')
    .eq('author_id', user.id)
    .eq('content_id', contentId)
    .maybeSingle()

  if (!data) return { ok: false as const, status: 403, error: 'Це не ваш твір' }
  return { ok: true as const }
}

export async function POST(req: NextRequest) {
  let b: { id?: string }
  try {
    b = (await req.json()) as { id?: string }
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const id = (b.id ?? '').trim()
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Не вказано твір' }, { status: 400 })
  }

  const own = await ownedByUser(id)
  if (!own.ok) {
    return NextResponse.json({ ok: false, error: own.error }, { status: own.status })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return NextResponse.json({ ok: false, error: 'Сервіс підказок недоступний' }, { status: 500 })
  }

  const r = await dbQuery(`select title, text from content where id = $1`, [id])
  if (r.rowCount === 0) {
    return NextResponse.json({ ok: false, error: 'Твір не знайдено' }, { status: 404 })
  }

  const row = (r.rows ?? [])[0] as Row
  const title = (row.title ?? '').trim()
  const text = (row.text ?? '').trim()

  if (text.length < 200) {
    return NextResponse.json(
      { ok: false, error: 'Текст закороткий, щоб скласти опис' },
      { status: 400 }
    )
  }

  const client = new Anthropic({ apiKey: key })

  const prompt = [
    'Ти складаєш короткий опис для картки художнього твору в стрічці читання.',
    '',
    'Правила:',
    `— рівно ${MAX_DESC} символів або менше, це жорстке обмеження;`,
    '— українською, живою мовою, без канцеляриту;',
    '— мета — заінтригувати й дати відчути настрій, а не переказати сюжет;',
    '— НЕ розкривай розв’язку, фінал, таємницю чи те, ким виявився хтось із героїв;',
    '— не став оцінок на кшталт «зворушлива історія», «неймовірний твір»;',
    '— не починай зі слів «Історія про» і «Розповідь про»;',
    '— без лапок навколо опису, без крапки в кінці, якщо це не потрібно за змістом.',
    '',
    'Поверни рівно три різні варіанти у форматі JSON-масиву рядків.',
    'Нічого, крім масиву: без пояснень, без markdown, без ```.',
    '',
    `Назва: ${title}`,
    '',
    'Текст твору:',
    text.slice(0, MAX_TEXT),
  ].join('\n')

  let raw = ''
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })
    raw = msg.content
      .map((c) => (c.type === 'text' ? c.text : ''))
      .join('')
      .trim()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Не вдалося скласти опис — спробуйте ще раз' },
      { status: 502 }
    )
  }

  const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()

  let variants: string[] = []
  try {
    const parsed: unknown = JSON.parse(clean)
    if (Array.isArray(parsed)) {
      variants = parsed.filter((v): v is string => typeof v === 'string')
    }
  } catch {
    variants = clean
      .split('\n')
      .map((s) => s.replace(/^[\s\-–—*\d.)"']+/, '').replace(/["']+$/, '').trim())
      .filter((s) => s.length > 20)
  }

  variants = variants
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .map((v) => (v.length > MAX_DESC ? v.slice(0, MAX_DESC).trimEnd() : v))
    .slice(0, 3)

  if (variants.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Не вдалося скласти опис — спробуйте ще раз' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true, variants })
}
