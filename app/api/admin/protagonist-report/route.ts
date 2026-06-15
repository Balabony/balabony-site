import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Класифікатор героя — той самий, що в generate-cover (без генерації обкладинок).
async function detect(client: Anthropic, title: string, text: string): Promise<'panas' | 'ganya'> {
  if (!text) return 'panas'
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Серіал «Балабони» — комедія характерів, де ДВИГУН майже кожної серії — Панасові «винаходи»/авантюри, що стикаються зі здоровим глуздом села. За замовчуванням головний у кадрі — ПАНАС.

Постав ganya ЛИШЕ якщо серія — це насамперед історія БАБИ ГАНІ: центральна дія в кадрі — те, що РОБИТЬ або ЗАТІВАЄ сама Ганя (її кухня, готування, випічка, книга рецептів, її власний задум чи господарський проєкт), і саме вона рушій сюжету.

Це НЕ робить Ганю головною (тоді panas):
- вона просто присутня, свариться, кричить «АНУ ЦИТЬ!», лає Панаса чи реагує на його витівку;
- сюжет крутиться навколо техніки/винаходу/схеми (5G, блокчейн, дрон, «Матриця», Голлівуд, інтернет, біопаливо, квант, детектор тощо) — це майже завжди Панас, навіть якщо Ганя в кадрі;
- її імʼя є в назві, але двигун — Панасова авантюра.

Якщо непевно або обоє нарівні — panas. Подумай: чию ДІЮ має показувати обкладинка цієї серії?

Відповідай ОДНИМ словом: panas або ganya.

Назва: ${title}
Текст:
${text.slice(0, 2500)}`,
      }],
    })
    const out = msg.content[0]?.type === 'text' ? msg.content[0].text.toLowerCase() : ''
    return (out.includes('ganya') || out.includes('ганя')) ? 'ganya' : 'panas'
  } catch {
    return 'panas'
  }
}

// GET — список усіх серій (slug + title), без тексту (щоб не роздувати відповідь).
export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, season_number, episode_number')
    .eq('type', 'balabony')
    .order('season_number')
    .order('episode_number')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const episodes = (data || [])
    .filter(s => /^s\d+e\d+$/.test(s.slug || ''))
    .map(s => ({ slug: s.slug as string, title: (s.title as string) || (s.slug as string) }))
  return NextResponse.json({ episodes })
}

// POST {slugs:[...]} — класифікувати пакет серій. Пакетами, щоб не впертись у таймаут.
export async function POST(req: NextRequest) {
  try {
    const { slugs } = await req.json()
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ results: [] })
    }
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

    const client = new Anthropic({ apiKey: key })
    const supabase = getSupabaseAdmin()

    const { data } = await supabase
      .from('content')
      .select('slug, title, corrected_text')
      .in('slug', slugs)

    const map = new Map((data || []).map(r => [r.slug as string, r]))
    const results: { slug: string; title: string; character: 'panas' | 'ganya' }[] = []

    for (const slug of slugs as string[]) {
      const row = map.get(slug)
      const title = (row?.title as string) || slug
      const text = (row?.corrected_text as string) || ''
      const character = await detect(client, title, text)
      results.push({ slug, title, character })
      await new Promise(r => setTimeout(r, 400))
    }

    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
