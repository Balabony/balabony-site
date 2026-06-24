import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Кімната сценариста, Ф2c — експорт результатів continuity-реаудиту в CSV.
// GET /api/admin/continuity-audit-export → файл canon-audit.csv.
// UTF-8 BOM + роздільник ";" — щоб Excel коректно показав кирилицю й колонки.
// Нічого не змінює. Сортує: спершу епізоди з найбільшою кількістю помилок.

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

interface ContIssue { severity?: string; issue?: string; source?: string }
interface VoiceIssue { character?: string; issue?: string }

// Екранування поля CSV: подвоюємо лапки, обгортаємо, прибираємо переноси.
function cell(v: unknown): string {
  const s = String(v ?? '').replace(/\r?\n/g, ' ').trim()
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('canon_audit')
    .select('season, episode, title, prev_count, cont_errors, cont_warns, voice_issues, summary, findings, checked_at')
    .order('cont_errors', { ascending: false })
    .order('cont_warns', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const header = ['Епізод', 'Назва', 'Помилок', 'Попереджень', 'Голоси', 'Суперечності (деталі)', 'Голоси (деталі)', 'Резюме', 'Епізодів в історії', 'Перевірено']

  const rows = (data ?? []).map(r => {
    const f = (r.findings ?? {}) as { continuity?: ContIssue[]; voices?: VoiceIssue[] }
    const contDetail = (f.continuity ?? [])
      .map(c => `[${c.severity ?? ''}${c.source ? ` ${c.source}` : ''}] ${c.issue ?? ''}`)
      .join(' | ')
    const voiceDetail = (f.voices ?? [])
      .map(v => `${v.character ?? ''}: ${v.issue ?? ''}`)
      .join(' | ')
    const tag = `S${r.season ?? '?'}E${r.episode ?? '?'}`
    return [
      tag, r.title, r.cont_errors, r.cont_warns, r.voice_issues,
      contDetail, voiceDetail, r.summary, r.prev_count, r.checked_at,
    ].map(cell).join(';')
  })

  const csv = '\uFEFF' + [header.map(cell).join(';'), ...rows].join('\r\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="canon-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
