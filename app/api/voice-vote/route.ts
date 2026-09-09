import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { castVote, getQueue, getMyVotes, getCandidates } from '@/lib/voice-queue'
import { getBalance } from '@/lib/points'

/**
 * Голосування за чергу озвучення: /api/voice-vote
 *
 * Голос прив'язується до АКАУНТА, не до анонімного cookie: інакше досить було
 * б почистити cookie, щоб голосувати за той самий твір нескінченно. Тому тут,
 * на відміну від читання, гість голосувати не може взагалі.
 */

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [queue, candidates] = await Promise.all([getQueue(20), getCandidates(24)])
  if (!user) {
    return NextResponse.json({ ok: true, authorized: false, queue, candidates, mine: [], balance: 0 })
  }

  const [mine, balance] = await Promise.all([getMyVotes(user.id), getBalance(user.id)])
  return NextResponse.json({ ok: true, authorized: true, queue, candidates, mine, balance })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Щоб голосувати, увійдіть у кабінет' }, { status: 401 })
  }

  let contentId = ''
  try {
    const body = await req.json()
    contentId = String(body?.content_id ?? '').trim()
  } catch {
    return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
  }

  if (!contentId) {
    return NextResponse.json({ ok: false, error: 'Не вказано твір' }, { status: 400 })
  }

  const result = await castVote(user.id, contentId)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
