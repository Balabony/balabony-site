import { after } from 'next/server'
import { routeEntry } from '@/lib/contest-routing'
import { acceptEntry } from '@/lib/contest-accept'
import { checkEntryOriginality } from '@/lib/contest-originality-run'
import { runContestReview, reviewHash, REVIEW_MODEL } from '@/lib/contest-ai-review'
import { NextRequest, NextResponse } from 'next/server'
import { alertIfFailed } from '@/lib/problem-alert'
import { Resend } from 'resend'
import mammoth from 'mammoth'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { toPlainText } from '@/lib/plain-text'
import { CONTESTS, findContest, isOpen, acceptsEpisodes, countWords } from '@/lib/contests'
import { realPen } from '@/lib/pen-name'
import { greetName } from '@/lib/greeting'

/**
 * Прийом конкурсних заявок: /api/contest/submit
 *
 * Чому окремо від /api/author/message. Форма «Написати редакції» — це лист:
 * одне поле, стеля 8000 символів, і воно ріже текст мовчки. Одна серія
 * серіалу — 11 тисяч символів, тобто подати конкурсний твір листом фізично
 * неможливо. Тут файли, а не поле для вставляння.
 *
 * Текст з .docx витягуємо на сервері й одразу чистимо через toPlainText:
 * у проєкті вже ухвалено, що розмітка з Word у художній текст не потрапляє
 * (див. lib/plain-text.ts). Оригінальний файл не зберігаємо — редакції
 * потрібен саме текст, а зайве сховище тягне за собою бакет і права доступу.
 *
 * GET повертає заявки автора, щоб форма показала, що вже прийнято, і на якій
 * серії людина зупинилася.
 */

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_FILES_PER_REQUEST = 10

interface EntryRow {
  id: string
  contest: string
  title: string
  annotation: string
  genre: string
  status: string
  created_at: string
}

interface EpisodeRow {
  entry_id: string
  ord: number
  words: number
  filename: string
}

async function readFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()

  if (name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer })
    return toPlainText(result.value)
  }
  // .txt і все інше читаємо як звичайний текст: Word 97 (.doc) mammoth не
  // відкриває, тому такі файли відсіюємо ще у формі.
  return toPlainText(buffer.toString('utf-8'))
}

// 21.10.2026: ім'я автора для заявки — псевдонім або ім'я з профілю. Якщо обох немає, форма просить вписати ім'я
// (раніше заявки йшли з «ім'я в профілі не вказано» — 7 робіт на 20.10).
async function profileName(userId: string): Promise<string> {
  try {
    const r = await dbQuery(`select display_name, pen_name from author_profiles where user_id = $1 limit 1`, [userId])
    const row = r.rows[0] as { display_name: string | null; pen_name: string | null } | undefined
    return (realPen(row?.pen_name) || (row?.display_name ?? '').trim())
  } catch { return '' }
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: true, authorized: false, entries: [] })
  const needName = !(await profileName(user.id))

  try {
    const e = await dbQuery(
      `select id::text, contest, title, annotation, genre, status, created_at
         from contest_entries
        where author_id = $1
        order by created_at`,
      [user.id],
    )
    const entries = e.rows as EntryRow[]

    if (entries.length === 0) {
      return NextResponse.json({ ok: true, authorized: true, needName, entries: [] })
    }

    const eps = await dbQuery(
      `select entry_id::text, ord, words, filename
         from contest_episodes
        where entry_id = any($1::bigint[])
        order by ord`,
      [entries.map(r => r.id)],
    )
    const byEntry = new Map<string, EpisodeRow[]>()
    for (const row of eps.rows as EpisodeRow[]) {
      const list = byEntry.get(row.entry_id) ?? []
      list.push(row)
      byEntry.set(row.entry_id, list)
    }

    return NextResponse.json({
      ok: true,
      authorized: true,
      needName,
      entries: entries.map(r => ({ ...r, episodes: byEntry.get(r.id) ?? [] })),
    })
  } catch (err) {
    console.error('[contest/submit] get', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося прочитати ваші заявки' }, { status: 500 })
  }
}

