import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { castVote, getQueue, getMyVotes, getAuthors, getWorksByAuthor, getVoteState, VOTE_COST } from '@/lib/voice-queue'
import { getBalance } from '@/lib/points'

/**
 * Голосування за чергу озвучення: /api/voice-vote
 *
 * Голос прив'язується до АКАУНТА, не до анонімного cookie: інакше досить було
 * б почистити cookie, щоб голосувати за той самий твір нескінченно. Тому тут,
 * на відміну від читання, гість голосувати не може взагалі.
 */

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ?author=… віддає твори одного автора; без параметра — черга і список авторів.
  const author = req.nextUrl.searchParams.get('author')

  // ?content=… — стан одного твору для кнопки на сторінці твору. Легкий запит:
  // сторінка твору відкривається найчастіше, тягти туди чергу і всіх авторів
  // не можна.
  const content = req.nextUrl.searchParams.get('content')
  if (content) {
    const [state, balance] = await Promise.all([
      getVoteState(user?.id ?? null, content),
      user ? getBalance(user.id) : Promise.resolve(0),
    ])
    return NextResponse.json({
      ok: true,
      authorized: Boolean(user),
      cost: VOTE_COST,
      ...state,
      balance,
    })
  }

  if (author) {
    const works = await getWorksByAuthor(author)
    const mine = user ? await getMyVotes(user.id) : []
    return NextResponse.json({ ok: true, works, mine })
  }

  const [queue, authors] = await Promise.all([getQueue(20), getAuthors()])
  if (!user) {
    return NextResponse.json({ ok: true, authorized: false, queue, authors, mine: [], balance: 0 })
  }

  const [mine, balance] = await Promise.all([getMyVotes(user.id), getBalance(user.id)])
  return NextResponse.json({ ok: true, authorized: true, queue, authors, mine, balance })
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
