import { NextResponse } from 'next/server'
import { resolveReaderId } from '@/lib/reader-id'
import { getBalance } from '@/lib/points'

export async function GET() {
  try {
    const userId = await resolveReaderId()
    return NextResponse.json({ balance: await getBalance(userId) })
  } catch {
    return NextResponse.json({ balance: 0 })
  }
}
