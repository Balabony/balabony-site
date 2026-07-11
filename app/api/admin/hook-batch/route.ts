import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Admin-auth за тим самим патерном, що й решта admin-endpoint'ів.
function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// Батч-генерація КОРОТКОГО гачка (hook) для картки серії Балабонів «по одному»:
// фронтенд викликає цей endpoint у циклі, доки done=true.
//
// ВІДМІННІСТЬ від сусідніх полів:
//  - recap        = СПОЙЛЕРНЕ резюме («що було раніше»);
//  - short_script = НЕ-спойлерний тизер ~70-90 слів (для анонсу/шорту);
//  - hook         = ОДНЕ речення (макс. два дуже короткі) для тизера на КАРТЦІ.
// Уже наявні hook НЕ чіпаються (запуск можна повторювати — продовжить з місця).
//
// Пре-умова: колонка hook уже існує в content (її вже читають /api/series та /api/tysha).

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  const supabase = getSupabaseAdmin()

  // Скільки всього епізодів — для прогресу на фронті.
  const { count: total } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'balabony')
    .eq('status', 'published')

  // Найперший епізод без hook (за порядком сезон/серія). E1 не пропускаємо.
  const { data: candidates, error: selErr } = await supabase
    .from('content')
    .select('id, title, text, corrected_text, short_script, season_number, episode_number')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .or('hook.is.null,hook.eq.')
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })
    .limit(2)

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }

  // Скільки лишилось без hook (для прогресу) — окремий лічильник.
  const { count: remainingBefore } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'balabony')
    .eq('status', 'published')
    .or('hook.is.null,hook.eq.')

  // Джерело: дотягнутий фінал у corrected_text > text. Якщо є short_script —
  // можемо стиснути саме його (він уже без спойлерів), інакше беремо повний текст.
  const pickText = (c: { corrected_text?: string | null; text?: string | null }) =>
    ((c.corrected_text ?? '').trim() || (c.text ?? '').trim())

  const target = (candidates ?? []).find(c => pickText(c).length > 0 || (c.short_script ?? '').trim().length > 0)

  if (!target) {
    return NextResponse.json({ done: true, total: total ?? 0, remaining: 0, processed: null })
  }

  const sourceText = (target.short_script ?? '').trim() || pickText(target)
  const titleLine = target.title?.trim() ? `Назва епізоду: «${target.title.trim()}»\n\n` : ''

  // Промпт: 1 речення-гачок, тепла сільська комедія, без спойлера й без розв'язки.
  const prompt = `Ти — оповідач україномовного серіалу «Балабони» (тепла комедія характерів про життя українського села: дід Панас з його «інноваціями», баба Ганя, кум, онуки). Напиши ГАЧОК для картки цього епізоду — коротку приманку, що інтригує.

ГОЛОВНЕ: гачок — це НЕ переказ подій і НЕ розв'язка. Це образ або натяк, від якого хочеться прочитати.

ФОРМАТ:
- 1 речення. Максимум 2 дуже короткі. До ~20 слів разом.
- Проста, жива мова з легкою сільською іскрою й теплим гумором.
- Обірви на інтризі — без крапок-кнопок («читай далі», «дізнайся», «не пропусти»).

ЗАБОРОНЕНО (вбиває гачок):
- Спойлер розв'язки чи «чим усе скінчилось».
- Переказ послідовності дій, пояснення мотивів.
- Штамп-зачини («Усе почалося з того…»), передвісники («але раптом»), канцелярит.
- Нові імена/події, яких нема в тексті. Латиниця в брендах (пиши кирилицею: вайбер, тікток).

ПОГАНО (переказ): «Панас вирішив провести інтернет на вишню, село допомагало, і врешті нічого не вийшло.»
ДОБРЕ (образ + недомовка): «Дід певен: як залізти на вишню — село вискочить у майбутнє. Ганя вже несе драбину.»

Поверни ТІЛЬКИ текст гачка українською, без лапок навколо нього, без пояснень.

${titleLine}Матеріал епізоду:
"""
${sourceText}
"""`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash', generationConfig: { temperature: 0.8 } },
      { apiVersion: 'v1beta' },
    )
    const result = await model.generateContent(prompt)
    const hook = result.response.text().trim().replace(/^["«»]+|["«»]+$/g, '').trim()

    if (!hook) {
      return NextResponse.json({ error: 'Порожня відповідь AI', targetId: target.id }, { status: 502 })
    }

    const { error: updErr } = await supabase
      .from('content')
      .update({ hook })
      .eq('id', target.id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message, targetId: target.id }, { status: 500 })
    }

    return NextResponse.json({
      done: false,
      total: total ?? 0,
      remaining: Math.max(0, (remainingBefore ?? 1) - 1),
      processed: {
        id: target.id,
        title: target.title,
        season: target.season_number,
        episode: target.episode_number,
        hook,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg, targetId: target.id }, { status: 500 })
  }
}
