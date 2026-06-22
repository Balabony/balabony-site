import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Admin-auth за тим самим патерном, що й решта admin-endpoint'ів.
function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// Батч-генерація recap «по одному»:
// фронтенд викликає цей endpoint у циклі, доки done=true.
// Кожен виклик: бере ОДИН найперший епізод без recap (з текстом),
// генерує 2-3-реченнєве резюме й зберігає. Так нема Vercel-timeout
// (один швидкий виклик за раз) і є природний прогрес.
//
// Варіант A (за рішенням Богдана): генеруємо все без покрокової вичитки;
// editor потім вибірково переглядає сумнівні. Вже наявні recap НЕ чіпаються.

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  const supabase = getSupabaseAdmin()

  // Скільки всього епізодів і скільки ще без recap — для прогресу на фронті.
  const { count: total } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'balabony')
    .eq('status', 'published')

  // Найперший епізод без recap (нумерація за порядком сезон/серія).
  // Пропускаємо перший епізод узагалі (season=1, episode=1) — для нього
  // recap «що було раніше» не потрібен.
  const { data: candidates, error: selErr } = await supabase
    .from('content')
    .select('id, title, text, season_number, episode_number')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .or('recap.is.null,recap.eq.')
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })
    .limit(2)

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }

  // Скільки лишилось без recap (для прогресу) — окремий лічильник.
  const { count: remainingBefore } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'balabony')
    .eq('status', 'published')
    .or('recap.is.null,recap.eq.')

  // Вибираємо перший придатний кандидат (з непорожнім текстом).
  const target = (candidates ?? []).find(c => (c.text ?? '').trim().length > 0)

  if (!target) {
    // Нема що генерувати — всі мають recap (або без тексту). Завершено.
    return NextResponse.json({
      done: true,
      total: total ?? 0,
      remaining: 0,
      processed: null,
    })
  }

  // Генерація recap (та сама логіка, що в /api/admin/recap).
  const titleLine = target.title?.trim() ? `Назва епізоду: «${target.title.trim()}»\n\n` : ''
  const prompt = `Ти — редактор україномовного серіалу «Балабони». Напиши дуже коротке резюме цього епізоду у форматі «що було раніше» — щоб слухач, який повертається після перерви, швидко згадав події.

Вимоги:
- РІВНО 2-3 речення, не більше.
- Тільки ключові події цього епізоду, без зайвих деталей.
- Українською мовою, у минулому часі, нейтральним оповідним тоном.
- Без спойлерів того, що буде далі; тільки те, що сталося в цьому епізоді.
- Поверни ТІЛЬКИ текст резюме, без заголовків, лапок, пояснень чи вступних слів.

${titleLine}Текст епізоду:
"""
${target.text}
"""`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' })
    const result = await model.generateContent(prompt)
    const recap = result.response.text().trim()

    if (!recap) {
      return NextResponse.json({ error: 'Порожня відповідь AI', targetId: target.id }, { status: 502 })
    }

    const { error: updErr } = await supabase
      .from('content')
      .update({ recap })
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
        recap,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg, targetId: target.id }, { status: 500 })
  }
}
