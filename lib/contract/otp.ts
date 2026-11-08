// 08.11.2026 (рішення засновника «спростити підписання онлайн»): підписання договору одноразовим кодом з пошти —
// п. 16.1 договору v8.6, ст. 11–12 ЗУ «Про електронну комерцію». Автор читає договір, ставить «Погоджуюсь»,
// отримує 6 цифр на свою пошту й вводить їх. Ми зберігаємо час, пошту, IP, браузер і контрольну суму тексту (знімок),
// надсилаємо автору копію. Код зберігається лише як хеш; діє 15 хвилин; 5 спроб; не більше 5 кодів на годину.
import { createHmac, randomInt, timingSafeEqual } from 'crypto'
import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { saveContractSnapshot } from './snapshot'

const SITE = 'https://balabony.com'
const TTL_MIN = 15
const MAX_TRIES = 5
const MAX_PER_HOUR = 5

function key(): string {
  const k = process.env.CONTRACT_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!k) throw new Error('Немає ключа для кодів підпису')
  return k
}
const hashCode = (contractId: string, code: string) => createHmac('sha256', key()).update(`otp:${contractId}:${code}`).digest('hex')

export const SIGN_REQUIRED: [string, string][] = [
  ['full_name', 'прізвище, імʼя та по батькові'],
  ['rnokpp', 'РНОКПП'],
  ['birth_date', 'дата народження'],
  ['phone', 'телефон'],
]

export function maskEmail(e: string): string {
  const [u, d] = e.split('@')
  if (!d) return e
  return `${u.slice(0, 2)}${'•'.repeat(Math.max(1, Math.min(6, u.length - 2)))}@${d}`
}

type Ctx = { id: string; number: string; status: string; email: string | null; missing: string[] }

/** Чинний (не припинений) договір автора разом із поштою та переліком відсутніх реквізитів. */
export async function contractCtx(authorId: string, contractId?: string): Promise<Ctx | null> {
  const r = await dbQuery(
    `select c.id, c.number, c.status, u.email,
            p.full_name, p.rnokpp, p.birth_date::text as birth_date, p.phone
       from author_contracts c
       left join author_profiles p on p.user_id = c.author_id
       left join auth.users u on u.id = c.author_id
      where c.author_id = $1 and c.status <> 'terminated' ${contractId ? 'and c.id = $2' : ''}
      order by c.created_at desc limit 1`,
    contractId ? [authorId, contractId] : [authorId],
  )
  const row = r.rows[0] as Record<string, string | null> | undefined
  if (!row) return null
  return {
    id: row.id as string, number: row.number as string, status: row.status as string, email: row.email,
    missing: SIGN_REQUIRED.filter(([k]) => !String(row[k] ?? '').trim()).map(([, l]) => l),
  }
}

let resend: Resend | null = null
const mailer = () => (resend ??= new Resend(process.env.RESEND_API_KEY))
const FROM = () => process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com'

const wrap = (inner: string) => `<!DOCTYPE html><html lang="uk"><body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:28px;max-width:620px;margin:0 auto">
<div style="background:#0f1e3a;border-radius:16px;padding:26px;border:1px solid rgba(239,159,39,.35)">
<div style="font-size:22px;font-weight:700;color:#ef9f27;margin-bottom:18px">Балабони</div>${inner}</div></body></html>`

