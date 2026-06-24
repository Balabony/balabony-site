import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { analyzeEpisodeContinuity } from '@/lib/canon/continuity'

// Кімната сценариста, Ф2a — AI-continuity по ОДНОМУ епізоду (кнопка «Хронологія»).
// Уся логіка — у lib/canon/continuity.ts (спільна з пакетним continuity-batch).
// POST { id } → { id, title, season, episode, prevCount, findings }

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

  const outcome = await analyzeEpisodeContinuity(getSupabaseAdmin(), apiKey, id)

  if (!outcome.ok) {
    return NextResponse.json(
      { error: outcome.error, overloaded: outcome.overloaded },
      { status: outcome.status },
    )
  }

  return NextResponse.json(outcome.data)
}
