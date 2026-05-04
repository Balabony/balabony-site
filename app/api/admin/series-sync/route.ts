import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const maxDuration = 300

// Called manually or via cron to generate covers for series that have none.
// Also fired automatically by /api/admin/series on every new insert.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  // Find all series without a cover
  const { data: rows, error } = await supabase
    .from('series')
    .select('id, title, description')
    .is('cover_url', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows || rows.length === 0) return NextResponse.json({ message: 'All series have covers', updated: 0 })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const results: Array<{ id: string; status: string; url?: string }> = []

  for (const row of rows) {
    try {
      const res = await fetch(`${baseUrl}/api/generate-cover`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ seriesId: row.id, title: row.title, description: row.description }),
      })

      if (!res.ok) {
        results.push({ id: row.id, status: 'error' })
        continue
      }

      const { url: coverUrl } = await res.json() as { url?: string }
      if (coverUrl) {
        await supabase.from('series').update({ cover_url: coverUrl }).eq('id', row.id)
        results.push({ id: row.id, status: 'ok', url: coverUrl })
      }
    } catch {
      results.push({ id: row.id, status: 'error' })
    }
  }

  return NextResponse.json({ updated: results.filter(r => r.status === 'ok').length, results })
}
