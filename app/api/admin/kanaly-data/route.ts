import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Дані для сторінки /admin/kanaly — звіт по каналах приходу.
 *
 * Зводить в одне місце те, що досі лежало в різних таблицях:
 *   qr_hits          — переходи за короткими посиланнями (газета, пошта)
 *   qr_links         — самі посилання та їхні цілі
 *   paper_issues     — журнал газетних номерів (наклад вносимо руками)
 *   newsletter_sends — журнал розсилок
 *   subscribers      — підписки, з поміткою source
 *   article_reads    — дочитування
 *
 * Головне питання, на яке має відповідати сторінка: з якого каналу люди
 * приходять і скільки з них ДОЧИТУЮТЬ. Кліки без дочитувань нічого не варті.
 */

function checkAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value
  return cookie === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()

  // Вікно — 90 днів. Далі назад дивитись немає сенсу: платформа молода.
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const [links, hits, issues, sends, subs, reads] = await Promise.all([
    db.from('qr_links')
      .select('code, target, campaign, is_active, channel')
      .order('code'),
    db.from('qr_hits')
      .select('code, created_at, user_agent')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20000),
    db.from('paper_issues')
      .select('id, issue_date, paper_name, print_run, code, note')
      .order('issue_date', { ascending: false })
      .limit(200),
    db.from('newsletter_sends')
      .select('id, sent_at, subject, from_email, recipients, code, note')
      .order('sent_at', { ascending: false })
      .limit(200),
    db.from('subscribers')
      .select('email, source, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20000),
    db.from('article_reads')
      .select('article_slug, article_title, completed, read_date, read_percentage')
      .gte('read_date', since.slice(0, 10))
      .limit(20000),
  ])

  return NextResponse.json({
    links:   links.data   ?? [],
    hits:    hits.data    ?? [],
    issues:  issues.data  ?? [],
    sends:   sends.data   ?? [],
    subs:    subs.data    ?? [],
    reads:   reads.data   ?? [],
    errors: {
      links:  links.error?.message  ?? null,
      hits:   hits.error?.message   ?? null,
      issues: issues.error?.message ?? null,
      sends:  sends.error?.message  ?? null,
      subs:   subs.error?.message   ?? null,
      reads:  reads.error?.message  ?? null,
    },
  })
}

/** Додавання запису в журнал номерів або розсилок — прямо зі сторінки. */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    kind?: string
    issue_date?: string
    paper_name?: string
    print_run?: number
    code?: string
    note?: string
    subject?: string
    from_email?: string
    recipients?: number
    sent_at?: string
  }

  const db = getSupabaseAdmin()

  if (body.kind === 'issue') {
    if (!body.issue_date) {
      return NextResponse.json({ error: 'Вкажіть дату номера' }, { status: 400 })
    }
    const { error } = await db.from('paper_issues').insert({
      issue_date: body.issue_date,
      paper_name: body.paper_name ?? 'Життя',
      print_run:  body.print_run ?? null,
      code:       body.code ?? null,
      note:       body.note ?? null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.kind === 'send') {
    const { error } = await db.from('newsletter_sends').insert({
      sent_at:    body.sent_at ?? new Date().toISOString(),
      subject:    body.subject ?? null,
      from_email: body.from_email ?? null,
      recipients: body.recipients ?? null,
      code:       body.code ?? null,
      note:       body.note ?? null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Невідомий тип запису' }, { status: 400 })
}
