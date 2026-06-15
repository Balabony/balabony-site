import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// GET /api/admin/export-texts
// Віддає всі серії «Балабони» одним файлом (slug, назва, повний текст),
// з роздільниками — для зовнішнього аудиту. Нічого не змінює в базі.
export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, text, corrected_text, humanized_text, published_version, season_number, episode_number')
    .eq('type', 'balabony')
    .order('season_number')
    .order('episode_number')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const episodes = (data || []).filter(s => /^s\d+e\d+$/.test(s.slug || ''))

  // Той самий вибір тексту, що й на сторінці серії: за published_version,
  // далі резервний ланцюжок, щоб не лишити серію порожньою.
  function pickBody(ep: Record<string, unknown>): string {
    const v = (ep.published_version as string) || ''
    const humanized = (ep.humanized_text as string) || ''
    const corrected = (ep.corrected_text as string) || ''
    const text = (ep.text as string) || ''
    if ((v === 'humanized' || v === 'corrected_humanized') && humanized) return humanized
    if (v === 'corrected' && corrected) return corrected
    return text || corrected || humanized || '(текст порожній)'
  }

  const parts: string[] = []
  parts.push(`БАЛАБОНИ — повні тексти серій (експорт)\nВсього: ${episodes.length}\n`)
  for (const ep of episodes) {
    const slug = (ep.slug as string) || ''
    const title = (ep.title as string) || ''
    const body = pickBody(ep)
    parts.push(
      '\n' +
      '================================================================\n' +
      `### ${slug.toUpperCase()} — ${title}\n` +
      '================================================================\n\n' +
      body.trim() + '\n'
    )
  }

  const body = parts.join('')
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="balabony_texts_export.txt"',
    },
  })
}
