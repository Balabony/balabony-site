// 07.11.2026: відписка від листів редакції одним кліком із листа (посилання + заголовок List-Unsubscribe).
import { createHmac, timingSafeEqual } from 'crypto'

const SITE = 'https://balabony.com'

function key(): string {
  const k = process.env.UNSUB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!k) throw new Error('Немає ключа для посилання відписки')
  return k
}

export function unsubToken(userId: string): string {
  return createHmac('sha256', key()).update(`unsub:${userId}`).digest('base64url').slice(0, 32)
}

export function checkUnsubToken(userId: string, token: string): boolean {
  const a = Buffer.from(unsubToken(userId)), b = Buffer.from(token || '')
  return a.length === b.length && timingSafeEqual(a, b)
}

export function unsubUrl(userId: string): string {
  return `${SITE}/api/author/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubToken(userId)}`
}
