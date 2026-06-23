import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// POST { id } → конвертує тире-діалоги ОДНОГО епізоду у формат «Імʼя: репліка».
// Пише ЧЕРНЕТКУ в content.dialog_converted. Оригінал (text/corrected_text)
// НЕ чіпає — рішення про перенесення за автором.
// Кімната сценариста тільки радить.

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  let id: string | undefined
  try {
    const body = await req.json()
    id = body?.id
  } catch {
    return NextResponse.json({ error: 'Невалідний запит' }, { status: 400 })
  }
  if (!id) {
    return NextResponse.json({ error: 'Не вказано id епізоду' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: ep, error: epErr } = await supabase
    .from('content')
    .select('id, title, text, corrected_text, season_number, episode_number')
    .eq('id', id)
    .single()

  if (epErr || !ep) {
    return NextResponse.json({ error: epErr?.message ?? 'Епізод не знайдено' }, { status: 404 })
  }

  const sourceText = ((ep.corrected_text as string | null) ?? '').trim() || ((ep.text as string | null) ?? '').trim()
  if (!sourceText) {
    return NextResponse.json({ error: 'Текст епізоду порожній' }, { status: 422 })
  }

  const prompt = `Ти — технічний редактор серіалу «Балабони». Перепиши текст епізоду, перевівши ДІАЛОГИ з тире у формат «Імʼя: репліка». Це механічна правка форми, НЕ переписування історії.

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

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash', generationConfig: { temperature: 0.2 } },
      { apiVersion: 'v1beta' },
    )
    const result = await model.generateContent(prompt)
    const converted = result.response.text().trim()

    if (!converted) {
      return NextResponse.json({ error: 'Порожня відповідь AI', targetId: id }, { status: 502 })
    }

    const { error: updErr } = await supabase
      .from('content')
      .update({ dialog_converted: converted })
      .eq('id', id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message, targetId: id }, { status: 500 })
    }

    return NextResponse.json({
      id: ep.id,
      title: ep.title,
      season: ep.season_number,
      episode: ep.episode_number,
      converted,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg, targetId: id }, { status: 500 })
  }
}
