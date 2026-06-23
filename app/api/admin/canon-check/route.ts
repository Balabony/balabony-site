import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { checkCanon, type CanonRow } from '@/lib/canon/mechanical'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// POST { id } → механічний канон-звіт по одному епізоду.
// Дотягує текст (фінал у corrected_text, інакше text) + рядки canon_bible.
// Без AI. AI-continuity — окремо у Ф2.

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  // canon_bible може ще не існувати/бути порожньою — перевірки тоді
  // йдуть на вбудованих дефолтах, без падіння.
  let canon: CanonRow[] = []
  const { data: rows } = await supabase
    .from('canon_bible')
    .select('kind, key, canonical, forbidden, notes')
  if (Array.isArray(rows)) {
    canon = rows.map(r => ({
      kind: String(r.kind),
      key: String(r.key),
      canonical: String(r.canonical),
      forbidden: Array.isArray(r.forbidden) ? (r.forbidden as string[]) : [],
      notes: (r.notes as string | null) ?? null,
    }))
  }

  const findings = checkCanon(sourceText, canon)

  return NextResponse.json({
    id: ep.id,
    title: ep.title,
    season: ep.season_number,
    episode: ep.episode_number,
    words: (sourceText.match(/\S+/g) ?? []).length,
    counts: {
      error: findings.filter(f => f.severity === 'error').length,
      warn:  findings.filter(f => f.severity === 'warn').length,
    },
    findings,
  })
}