async function handlePOST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Потрібно увійти в кабінет' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
  }

  const contestId = String(form.get('contest') ?? '')
  const contest = findContest(contestId)
  if (!contest) {
    return NextResponse.json({ ok: false, error: 'Виберіть конкурс' }, { status: 400 })
  }
  // Прийом ЗАЯВОК і дозаливка СЕРІЙ мають різні строки — див. acceptsEpisodes.
  // Тут рубаємо лише те, що вже точно пізно: коли навіть серії не приймаються.
  // Заборону створювати НОВУ заявку після closesAt перевіряємо нижче, коли
  // вже видно, чи є в автора заявка на цей конкурс.
  if (!acceptsEpisodes(contest)) {
    return NextResponse.json(
      { ok: false, error: `Прийом на цей конкурс триває з ${contest.opensAt} до ${contest.closesAt}` },
      { status: 400 },
    )
  }

  // 22.09.2026: підтвердження межі щодо ШІ (лише правопис і граматика) — обовʼязкове для кожної подачі.
  if (form.get('aiConsent') !== 'yes') {
    return NextResponse.json({ ok: false, error: 'Поставте позначку про використання штучного інтелекту' }, { status: 400 })
  }
  // 22.09.2026: підтвердження, що твір не опублікований на інших платформах (умови всіх конкурсів).
  if (form.get('newConsent') !== 'yes') {
    return NextResponse.json({ ok: false, error: 'Поставте позначку, що твір не опублікований на інших платформах' }, { status: 400 })
  }

  const title = String(form.get('title') ?? '').trim().slice(0, 200)
  const annotation = String(form.get('annotation') ?? '').trim().slice(0, 1500)
  const genre = String(form.get('genre') ?? '').trim().slice(0, 100)
  // 14.10.2026: опис головних героїв для обкладинки (необовʼязково).
  const coverBrief = String(form.get('coverBrief') ?? '').trim().slice(0, 3000)

  // Порядок серій.
  //
  // Тест 09.09.2026 показав, що покладатися на порядок, у якому браузер
  // віддає прикріплені файли, не можна: три файли пішли в базу задом наперед
  // (seria_3 стала першою серією). Залежить від того, як їх виділили в
  // діалозі вибору, і не гарантовано нічим.
  //
  // Для конкурсу серіалів це найгірша з можливих поломок: автор надсилає
  // десять частин, читач отримує їх у зворотному порядку, і помітять це вже
  // після публікації.
  //
  // Тому шикуємо за іменем файлу натуральним порядком — числа порівнюємо як
  // числа, інакше «Частина 10» стає між першою і другою.
  const collator = new Intl.Collator('uk', { numeric: true, sensitivity: 'base' })
  const files = form.getAll('files')
    .filter((f): f is File => f instanceof File && f.size > 0)
    .sort((a, b) => collator.compare(a.name, b.name))

  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: 'Прикріпіть хоча б один файл' }, { status: 400 })
  }
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ ok: false, error: 'За один раз не більше десяти файлів' }, { status: 400 })
  }
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      return NextResponse.json({ ok: false, error: `Файл «${f.name}» більший за 2 МБ` }, { status: 400 })
    }
  }

  // --- Хто подає -----------------------------------------------------------
  let authorName = ''
  let email = String(user.email ?? '').trim()
  try {
    const r = await dbQuery(
      `select coalesce(p.display_name, '') as display_name,
              coalesce(p.email, u.email)   as email
         from author_profiles p
         left join auth.users u on u.id = p.user_id
        where p.user_id = $1
        limit 1`,
      [user.id],
    )
    const row = r.rows[0] as { display_name: string; email: string | null } | undefined
    if (row) {
      authorName = row.display_name ?? ''
      email = String(row.email ?? email).trim()
    }
  } catch {
    // профілю ще немає — подати все одно можна, ім'я візьмемо з листа
  }
  // 21.10.2026: псевдонім має перевагу; якщо в профілі нічого — беремо ім'я з форми й зберігаємо в профіль
  authorName = (await profileName(user.id)) || authorName.trim()
  if (!authorName) {
    const typed = String(form.get('authorName') ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
    if (typed.length < 3) {
      return NextResponse.json({ ok: false, error: 'Вкажіть ваше ім’я та прізвище (або псевдонім) — так підпишемо твір.' }, { status: 400 })
    }
    authorName = typed
  }
  // 21.10.2026: у 11 конкурсних авторів не було профілю — кабінет казав «не підключено», і вони не могли
  // ні поставити обкладинку, ні підписати договір, хоча саме цього ми просимо в листі. Тепер подача
  // сама створює профіль (або дописує порожнє ім'я в наявний).
  try {
    await dbQuery(
      `insert into author_profiles (user_id, display_name, email, full_name, is_fop, revenue_share, is_active)
       values ($1, $2, nullif($3, ''), $2, false, 0.4, true)
       on conflict (user_id) do update
          set display_name = coalesce(nullif(trim(author_profiles.display_name), ''), excluded.display_name),
              email        = coalesce(author_profiles.email, excluded.email)`,
      [user.id, authorName, email],
    )
  } catch (e) { console.error('[contest-submit] profile', (e as Error)?.message) }

  // --- Читаємо файли до запису в базу --------------------------------------
  // Спершу перевіряємо ВСІ файли й лише потім щось пишемо. Інакше автор,
  // який надіслав десять серій і схибив на восьмій, отримав би півзаявки.
  const parsed: { body: string; words: number; filename: string }[] = []
  for (const f of files) {
    let body = ''
    try {
      body = await readFile(f)
    } catch {
      return NextResponse.json(
        { ok: false, error: `Не вдалося прочитати «${f.name}». Збережіть у .docx або .txt і спробуйте ще раз.` },
        { status: 400 },
      )
    }
    const words = countWords(body)
    if (words < contest.minWords || words > contest.maxWords) {
      return NextResponse.json(
        {
          ok: false,
          error: `У файлі «${f.name}» ${words} слів, а конкурс приймає ${contest.minWords}–${contest.maxWords}.${fitsOther(words, contest.id)} Нічого не збережено. Допишіть або скоротіть текст і подайте файл ще раз на цій сторінці — листом конкурсні твори не приймаємо.`,
        },
        { status: 400 },
      )
    }
    parsed.push({ body, words, filename: f.name.slice(0, 200) })
  }

  try {
    // --- Заявка ------------------------------------------------------------
    const existing = await dbQuery(
      `select id::text, title from contest_entries where author_id = $1 and contest = $2 limit 1`,
      [user.id, contest.id],
    )

    let entryId: string
    if (existing.rowCount && existing.rowCount > 0) {
      entryId = (existing.rows[0] as { id: string }).id
      if (title) {
        await dbQuery(
          `update contest_entries
              set title = $2, annotation = coalesce(nullif($3,''), annotation),
                  genre = coalesce(nullif($4,''), genre),
                  cover_brief = coalesce(nullif($5,''), cover_brief), updated_at = now()
            where id = $1`,
          [entryId, title, annotation, genre, coverBrief],
        )
      }
    } else {
      // Заявки немає, а прийом уже закрито: досилати нема до чого.
      if (!isOpen(contest)) {
        return NextResponse.json(
          {
            ok: false,
            error: `Прийом заявок на цей конкурс закрито ${contest.closesAt}. Досилати серії можуть лише ті, хто подав заявку до цієї дати.`,
          },
          { status: 400 },
        )
      }
      if (!title) {
        return NextResponse.json({ ok: false, error: 'Вкажіть назву твору' }, { status: 400 })
      }
      const ins = await dbQuery(
        `insert into contest_entries (author_id, author_name, email, contest, title, annotation, genre, cover_brief)
         values ($1,$2,$3,$4,$5,$6,$7,nullif($8,'')) returning id::text`,
        [user.id, authorName, email, contest.id, title, annotation, genre, coverBrief],
      )
      entryId = (ins.rows[0] as { id: string }).id
    }

    // --- Скільки серій уже прийнято ----------------------------------------
    const cnt = await dbQuery(
      `select coalesce(max(ord), 0)::int as last_ord, count(*)::int as total
         from contest_episodes where entry_id = $1`,
      [entryId],
    )
    const { last_ord: lastOrd, total } = cnt.rows[0] as { last_ord: number; total: number }

    if (total + parsed.length > contest.episodes) {
      return NextResponse.json(
        {
          ok: false,
          error: `У цьому конкурсі ${contest.episodes} серій. Уже прийнято ${total}, ви надсилаєте ще ${parsed.length}.`,
        },
        { status: 400 },
      )
    }
    if (contest.atOnce && total === 0 && parsed.length !== contest.episodes) {
      return NextResponse.json(
        {
          ok: false,
          error: `За правилами цього конкурсу надсилаються всі ${contest.episodes} серій одразу. Ви прикріпили ${parsed.length}.`,
        },
        { status: 400 },
      )
    }

    // --- Серії --------------------------------------------------------------
    let ord = lastOrd
    for (const p of parsed) {
      ord += 1
      await dbQuery(
        `insert into contest_episodes (entry_id, ord, body, words, filename)
         values ($1,$2,$3,$4,$5)`,
        [entryId, ord, p.body, p.words, p.filename],
      )
    }

    // Номер роботи й редактор — автоматично (13.10.2026). Помилка тут не
    // має зірвати подачу: заявка вже збережена, скерувати можна вручну.
    let entryNumber: number | null = null
    try {
      entryNumber = (await routeEntry(entryId)).number
    } catch (e) {
      console.error('[contest/submit] route', (e as Error)?.message)
    }
    // 14.10.2026: робота приймається одразу (чернетки серій у каталозі); відхиляє редактор після читання.
    try { await acceptEntry(entryId) } catch (e) { console.error('[contest/submit] accept', (e as Error)?.message) }

    // Оцінка ШІ — у фоні, після відповіді автору (до 3 хв для серіалу).
    after(async () => {
      try {
        const e = await dbQuery(`select contest, title, annotation, genre from contest_entries where id::text = $1`, [entryId])
        const row = e.rows[0] as { contest: string; title: string; annotation: string | null; genre: string | null } | undefined
        if (!row) return
        const eps = await dbQuery(`select ord, body from contest_episodes where entry_id::text = $1 order by ord`, [entryId])
        const input = {
          contest: row.contest, title: row.title ?? '', annotation: row.annotation ?? '', genre: row.genre ?? '',
          episodes: (eps.rows as { ord: number; body: string }[]).map((x) => ({ ord: x.ord, body: x.body ?? '' })),
        }
        const hash = reviewHash(input)
        const done = await dbQuery(`select 1 from contest_ai_reviews where entry_id = $1 and text_hash = $2 limit 1`, [entryId, hash])
        if (done.rowCount) return
        const result = await runContestReview(input)
        const words = input.episodes.reduce((a, x) => a + countWords(x.body), 0)
        await dbQuery(
          `insert into contest_ai_reviews (entry_id, contest, text_hash, words, total, model, result)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [entryId, input.contest, hash, words, result.total, REVIEW_MODEL, JSON.stringify(result)],
        )
      } catch (err) {
        console.error('[contest/submit] ai review', (err as Error)?.message)
      }
    })

    // Перевірка на попередню публікацію в інтернеті — теж у фоні (14.10.2026).
    after(async () => {
      try {
        await checkEntryOriginality(entryId)
      } catch (err) {
        console.error('[contest/submit] originality', (err as Error)?.message)
      }
    })

    await sendMail({
      entryNumber,
      to: email,
      authorName,
      contestName: contest.name,
      title: title || (existing.rows[0] as { title?: string } | undefined)?.title || '',
      accepted: parsed.map((p, i) => ({ ord: lastOrd + i + 1, words: p.words, filename: p.filename })),
      totalNow: total + parsed.length,
      totalNeed: contest.episodes,
    })

    return NextResponse.json({
      ok: true,
      entryId,
      acceptedNow: parsed.length,
      totalNow: total + parsed.length,
      totalNeed: contest.episodes,
    })
  } catch (err) {
    console.error('[contest/submit] post', (err as Error)?.message)
    return NextResponse.json(
      { ok: false, error: 'Не вдалося зберегти заявку. Спробуйте ще раз або надішліть файли на nazar@balabony.com' },
      { status: 500 },
    )
  }
}

/**
 * Підтвердження автору й копія редакції. Лист навмисно перелічує кожну
 * прийняту серію з кількістю слів: автор має бачити, що саме дійшло, а не
 * вірити на слово — це головна претензія до старої форми.
 */
async function sendMail(p: {
  entryNumber: number | null
  to: string
  authorName: string
  contestName: string
  title: string
  accepted: { ord: number; words: number; filename: string }[]
  totalNow: number
  totalNeed: number
}) {
  if (!process.env.RESEND_API_KEY || !p.to) return

  const rows = p.accepted
    .map(a => `<li>Серія ${a.ord} — ${a.words} слів <span style="color:#8899bb">(${esc(a.filename)})</span></li>`)
    .join('')

  const left = p.totalNeed - p.totalNow
  const tail = left > 0
    ? `<p style="color:#c8d4e8">Прийнято ${p.totalNow} із ${p.totalNeed}. Решту (${left}) надсилайте тією самою сторінкою, у міру написання.</p>`
    : `<p style="color:#c8d4e8">Заявка повна: ${p.totalNow} із ${p.totalNeed}. Результати оголосить журі після розгляду робіт, переможців опублікуємо на сайті.</p>`

  const html = `
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px;max-width:680px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:16px;padding:28px;border:1px solid rgba(239,159,39,0.3);">
    <div style="font-size:22px;font-weight:700;color:#ef9f27;margin-bottom:20px;">Balabony</div>
    <p style="color:#c8d4e8;">Вітаємо${greetName(p.authorName) ? ', <strong style="color:#f5f0e8">' + esc(greetName(p.authorName) ?? '') + '</strong>' : ''}!</p>
    <p style="color:#c8d4e8;">Заявку на конкурс <strong style="color:#ef9f27">${esc(p.contestName)}</strong> отримано.</p>
    <p style="color:#c8d4e8;">Твір: <strong style="color:#f5f0e8">${esc(p.title)}</strong></p>
    ${p.entryNumber ? `<p style="color:#c8d4e8;">Номер вашої роботи: <strong style="color:#ef9f27;font-size:18px">№ ${p.entryNumber}</strong>. Вказуйте його в листах до редакції.</p>` : ''}
    <ul style="color:#c8d4e8;line-height:1.8;">${rows}</ul>
    ${tail}
    <p style="color:#c8d4e8;">Щоб твір опублікували, а приз (якщо переможете) виплатили, потрібен підписаний авторський договір. Окремого листа про договір не буде — зробіть це самі в <a href="https://balabony.com/author/dashboard" style="color:#ef9f27">кабінеті автора</a>: заповніть реквізити й натисніть «Сформувати договір». Якщо договір уже підписано — нічого робити не треба.</p>
    <p style="color:#c8d4e8;">Обкладинку ставите самі — і зробити її можна <b>безкоштовно за кілька хвилин</b>, навіть без навичок малювання:</p>
    <ol style="color:#c8d4e8;line-height:1.8;">
      <li>Відкрийте <a href="https://gemini.google.com" style="color:#ef9f27">gemini.google.com</a> — це безкоштовний помічник Google. Напишіть йому простими словами, наприклад: «Намалюй горизонтальну ілюстрацію 16:9 до історії: хто герої, де відбувається дія, який настрій. Головний герой ближче до центру, яскраво, без жодного тексту».</li>
      <li>Збережіть готову картинку на комп'ютер або телефон. Вона має бути <b>горизонтальна</b> (альбомна, не книжкова), щонайменше 1200 пікселів завширшки, <b>без тексту</b> — назву сайт додасть сам.</li>
      <li>У <a href="https://balabony.com/author/dashboard" style="color:#ef9f27">кабінеті автора</a> під твором натисніть «Додати фото», оберіть файл і «Зберегти обкладинку». У серіалу кожна серія має свою кнопку.</li>
    </ol>
    <p style="color:#c8d4e8;">Картинка — лише та, на яку ви маєте право (згенерована ШІ підходить, ми це позначимо). Без реальних людей, відомих мультяшних персонажів і логотипів. Головного героя тримайте ближче до центру кадру: сайт показує обкладинку і в широкій картці, і більшою на сторінці твору. Надсилати її листом не потрібно.</p>
    <p style="color:#8899bb;font-size:13px;">Якщо в переліку чогось бракує — напишіть на nazar@balabony.com, розберемося.</p>
  </div>
</body>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com'
  try {
    await resend.emails.send({
      from,
      to: p.to,
      subject: `[Балабони] Заявку прийнято: ${p.title}${p.entryNumber ? ` (№ ${p.entryNumber})` : ''}`,
      html,
    })
    // Копія редакції: ті самі дані, що в автора, плюс ХТО подав заявку.
    // Без цього рядка з копії не видно автора (19.09.2026), а ім'я в профілі буває порожнім.
    const who = `<p style="color:#ef9f27;font-size:14px;margin:0 0 16px;">Автор: <strong>${esc(p.authorName) || 'ім\'я в профілі не вказано'}</strong>, ${esc(p.to)}</p>`
    await resend.emails.send({
      from,
      to: 'nazar@balabony.com',
      replyTo: p.to,
      subject: `[Конкурс] ${p.contestName} — ${p.title} (${p.totalNow}/${p.totalNeed})`,
      html: html.replace('<div style="font-size:22px;font-weight:700;color:#ef9f27;margin-bottom:20px;">Balabony</div>',
        '<div style="font-size:22px;font-weight:700;color:#ef9f27;margin-bottom:20px;">Balabony</div>' + who),
    })
  } catch (e) {
    // Лист не пішов — заявка вже в базі, це не привід повертати помилку автору.
    console.error('[contest/submit] mail', (e as Error)?.message)
  }
}

/** Екранує текст для вставки в HTML листа. */
function esc(v: string): string {
  return (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// 14.10.2026: будь-яка відмова форми — лист Богдану (автори зазвичай не пишуть).
export async function POST(req: NextRequest) {
  const res = await handlePOST(req)
  // 14.10.2026: копія ДО відправки — інакше тіло відповіді вже прочитане і в листі лише «HTTP 400» без пояснення.
  const copy = res.clone()
  after(() => alertIfFailed(copy, 'подача на конкурс (/konkursy/podaty)'))
  return res
}

// 21.10.2026: автори плутають конкурс (Галина Максим'юк подала казки в серіальний). Якщо обсяг
// підходить до іншого відкритого конкурсу — підказуємо, куди саме подати.
function fitsOther(words: number, current: string): string {
  const ok = CONTESTS.filter((c) => c.id !== current && isOpen(c) && words >= c.minWords && words <= c.maxWords)
  return ok.length ? ` Цей обсяг підходить до конкурсу ${ok.map((c) => c.name).join(' або ')} — виберіть його у списку вгорі форми.` : ''
}
