import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 13.11.2026: /admin/afisha — анонси для «Афіші без барʼєрів».
 * parse  — ШІ розкладає вставлений лист (напр. від Kinomania) по полях; нічого не публікує.
 * save   — зберегти/оновити запис (публікується одразу, сторінка /afisha оновлюється).
 * delete — прибрати запис.
 */
function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

const FIELDS = ['kind', 'date', 'time', 'title', 'category', 'venue', 'city', 'studio', 'genre', 'director', 'cast_text', 'about', 'book', 'trailer', 'source', 'distributor', 'access', 'published'] as const
const ACCESS = ['audio', 'subs', 'sign', 'wheel', 'braille']

function clean(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const f of FIELDS) if (f in input) out[f] = input[f]
  for (const k of Object.keys(out)) if (typeof out[k] === 'string') out[k] = (out[k] as string).trim() || null
  out.kind = out.kind === 'event' ? 'event' : 'film'
  out.access = Array.isArray(out.access) ? (out.access as string[]).filter((a) => ACCESS.includes(a)) : []
  if (typeof out.trailer === 'string' && !/^https:\/\//.test(out.trailer)) out.trailer = null
  if (typeof out.source === 'string' && !/^https?:\/\//.test(out.source)) out.source = null
  return out
}

const PROMPT = (text: string) => `Ти редактор рубрики «Афіша без барʼєрів» на українському літературному сайті. Нижче — лист-анонс від організатора або дистрибʼютора. Розклади його по полях і поверни ЛИШЕ JSON без пояснень:
{"kind":"film" для фільму в прокаті або "event" для вистави/показу/читання/виставки з конкретною датою й місцем,
 "date":"YYYY-MM-DD" (дата старту прокату або події),
 "time":"HH:MM" або null,
 "title":"назва українською, без слів «офіційний трейлер»",
 "category":"Кіно"|"Вистава"|"Читання"|"Виставка"|"Концерт"|"Зустріч",
 "venue":місце або null, "city":місто або null,
 "studio":студії через кому або null, "genre":до 4 жанрів малими літерами або null,
 "director":"Імʼя Прізвище («відомий фільм»)" або null,
 "cast_text":"актори лише іменами, без переліку фільмів" або null,
 "about":"опис 2–4 речення, своїми словами, без реклами й без закликів підписатися на соцмережі",
 "trailer":посилання на YouTube або null,
 "source":посилання на сторінку події або null,
 "distributor":дистрибʼютор або організатор (без імені PR-менеджера) або null,
 "book":"як потрапити: квитки, реєстрація, телефон" або null,
 "access":масив з ["audio","subs","sign","wheel","braille"] — ЛИШЕ ті формати доступності, які прямо названі в листі; якщо не названі — []}
Не вигадуй того, чого в листі немає. Лист:
"""
${text.slice(0, 12000)}
"""`

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabaseAdmin().from('afisha_items').select('*').order('date', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const db = getSupabaseAdmin()
  if (body.action === 'parse') {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'Немає ANTHROPIC_API_KEY' }, { status: 500 })
    const text = String(body.text || '').trim()
    if (text.length < 40) return NextResponse.json({ error: 'Вставте текст листа повністю' }, { status: 400 })
    const msg = await new Anthropic({ apiKey: key }).messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: PROMPT(text) }] })
    const raw = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}')
    // 13.11.2026: якщо дати в листі немає («уже в кіно») — ставимо сьогоднішню
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })
    try { const it = clean(JSON.parse(raw.slice(s, e + 1))); if (!/^\d{4}-\d{2}-\d{2}$/.test(String(it.date || ''))) it.date = today; return NextResponse.json({ item: it }) } catch { return NextResponse.json({ error: 'ШІ не зміг розібрати лист — заповніть поля вручну' }, { status: 422 }) }
  }
  if (body.action === 'save') {
    const item = clean(body.item || {})
    if (!item.title || !/^\d{4}-\d{2}-\d{2}$/.test(String(item.date || ''))) return NextResponse.json({ error: 'Потрібні назва й дата (РРРР-ММ-ДД)' }, { status: 400 })
    const id = typeof body.item?.id === 'string' ? body.item.id : null
    const q = id ? db.from('afisha_items').update(item).eq('id', id).select().single() : db.from('afisha_items').insert(item).select().single()
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/afisha')
    return NextResponse.json({ item: data })
  }
  if (body.action === 'delete' && typeof body.id === 'string') {
    const { error } = await db.from('afisha_items').delete().eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/afisha')
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Невідома дія' }, { status: 400 })
}
