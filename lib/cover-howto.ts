import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { toHtml } from '@/lib/author-emails'

/**
 * Лист авторам «Зробіть обкладинку через Gemini» (20.10.2026) — автоматично, щоранку
 * разом із /api/cron/pending-check (10:00 за Києвом).
 *
 * Кому: автор має хоча б один опублікований твір без обкладинки, вказав пошту, не відписався
 * від розсилки й не відмовив у згоді. Кожен автор отримує лист ОДИН раз (журнал author_emails,
 * template = 'cover_howto') — далі автор сам переглядає свої твори в кабінеті.
 * Не більше 25 листів за ранок: безкоштовний Resend — 100 на добу на всю платформу.
 */
const SUBJECT = 'Обкладинки для ваших творів — за 5 хвилин через Gemini'
const LIMIT = 25
const BLOCKED = ['refused', 'revoked']

function letter(name: string, n: number) {
  return [
    `Вітаю${name ? ', ' + name : ''}!`,
    '',
    `На Балабонах ${n === 1 ? 'один ваш твір поки без обкладинки' : `кілька ваших творів (${n}) поки без обкладинки`}. Читач спершу бачить картинку, а вже потім назву: твори з обкладинкою відкривають частіше, а від прочитань залежать місце твору в розділі «Що читають» і ваша винагорода за прочитання.`,
    '',
    'Будь ласка, перегляньте свої твори в кабінеті автора й додайте обкладинки там, де їх немає. Це безкоштовно й займає кілька хвилин:',
    '',
    '1. Відкрийте gemini.google.com і увійдіть через свій Google-акаунт.',
    '2. Напишіть прохання, наприклад:',
    '«Створи ілюстрацію-обкладинку до оповідання. Сюжет: [2–3 речення про твір]. Настрій: [теплий / тривожний / казковий]. Стиль: книжкова ілюстрація. Горизонтальний формат 3:2. Без тексту й літер на зображенні.»',
    '3. Якщо не подобається — попросіть: «зроби світліше», «додай осінь», «інший ракурс».',
    '4. Збережіть картинку на комп’ютер або телефон.',
    '5. Кабінет автора: https://balabony.com/author/dashboard — під потрібним твором натисніть «Додати фото», оберіть файл і «Зберегти обкладинку».',
    '',
    'Щоб не було проблем із правами:',
    '• не використовуйте фото реальних людей, відомих персонажів (мультфільмів, кіно), логотипів і брендів;',
    '• не беріть готові картинки з інтернету — лише створені вами;',
    '• без тексту на обкладинці — назву сайт покаже сам.',
    '',
    'Якщо щось не вийде — просто відпишіть на цей лист, допоможемо.',
    '',
    'З повагою,',
    'Назар Колодій',
    'Balabony',
  ].join('\n')
}

type Row = { user_id: string; name: string; email: string; n: number }

/** Повертає перелік «кому надіслано» для щоденного звіту засновнику. */
export async function sendCoverHowto(): Promise<string[]> {
  if (!process.env.RESEND_API_KEY) return []
  const r = await dbQuery(
    `select p.user_id::text, coalesce(nullif(trim(p.display_name), ''), '') as name,
            coalesce(p.email, u.email) as email, count(*)::int as n
       from content c
       join author_profiles p on p.user_id = c.author_id
       left join auth.users u on u.id = p.user_id
      where c.status in ('approved', 'published') and coalesce(c.cover_url, '') = ''
        and coalesce(p.newsletter_opt_out, false) = false
        and coalesce(p.email, u.email) is not null
        and not exists (select 1 from author_emails e where e.author_id = p.user_id and e.template = 'cover_howto' and e.status = 'sent')
      group by p.user_id, p.display_name, p.email, u.email
      order by n desc
      limit $1`,
    [LIMIT],
  )
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com'
  const replyTo = process.env.RESEND_REPLY_TO ?? 'nazar@balabony.com'
  const done: string[] = []
  for (const a of r.rows as Row[]) {
    // згода: відмовився або відкликав — не пишемо
    try {
      const c = await dbQuery(
        `select status::text as status from author_consents
          where scope = 'balabony' and lower(trim(author_name)) = lower(trim($1))
          order by happened_at desc nulls last, created_at desc limit 1`,
        [a.name],
      )
      const st = (c.rows[0] as { status?: string } | undefined)?.status
      if (st && BLOCKED.includes(st)) continue
    } catch { /* таблиці згод може не бути */ }
    const text = letter(a.name, a.n)
    let err: string | null = null
    try {
      const res = await resend.emails.send({ from, replyTo, to: a.email.trim(), subject: SUBJECT, html: toHtml(text), text })
      if (res.error) err = res.error.message || 'Resend відхилив лист'
    } catch (e) { err = (e as Error)?.message ?? 'помилка надсилання' }
    try {
      await dbQuery(
        `insert into author_emails (author_id, email, template, subject, status, error) values ($1, $2, 'cover_howto', $3, $4, $5)`,
        [a.user_id, a.email.trim(), SUBJECT, err ? 'failed' : 'sent', err],
      )
    } catch { /* журнал не критичний */ }
    if (!err) done.push(`${a.name || a.email} (${a.n})`)
  }
  return done
}
