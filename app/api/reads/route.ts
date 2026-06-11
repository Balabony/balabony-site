import { NextResponse } from 'next/server'
import { getOrCreateAnonUserId } from '@/lib/anon-user'
import { getSupabaseAdmin } from '@/lib/supabase-server'

async function countReads(userId: string): Promise<number> {
  const db = getSupabaseAdmin()
  const { count } = await db
    .from('user_episode_reads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

export async function GET() {
  try {
    const userId = await getOrCreateAnonUserId()
    return NextResponse.json({ total: await countReads(userId) })
  } catch {
    return NextResponse.json({ total: 0 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getOrCreateAnonUserId()
    const body = await req.json().catch(() => ({}))
    const slug = body?.slug
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ total: await countReads(userId) }, { status: 400 })
    }
    const db = getSupabaseAdmin()
    // ON CONFLICT DO NOTHING: повторне відкриття тієї ж серії не дублюється.
    await db.from('user_episode_reads').upsert(
      { user_id: userId, episode_slug: slug },
      { onConflict: 'user_id,episode_slug', ignoreDuplicates: true },
    )
    return NextResponse.json({ total: await countReads(userId) })
  } catch {
    return NextResponse.json({ total: 0 })
  }
}
