import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Admin-auth за тим самим патерном, що й решта admin-endpoint'ів.
function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// Батч-генерація коротких НЕ-спойлерних скриптів-шортів «по одному»:
// фронтенд викликає цей endpoint у циклі, доки done=true.
// Кожен виклик: бере ОДИН найперший епізод без short_script (з текстом),
// генерує гачок-тизер ~70-90 слів і зберігає. Так нема Vercel-timeout
// (один швидкий виклик за раз) і є природний прогрес.
//
// ВІДМІННІСТЬ від recap:
//  - recap = СПОЙЛЕРНЕ резюме («що було раніше»);
//  - short_script = ГАЧОК без розкриття сюжету (для тизера/анонсу).
// Уже наявні short_script НЕ чіпаються. Аудіо шорту — пізніше (TTS), тут лише текст.
//
// ВАЖЛИВО: спершу виконати міграцію (ALTER TABLE content ADD COLUMN short_script),
// інакше запит .or('short_script...') впаде.

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

  // Найперший епізод без short_script (нумерація за порядком сезон/серія).
  // На відміну від recap, E1 НЕ пропускаємо — гачок потрібен кожному епізоду.
  const { data: candidates, error: selErr } = await supabase
    .from('content')
    .select('id, title, text, corrected_text, season_number, episode_number')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .or('short_script.is.null,short_script.eq.')
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })
    .limit(2)

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }

  // Скільки лишилось без short_script (для прогресу) — окремий лічильник.
  const { count: remainingBefore } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'balabony')
    .eq('status', 'published')
    .or('short_script.is.null,short_script.eq.')

  // Джерело тексту: дотягнутий фінал у corrected_text має пріоритет над text.
  const pickText = (c: { corrected_text?: string | null; text?: string | null }) =>
    ((c.corrected_text ?? '').trim() || (c.text ?? '').trim())

  // Вибираємо перший придатний кандидат (з непорожнім текстом).
  const target = (candidates ?? []).find(c => pickText(c).length > 0)

  if (!target) {
    // Нема що генерувати — всі мають short_script (або без тексту). Завершено.
    return NextResponse.json({
      done: true,
      total: total ?? 0,
      remaining: 0,
      processed: null,
    })
  }

  const sourceText = pickText(target)
  const titleLine = target.title?.trim() ? `Назва епізоду: «${target.title.trim()}»\n\n` : ''

  // ТОН 1+2 (рішення Богдана): тепла авторська нарація з жвавою сільською іскрою.
  const prompt = `Ти — оповідач україномовного серіалу «Балабони». Напиши короткий шорт-гачок (тизер) до цього епізоду — щоб зачепити й заінтригувати слухача, але НЕ розкрити сюжет.

Тон: тепла авторська нарація з жвавою сільською іскрою та легким гумором. Світ — українське село (окремі хати, тин, город, своє подвір'я), без міських формул («сусід по будинку», «за стіною», «квартира» — заборонено).

Вимоги:
- 70-90 слів. Суцільна нарація — НЕ діалог, НЕ список, без реплік «Імʼя: ...».
- Це ГАЧОК, а не переказ: натякни на інтригу, але НЕ розкривай, чим усе скінчилось, і не називай розв'язки чи загадки.
- БЕЗ катчфраз-кнопок і закликів («читай далі», «дізнайся», «не пропусти» тощо). Просто обірви на інтризі.
- Тепло й живо, можна легкий гумор, але без шаржу й без штамп-зачинів («Усе почалося з того…»).
- Імена, тварин і деталі бери ВИКЛЮЧНО з тексту епізоду; не вигадуй нових персонажів чи подій.
- Бренди — кирилицею (вайбер, тікток, ютуб), без латиниці.
- Поверни ТІЛЬКИ текст шорту, без заголовків, лапок, пояснень чи вступних слів.

${titleLine}Текст епізоду:
"""
${sourceText}
"""`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash', generationConfig: { temperature: 0.85 } },
      { apiVersion: 'v1beta' },
    )
    const result = await model.generateContent(prompt)
    const shortScript = result.response.text().trim()

    if (!shortScript) {
      return NextResponse.json({ error: 'Порожня відповідь AI', targetId: target.id }, { status: 502 })
    }

    const { error: updErr } = await supabase
      .from('content')
      .update({ short_script: shortScript })
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
        short_script: shortScript,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg, targetId: target.id }, { status: 500 })
  }
}
