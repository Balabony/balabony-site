// =============================================================================
// ЗАЯВКИ АВТОРІВ — спільне для форми, API і адмінки
//
// Тут межі обсягу й тексти листів. Маршрути лише викликають ці функції:
// правити формулювання — тут, а не в route.ts.
// =============================================================================

import { Resend } from 'resend'

/** Пробна історія: коротка історія до ~10 хвилин або одна серія. */
export const APP_MIN_WORDS = 150
export const APP_MAX_WORDS = 5000
export const APP_MAX_FILE_BYTES = 2 * 1024 * 1024

/** Пошта редакції: сюди приходить копія кожної заявки. */
export const EDITOR_EMAIL = 'nazar@balabony.com'

const SITE = 'https://balabony.com'

/** Екранує текст для вставки в HTML листа. */
export function esc(v: string | null | undefined): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Знімає назву поля, випадково вставлену разом зі значенням («Ім'я: …»). */
export function stripFieldLabel(value: string): string {
  return value
    .replace(/^\s*(ім['ʼ’]я|імя|прізвище|назва|автор|пошта|email|псевдонім|телефон)\s*:\s*/iu, '')
    .trim()
}

function wrap(inner: string): string {
  return `
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px;max-width:680px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:16px;padding:28px;border:1px solid rgba(239,159,39,0.3);">
    <div style="font-size:22px;font-weight:700;color:#ef9f27;margin-bottom:20px;">Balabony</div>
    ${inner}
  </div>
</body>`
}

const P = (t: string) => `<p style="color:#c8d4e8;line-height:1.65;">${t}</p>`
const SMALL = (t: string) => `<p style="color:#8899bb;font-size:13px;line-height:1.6;">${t}</p>`

async function send(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !to) return false
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com'
  try {
    await resend.emails.send({ from, to, subject, html, ...(replyTo ? { replyTo } : {}) })
    return true
  } catch (e) {
    console.error('[author-applications] mail', (e as Error)?.message)
    return false
  }
}

type AppInfo = {
  id: string
  fullName: string
  penName: string
  email: string
  phone: string
  title: string
  genre: string
  words: number
}

/** Підтвердження автору + копія редакції одразу після подачі. */
export async function mailApplicationReceived(a: AppInfo): Promise<void> {
  const toAuthor = wrap(
    P(`Вітаємо, <strong style="color:#f5f0e8">${esc(a.fullName)}</strong>!`) +
    P(`Ми отримали вашу пробну історію <strong style="color:#ef9f27">«${esc(a.title)}»</strong> (${a.words} слів).`) +
    P('Редакція прочитає її протягом 5 робочих днів і відповість на цю адресу. Якщо історія підійде, для вас відкриється кабінет автора: там ви заповните реквізити й підпишете угоду.') +
    SMALL(`Лист не прийшов або є питання — пишіть на ${EDITOR_EMAIL}.`),
  )
  await send(a.email, `[Балабони] Заявку автора отримано: ${a.title}`, toAuthor)

  const toEditor = wrap(
    P(`<strong style="color:#ef9f27">Нова заявка автора #${esc(a.id)}</strong>`) +
    P(`${esc(a.fullName)}${a.penName ? ` (псевдонім: ${esc(a.penName)})` : ''}<br>${esc(a.email)} · ${esc(a.phone)}`) +
    P(`Історія: «${esc(a.title)}»${a.genre ? `, ${esc(a.genre)}` : ''} — ${a.words} слів`) +
    P(`Читати й вирішувати: <a href="${SITE}/admin/zayavky-avtoriv" style="color:#ef9f27">${SITE}/admin/zayavky-avtoriv</a>`),
  )
  await send(EDITOR_EMAIL, `[Заявка автора] ${a.fullName} — ${a.title}`, toEditor, a.email)
}

/** Лист після «Прийняти». Вхід — звичайним шляхом через /login, без одноразових посилань, які згорають. */
export async function mailApplicationAccepted(p: { fullName: string; email: string; title: string }): Promise<boolean> {
  const html = wrap(
    P(`Вітаємо, <strong style="color:#f5f0e8">${esc(p.fullName)}</strong>!`) +
    P(`Редакція прочитала вашу історію <strong style="color:#ef9f27">«${esc(p.title)}»</strong> і рада вітати вас серед авторів Балабонів.`) +
    P('Ваш кабінет автора вже відкрито. Щоб увійти:') +
    `<ol style="color:#c8d4e8;line-height:1.8;">
       <li>Відкрийте <a href="${SITE}/login" style="color:#ef9f27">${SITE}/login</a></li>
       <li>Увійдіть так само, як подавали заявку: через Google або з цією адресою — ${esc(p.email)}</li>
       <li>Угорі сайту з'явиться кнопка «Кабінет автора»</li>
     </ol>` +
    P('У кабінеті заповніть реквізити — вони потрібні для угоди й виплат. Вашу пробну історію ми вже додали туди як чернетку: далі вона йде звичайною редактурою перед публікацією.') +
    SMALL(`Питання — пишіть на ${EDITOR_EMAIL} або з кабінету, форма «Написати редакції».`),
  )
  return send(p.email, '[Балабони] Ваш кабінет автора відкрито', html)
}

/** Лист після «Відхилити». Коментар редакції додається, якщо його написали. */
export async function mailApplicationRejected(p: { fullName: string; email: string; title: string; note: string }): Promise<boolean> {
  const html = wrap(
    P(`Вітаємо, <strong style="color:#f5f0e8">${esc(p.fullName)}</strong>!`) +
    P(`Дякуємо, що надіслали нам історію <strong style="color:#ef9f27">«${esc(p.title)}»</strong>. Редакція уважно її прочитала, але цього разу ми не готові її опублікувати.`) +
    (p.note ? P(`Коментар редакції: <em>${esc(p.note)}</em>`) : '') +
    P('Це не остаточне рішення щодо вас як автора. Ви можете надіслати іншу історію тією самою формою на сторінці «Стати автором», а також взяти участь у наших конкурсах: для них кабінет автора не потрібен.') +
    P(`<a href="${SITE}/konkursy" style="color:#ef9f27">${SITE}/konkursy</a>`) +
    SMALL('З повагою, редакція Балабонів'),
  )
  return send(p.email, `[Балабони] Відповідь на заявку: ${p.title}`, html)
}
