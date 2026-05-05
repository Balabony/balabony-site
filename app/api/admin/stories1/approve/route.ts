import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

const STATUS_MAP: Record<string, string> = {
  approve:  'approved',
  reject:   'rejected',
  revision: 'revision',
}

const STATUS_MSG: Record<string, string> = {
  approved: 'Історію схвалено та опубліковано.',
  rejected: 'Історію відхилено.',
  revision: 'Відправлено на доопрацювання.',
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { authorName, title, genre, text, photoBase64, aiReport, action, adminNotes, correctedText, changes, publishedVersion } = await req.json()

    if (!title || !genre || !text || !action) {
      return NextResponse.json({ error: 'title, genre, text, action required' }, { status: 400 })
    }

    const status = STATUS_MAP[action]
    if (!status) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const storyId  = crypto.randomUUID()

    const { error: insertError } = await supabase.from('stories').insert({
      id:                storyId,
      author_name:       authorName || '',
      title,
      genre,
      text,
      status,
      ai_report:         aiReport ?? null,
      ai_score:          aiReport?.overall?.recommendation ?? null,
      admin_notes:       adminNotes || null,
      corrected_text:    correctedText || null,
      changes:           changes ?? null,
      published_version: publishedVersion ?? 'original',
      approved_at:       status === 'approved' ? new Date().toISOString() : null,
    })

    if (insertError) throw insertError

    // Fire cover generation asynchronously only on approval with photo
    if (status === 'approved' && photoBase64) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
      fetch(`${baseUrl}/api/admin/stories1/generate-cover`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ storyId, title, genre, photoBase64 }),
      })
        .then(async r => {
          if (!r.ok) return
          const { url: coverUrl } = await r.json() as { url?: string }
          if (coverUrl) {
            await supabase.from('stories').update({ cover_url: coverUrl }).eq('id', storyId)
          }
        })
        .catch(() => {})
    }

    return NextResponse.json({
      id:      storyId,
      status,
      message: STATUS_MSG[status],
      coverGenerating: status === 'approved' && !!photoBase64,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
