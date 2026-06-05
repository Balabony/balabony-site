import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const id = req.nextUrl.searchParams.get('id')

    // Завантажити одну історію для редагування
    if (id) {
      const { data, error } = await supabase
        .from('content')
        .select('id, title, author_name, genre, category, text, corrected_text, humanized_text, cover_url, is_adult, status')
        .eq('id', id)
        .eq('type', 'story')
        .maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'Не знайдено' }, { status: 404 })
      return NextResponse.json({ story: data })
    }

    // Список усіх історій для вибору
    const { data, error } = await supabase
      .from('content')
      .select('id, title, genre, is_adult, status, approved_at')
      .eq('type', 'story')
      .order('approved_at', { ascending: false, nullsFirst: false })
    if (error) throw error
    return NextResponse.json({ stories: data ?? [] })
  } catch (err) {
    const e = err as { message?: string; details?: string; code?: string }
    const detail = [e?.code && `[${e.code}]`, e?.message, e?.details]
      .filter(Boolean).join(' · ') || (typeof err === 'string' ? err : JSON.stringify(err))
    return NextResponse.json({ error: detail || 'Невідома помилка' }, { status: 500 })
  }
}
