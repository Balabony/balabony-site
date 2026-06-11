import { NextResponse } from 'next/server'
import { getOrCreateAnonUserId } from '@/lib/anon-user'
import { getBalance } from '@/lib/points'

export async function GET() {
  try {
    const userId = await getOrCreateAnonUserId()
    return NextResponse.json({ balance: await getBalance(userId) })
  } catch {
    return NextResponse.json({ balance: 0 })
  }
}
