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
export async function mailApplicationAccepted(p: { fullName: string; email: string; title: string; note?: string; reconsidered?: boolean }): Promise<boolean> {
  const html = wrap(
    P(`Вітаємо, <strong style="color:#f5f0e8">${esc(p.fullName)}</strong>!`) +
    P(p.reconsidered
      ? `Редакція ще раз переглянула вашу історію <strong style="color:#ef9f27">«${esc(p.title)}»</strong> і змінила рішення: ми раді вітати вас серед авторів Балабонів.`
      : `Редакція прочитала вашу історію <strong style="color:#ef9f27">«${esc(p.title)}»</strong> і рада вітати вас серед авторів Балабонів.`) +
    P('Ваш кабінет автора вже відкрито. Щоб увійти:') +
    `<ol style="color:#c8d4e8;line-height:1.8;">
       <li>Відкрийте <a href="${SITE}/login" style="color:#ef9f27">${SITE}/login</a></li>
       <li>Увійдіть так само, як подавали заявку: через Google або з цією адресою — ${esc(p.email)}</li>
       <li>Угорі сайту з'явиться кнопка «Кабінет автора»</li>
     </ol>` +
    P('У кабінеті заповніть реквізити — вони потрібні для угоди й виплат. Вашу пробну історію ми вже додали туди як чернетку: далі вона йде звичайною редактурою перед публікацією.') +
    P(`Для обкладинки: опишіть головних героїв (зовнішність, одяг, характерна деталь) у кабінеті через «Написати редакції», тема «Обкладинка», або надішліть картинки героїв, створені ШІ, на ${EDITOR_EMAIL} — ми зробимо обкладинку.`) +
    (p.note ? P(`Поради редакції:<br>${esc(p.note).replace(/\n/g, '<br>')}`) : '') +
    SMALL(`Питання — пишіть на ${EDITOR_EMAIL} або з кабінету, форма «Написати редакції».`),
  )
  return send(p.email, '[Балабони] Ваш кабінет автора відкрито', html)
}

/** Лист після «Відхилити». Коментар редакції додається, якщо його написали. */
export async function mailApplicationRejected(p: { fullName: string; email: string; title: string; note: string }): Promise<boolean> {
  const html = wrap(
    P(`Вітаємо, <strong style="color:#f5f0e8">${esc(p.fullName)}</strong>!`) +
    P(`Дякуємо, що надіслали нам історію <strong style="color:#ef9f27">«${esc(p.title)}»</strong>. Редакція уважно її прочитала, але цього разу ми не готові її опублікувати.`) +
    (p.note ? P(`Коментар редакції:<br><em>${esc(p.note).replace(/\n/g, '<br>')}</em>`) : '') +
    P('Це не остаточне рішення щодо вас як автора. Ви можете надіслати іншу історію тією самою формою на сторінці «Стати автором», а також взяти участь у наших конкурсах: для них кабінет автора не потрібен.') +
    P(`<a href="${SITE}/konkursy" style="color:#ef9f27">${SITE}/konkursy</a>`) +
    SMALL('З повагою, редакція Балабонів'),
  )
  return send(p.email, `[Балабони] Відповідь на заявку: ${p.title}`, html)
}

/**
 * Інструкція «Як стати автором» — один раз, коли людина вперше відкриває
 * /become-author після входу і ще не подавала заявки (29.10.2026).
 * Причина: люди реєструвалися й застрягали на формі (PDF не приймається,
 * незрозуміло, як вставити текст), а потім писали листи «не вдалося надіслати».
 */
export async function mailAuthorGuide(email: string): Promise<boolean> {
  const LI = (t: string) => `<li style="margin-bottom:8px;">${t}</li>`
  const H = (t: string) => `<p style="color:#ef9f27;font-weight:700;margin:22px 0 6px;">${t}</p>`
  const html = wrap(
    P('Вітаємо! Ви відкрили сторінку «Стати автором». Ось коротка інструкція, як подати історію без зайвих клопотів.') +
    H('1. Входьте завжди однаково') +
    P(`Ви увійшли з адресою ${esc(email)}. Надалі входьте так само (через Google або посиланням на цю пошту), інакше кабінет автора відкриється не на тій адресі.`) +
    H('2. Заповніть заявку') +
    `<ol style="color:#c8d4e8;line-height:1.65;padding-left:20px;">` +
      LI(`Сторінка: <a href="${SITE}/become-author" style="color:#ef9f27">${SITE}/become-author</a>`) +
      LI('Прізвище та імʼя повністю, псевдонім (якщо є), телефон, назва історії, жанр.') +
      LI(`Текст історії: від ${APP_MIN_WORDS} до ${APP_MAX_WORDS} слів.`) +
      LI('Запитання із зірочкою обовʼязкові. Відповідайте коротко, своїми словами.') +
      LI('Дві позначки згоди внизу форми.') +
    `</ol>` +
    H('3. Як додати текст') +
    P('Файл Word (.docx) або текстовий (.txt), до 2 МБ. Або скопіюйте текст і вставте його в поле «…або вставте текст сюди».') +
    P('<strong style="color:#f5f0e8">PDF форма не приймає.</strong> Якщо історія у PDF чи в Google Документах — відкрийте її, виділіть увесь текст (Ctrl+A), скопіюйте (Ctrl+C) і вставте в поле (Ctrl+V).') +
    P('Перед надсиланням приберіть зайве: коментарі читачів, підписи, дати, посилання.') +
    H('4. Розділення на частини') +
    P('Між сценами поставте окремим рядком три зірочки: <strong style="color:#f5f0e8">***</strong> — на сайті це стане розділювачем. Порожні рядки й додаткові пробіли сайт не зберігає.') +
    H('Що далі') +
    P('Після надсилання прийде лист-підтвердження. Редакція прочитає історію протягом 5 робочих днів і відповість на цю пошту. Якщо історію прийнято, угорі сайту зʼявиться кнопка «Кабінет автора»: там ви заповните реквізити, підпишете угоду, а нові твори додаватимете самі.') +
    SMALL(`Щось не виходить — напишіть на ${EDITOR_EMAIL} і додайте знімок екрана.`),
  )
  return send(email, '[Балабони] Як подати історію: коротка інструкція', html)
}
