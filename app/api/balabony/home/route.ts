import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import type { BalabonyHomeData } from '@/lib/types/balabony';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();

  const [newestRes, freeRes, archiveRes, countRes] = await Promise.all([
    supa
      .from('content')
      .select('*')
      .eq('type', 'balabony')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    supa
      .from('content')
      .select('*')
      .eq('type', 'balabony')
      .eq('season_number', 1)
      .eq('episode_number', 1)
      .maybeSingle(),

    supa
      .from('content')
      .select('id, slug, title, cover_url, season_number, episode_number')
      .eq('type', 'balabony')
      .order('created_at', { ascending: false })
      .limit(4),

    supa
      .from('content')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'balabony')
  ]);

  if (newestRes.error) {
    return NextResponse.json(
      { error: 'Failed to fetch newest episode', details: newestRes.error.message },
      { status: 500 }
    );
  }

  const data: BalabonyHomeData = {
    newest: newestRes.data,
    freeEpisode: freeRes.data ?? null,
    archivePreviews: archiveRes.data ?? [],
    totalCount: countRes.count ?? 0
  };

  return NextResponse.json(data);
}