export async function sendSignCode(authorId: string, contractId: string): Promise<{ ok: true; to: string } | { ok: false; error: string; status: number }> {
  const c = await contractCtx(authorId, contractId)
  if (!c) return { ok: false, error: 'Договір не знайдено', status: 404 }
  if (c.status === 'signed') return { ok: false, error: 'Договір уже підписано', status: 409 }
  if (c.missing.length) return { ok: false, error: `Спершу впишіть: ${c.missing.join(', ')}`, status: 400 }
  if (!c.email) return { ok: false, error: 'У профілі немає електронної пошти — напишіть у редакцію', status: 400 }

  const recent = await dbQuery(
    `select count(*)::int as n from author_contract_otp where contract_id = $1 and created_at > now() - interval '1 hour'`,
    [c.id],
  )
  if (((recent.rows[0]?.n as number) ?? 0) >= MAX_PER_HOUR) {
    return { ok: false, error: 'Забагато кодів за годину. Спробуйте трохи пізніше або напишіть у редакцію.', status: 429 }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await dbQuery(
    `insert into author_contract_otp (contract_id, author_id, code_hash, email, expires_at)
     values ($1, $2, $3, $4, now() + ($5 || ' minutes')::interval)`,
    [c.id, authorId, hashCode(c.id, code), c.email, String(TTL_MIN)],
  )
  const sent = await mailer().emails.send({
    from: FROM(), to: c.email,
    subject: `Код для підписання договору № ${c.number}: ${code}`,
    html: wrap(`<p style="color:#c8d4e8;margin:0 0 14px">Ваш код для підписання авторського договору № ${c.number}:</p>
<div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#fff;background:rgba(255,255,255,.06);border-radius:12px;padding:16px;text-align:center;margin-bottom:16px">${code}</div>
<p style="color:#c8d4e8;margin:0 0 8px">Код діє ${TTL_MIN} хвилин. Введіть його на сторінці договору — і договір буде підписано.</p>
<p style="color:#8899bb;font-size:13px;margin:16px 0 0">Ви не підписували договір? Просто проігноруйте цей лист — без коду нічого не станеться.</p>`),
  })
  // Resend не кидає виняток, а повертає { error } — інакше автор бачив би «надіслано», а листа немає
  if (sent?.error) { console.error('[otp] resend', sent.error); return { ok: false, error: 'Не вдалося надіслати лист із кодом. Спробуйте ще раз за хвилину або напишіть у редакцію.', status: 502 } }
  return { ok: true, to: maskEmail(c.email) }
}

export async function verifySignCode(
  authorId: string, contractId: string, code: string,
  meta: { ip: string | null; ua: string | null; worksClean: boolean; via: 'cabinet' | 'link' },
): Promise<{ ok: true; number: string } | { ok: false; error: string; status: number }> {
  const c = await contractCtx(authorId, contractId)
  if (!c) return { ok: false, error: 'Договір не знайдено', status: 404 }
  if (c.status === 'signed') return { ok: false, error: 'Договір уже підписано', status: 409 }
  const clean = String(code || '').replace(/\D/g, '')
  if (clean.length !== 6) return { ok: false, error: 'Код — це 6 цифр з листа', status: 400 }

  const r = await dbQuery(
    `select id, code_hash, email, attempts from author_contract_otp
      where contract_id = $1 and used_at is null and expires_at > now()
      order by created_at desc limit 1`,
    [c.id],
  )
  const otp = r.rows[0] as { id: string; code_hash: string; email: string; attempts: number } | undefined
  if (!otp) return { ok: false, error: 'Код прострочено. Натисніть «Надіслати код ще раз».', status: 400 }
  if (otp.attempts >= MAX_TRIES) return { ok: false, error: 'Забагато спроб. Надішліть новий код.', status: 429 }

  const a = Buffer.from(hashCode(c.id, clean)), b = Buffer.from(otp.code_hash)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await dbQuery(`update author_contract_otp set attempts = attempts + 1 where id = $1`, [otp.id])
    const left = MAX_TRIES - otp.attempts - 1
    return { ok: false, error: left > 0 ? `Код не збігається. Залишилось спроб: ${left}.` : 'Код не збігається. Надішліть новий код.', status: 400 }
  }

  await dbQuery(`update author_contract_otp set used_at = now() where id = $1`, [otp.id])
  const evidence = { method: 'otp-email', email: otp.email, otp_id: otp.id, ip: meta.ip, ua: meta.ua?.slice(0, 300) ?? null, via: meta.via, works_clean: meta.worksClean, at: new Date().toISOString() }
  const up = await dbQuery(
    `update author_contracts set status = 'signed', signed_at = now(), sign_method = 'otp', sign_evidence = $1::jsonb
      where id = $2 and status <> 'signed'`,
    [JSON.stringify(evidence), c.id],
  )
  if (!up.rowCount) return { ok: false, error: 'Договір уже підписано', status: 409 }

  // Твори, які автор сам підтвердив галочкою «раніше ніде не публікувалися» (п. 2.3, 2.7): підтверджуємо гуртом.
  if (meta.worksClean) {
    await dbQuery(`update contract_works set confirmed_at = now() where contract_id = $1 and confirmed_at is null`, [c.id]).catch((e) => console.error('[otp] works confirm', e))
  }
  await saveContractSnapshot(c.id)

  // Копія договору автору (п. 16.1): посилання на підписаний текст у кабінеті
  try {
    await mailer().emails.send({
      from: FROM(), to: otp.email,
      subject: `Договір № ${c.number} підписано`,
      html: wrap(`<p style="color:#c8d4e8;margin:0 0 12px">Дякуємо! Авторський договір № ${c.number} підписано ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })} одноразовим кодом, надісланим на цю адресу.</p>
<p style="margin:18px 0"><a href="${SITE}/author/contract/${c.id}" style="background:#ef9f27;color:#0a1628;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Відкрити підписаний договір</a></p>
<p style="color:#8899bb;font-size:13px;margin:0">Текст договору в тому вигляді, в якому Ви його підписали, збережено і доступний у кабінеті будь-коли. Його можна роздрукувати або зберегти як PDF.</p>`),
    })
  } catch (e) { console.error('[otp] copy email', e) }
  return { ok: true, number: c.number }
}
