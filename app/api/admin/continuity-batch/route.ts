import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { analyzeEpisodeContinuity } from '@/lib/canon/continuity'

// Кімната сценариста, Ф2c — ПАКЕТНИЙ continuity-реаудит.
// Патерн як у recap-batch: фронт викликає в циклі, доки done=true.
// Кожен виклик бере ОДИН епізод, якого ще немає в canon_audit, аналізує й
// зберігає. Так нема Vercel-timeout (один виклик за раз) і є природний прогрес.
//
// POST { reset: true } → чистить canon_audit, повертає лічильники для старту.
// POST {}              → обробляє наступний епізод без запису в audit.

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  let reset = false
  try {
    const body = await req.json()
    reset = body?.reset === true
  } catch {
    // порожнє тіло — звичайна ітерація
  }

  const supabase = getSupabaseAdmin()

  // Усі епізоди корпусу (для total і визначення наступного).
  const { data: eps, error: epsErr } = await supabase
    .from('content')
    .select('id, season_number, episode_number')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })

  if (epsErr) {
    return NextResponse.json({ error: epsErr.message }, { status: 500 })
  }

  const total = (eps ?? []).length

  // RESET: повна перезачистка перед новим прогоном.
  if (reset) {
    // delete з умовою, що завжди істинна (postgrest вимагає фільтр).
    const { error: delErr } = await supabase
      .from('canon_audit')
      .delete()
      .gte('checked_at', '1970-01-01')
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }
    return NextResponse.json({ done: false, reset: true, total, remaining: total, processed: null })
  }

  // Які епізоди вже в audit.
  const { data: done } = await supabase.from('canon_audit').select('episode_id')
  const doneSet = new Set((done ?? []).map(d => d.episode_id as string))

  const next = (eps ?? []).find(e => !doneSet.has(e.id))

  if (!next) {
    return NextResponse.json({ done: true, total, remaining: 0, processed: null })
  }

  const outcome = await analyzeEpisodeContinuity(supabase, apiKey, next.id)

  if (!outcome.ok) {
    // 503 Gemini — фронт зупиниться й зможе перезапустити (продовжить з місця).
    return NextResponse.json(
      { error: outcome.error, overloaded: outcome.overloaded, targetId: next.id },
      { status: outcome.status },
    )
  }

  const r = outcome.data
  const { error: upErr } = await supabase
    .from('canon_audit')
    .upsert({
      episode_id:   r.id,
      season:       r.season,
      episode:      r.episode,
      title:        r.title,
      prev_count:   r.prevCount,
      cont_errors:  r.findings.continuity.filter(c => c.severity === 'error').length,
      cont_warns:   r.findings.continuity.filter(c => c.severity === 'warn').length,
      voice_issues: r.findings.voices.length,
      summary:      r.findings.summary,
      findings:     r.findings,
      checked_at:   new Date().toISOString(),
    }, { onConflict: 'episode_id' })

  if (upErr) {
    return NextResponse.json({ error: upErr.message, targetId: next.id }, { status: 500 })
  }

  const remaining = Math.max(0, total - (doneSet.size + 1))

  return NextResponse.json({
    done: false,
    total,
    remaining,
    processed: {
      id: r.id,
      title: r.title,
      season: r.season,
      episode: r.episode,
      errors: r.findings.continuity.filter(c => c.severity === 'error').length,
      warns:  r.findings.continuity.filter(c => c.severity === 'warn').length,
    },
  })
}
