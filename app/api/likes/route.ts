import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Лайки під історіями.
 *
 * Без реєстрації: читач приходить за посиланням від автора, і вимагати
 * від нього акаунт заради одного кліку — це втратити той клік. Особу
 * замінює visitor_id, який компонент тримає в localStorage.
 *
 * Ціна цього рішення названа прямо: анонімний лайк накручується — досить
 * почистити браузер. Тому це показник уваги для автора, а не метрика
 * для звітності донорам. Унікальність (content_id, visitor_id) захищає
 * лише від випадкового подвійного кліку.
 */

const MAX_ID = 64

function clean(value: string | null, max = MAX_ID): string {
  return String(value ?? '').trim().slice(0, max)
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const contentId = clean(url.searchParams.get('contentId'))
    const visitorId = clean(url.searchParams.get('visitorId'))

    if (!contentId) {
      return NextResponse.json({ ok: false, count: 0, liked: false }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // head: true — рахуємо на боці бази. Інакше Supabase мовчки віддає
    // максимум 1000 рядків, і популярний твір показував би 1000 назавжди.
    const { count, error } = await supabase
      .from('content_likes')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', contentId)

    if (error) throw error

    let liked = false
    if (visitorId) {
      const { data } = await supabase
        .from('content_likes')
        .select('content_id')
        .eq('content_id', contentId)
        .eq('visitor_id', visitorId)
        .maybeSingle()
      liked = Boolean(data)
    }

    return NextResponse.json({ ok: true, count: count ?? 0, liked })
  } catch (e) {
    const err = e as { message?: string }
    console.error('[likes:GET]', err?.message)
    return NextResponse.json({ ok: false, count: 0, liked: false }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown>
    try {
      body = (await req.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const contentId = clean(String(body.contentId ?? ''))
    const visitorId = clean(String(body.visitorId ?? ''))

    if (!contentId || !visitorId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: existing } = await supabase
      .from('content_likes')
      .select('content_id')
      .eq('content_id', contentId)
      .eq('visitor_id', visitorId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('content_likes')
        .delete()
        .eq('content_id', contentId)
        .eq('visitor_id', visitorId)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('content_likes')
        .insert({ content_id: contentId, visitor_id: visitorId })
      // Подвійний клік підряд ловиться унікальним індексом — це не помилка.
      if (error && error.code !== '23505') throw error
    }

    const { count } = await supabase
      .from('content_likes')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', contentId)

    return NextResponse.json({ ok: true, count: count ?? 0, liked: !existing })
  } catch (e) {
    const err = e as { message?: string }
    console.error('[likes:POST]', err?.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
