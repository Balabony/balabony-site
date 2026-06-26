// app/api/admin/tysha-create/route.ts
// Створює нову порожню серію «Тиші» (type='tysha', status='draft') з наступним
// episode_number у Книзі 1. Повертає { id, slug, episode_number } для вибору в кабінеті.
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const supabase = getSupabaseAdmin()

    // Наступний episode_number серед наявних серій Тиші
    const { data: maxRow, error: maxErr } = await supabase
      .from('content')
      .select('episode_number')
      .eq('type', 'tysha')
      .order('episode_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (maxErr) throw maxErr

    const next = ((maxRow?.episode_number as number | null) ?? 0) + 1
    const slug = `tysha-s1e${String(next).padStart(2, '0')}`
    const id = randomUUID()

    const { error } = await supabase.from('content').insert({
      id,
      type: 'tysha',
      slug,
      title: `Серія ${next}. «Чернетка»`,
      status: 'draft',
      season_number: 1,
      episode_number: next,
      text: '',
      author_name: 'Назар Колодій',
      is_adult: true,
      images: '[]',
    })
    if (error) throw error

    return NextResponse.json({ ok: true, id, slug, episode_number: next })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
