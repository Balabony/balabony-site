import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = getSupabaseAdmin()

    await db.from('survey_responses').insert({
      session_id:   body.session_id ?? null,
      age:          body.age ?? null,
      gender:       body.gender ?? null,
      location:     body.location ?? null,
      device:       body.device ?? null,
      reading_time: body.reading_time ?? null,
      frequency:    body.frequency ?? null,
      format:       body.format ?? null,
      audio:        body.audio ?? null,
      duration:     body.duration ?? null,
      genres:       body.genres ?? [],
      genre_other:  body.genre_other ?? null,
      plan:         body.plan ?? null,
      source:       body.source ?? null,
      attraction:   body.attraction ?? null,
      missing:      body.missing ?? null,
      budget:       body.budget ?? null,
      sharing:      body.sharing ?? null,
      recommend:    body.recommend ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Survey submit error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
