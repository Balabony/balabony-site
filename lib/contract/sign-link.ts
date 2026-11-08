// 08.11.2026 (рішення засновника «спростити підписання онлайн»): персональне посилання на підпис договору
// без входу в кабінет — /pidpys/<токен>. Токен = id автора + строк дії + підпис HMAC; у базі нічого не зберігається.
// Особу підтверджує не посилання, а одноразовий код, який приходить на пошту автора (п. 16.1 договору).
import { createHmac, timingSafeEqual } from 'crypto'

const SITE = 'https://balabony.com'
const DAYS = 21

function key(): string {
  const k = process.env.CONTRACT_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!k) throw new Error('Немає ключа для посилання на підпис')
  return k
}

const sig = (payload: string) => createHmac('sha256', key()).update(`pidpys:${payload}`).digest('base64url').slice(0, 24)

export function makeSignToken(authorId: string, days = DAYS): string {
  const exp = Math.floor(Date.now() / 1000) + days * 86400
  const payload = `${authorId}.${exp.toString(36)}`
  return `${payload}.${sig(payload)}`
}

/** id автора, якщо токен справжній і не прострочений; інакше null. */
export function readSignToken(token: string | null | undefined): string | null {
  const t = String(token || '')
  const i = t.lastIndexOf('.')
  if (i < 0) return null
  const payload = t.slice(0, i), s = t.slice(i + 1)
  const a = Buffer.from(sig(payload)), b = Buffer.from(s)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  const [authorId, exp36] = payload.split('.')
  if (!authorId || !exp36) return null
  if (parseInt(exp36, 36) * 1000 < Date.now()) return null
  return authorId
}

export function signLinkUrl(authorId: string): string {
  return `${SITE}/pidpys/${makeSignToken(authorId)}`
}
