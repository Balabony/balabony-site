import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// Батч-конвертація тире-діалогів у «Імʼя:» «по одному»:
// фронтенд викликає у циклі, доки done=true. Кожен виклик — ОДИН епізод
// без dialog_converted. Оригінал (text/corrected_text) НЕ чіпаємо —
// пишемо лише чернетку в dialog_converted. Наявні чернетки не перезаписуємо.
// Без Vercel-timeout (один епізод за раз). Кімната тільки радить.

function buildPrompt(sourceText: string): string {
  return `Ти — технічний редактор серіалу «Балабони». Перепиши текст епізоду, перевівши ДІАЛОГИ з тире у формат «Імʼя: репліка». Це механічна правка форми, НЕ переписування історії.

ПРАВИЛА:
- Кожну пряму мову, оформлену через тире («— репліка»), переведи в рядок «Імʼя: репліка», де Імʼя — той, хто говорить.
- Спікера визнач за ремаркою-атрибуцією («— …, — сказав Панас» → Панас) або за контекстом сцени, якщо ремарка займенникова («— …, — спитала вона» → впізнай, хто це за контекстом, напр. Ганя).
- Ремарку-атрибуцію («сказав Панас», «спитала вона», «буркнув») ПРИБИРАЙ — лишається чистий «Імʼя: репліка».
- ВИРАЗНУ ДІЮ всередині ремарки («примружила ліве око», «погладив апарат») винеси в ОКРЕМИЙ рядок авторської нарації перед реплікою або після неї. Не втрачай її.
- Якщо точно не можеш визначити спікера — постав «Імʼя?: репліка» (зі знаком питання), щоб автор перевірив. Не вигадуй персонажів.
- Тире, що НЕ є прямою мовою (паузи, переліки, вставні конструкції, діапазони), НЕ чіпай.
- НАРАЦІЮ не переписуй і не скорочуй. Зберігай абзаци й порядок подій точно як в оригіналі.
- Імена — лише наявні в тексті; нічого не додавай і не прибирай зі змісту.
- Бренди лишай як в оригіналі (кирилицею).
- Поверни ТІЛЬКИ повний текст епізоду в новому форматі, без жодних пояснень, заголовків чи коментарів.

Текст епізоду:
"""
${sourceText}
"""`
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  const supabase = getSupabaseAdmin()

  const { count: total } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'balabony')
    .eq('status', 'published')

  const { data: candidates, error: selErr } = await supabase
    .from('content')
    .select('id, title, text, corrected_text, season_number, episode_number')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .or('dialog_converted.is.null,dialog_converted.eq.')
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })
    .limit(2)

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }

  const { count: remainingBefore } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'balabony')
    .eq('status', 'published')
    .or('dialog_converted.is.null,dialog_converted.eq.')

  const pickText = (c: { corrected_text?: string | null; text?: string | null }) =>
    ((c.corrected_text ?? '').trim() || (c.text ?? '').trim())

  const target = (candidates ?? []).find(c => pickText(c).length > 0)

  if (!target) {
    return NextResponse.json({ done: true, total: total ?? 0, remaining: 0, processed: null })
  }

  const sourceText = pickText(target)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash', generationConfig: { temperature: 0.2 } },
      { apiVersion: 'v1beta' },
    )
    const result = await model.generateContent(buildPrompt(sourceText))
    const converted = result.response.text().trim()

    if (!converted) {
      return NextResponse.json({ error: 'Порожня відповідь AI', targetId: target.id }, { status: 502 })
    }

    const { error: updErr } = await supabase
      .from('content')
      .update({ dialog_converted: converted })
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
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg, targetId: target.id }, { status: 500 })
  }
}
