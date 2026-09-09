import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import mammoth from 'mammoth'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { toPlainText } from '@/lib/plain-text'
import { findContest, isOpen, countWords } from '@/lib/contests'

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

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: true, authorized: false, entries: [] })

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
      return NextResponse.json({ ok: true, authorized: true, entries: [] })
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
      entries: entries.map(r => ({ ...r, episodes: byEntry.get(r.id) ?? [] })),
    })
  } catch (err) {
    console.error('[contest/submit] get', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося прочитати ваші заявки' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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
  if (!isOpen(contest)) {
    return NextResponse.json(
      { ok: false, error: `Прийом на цей конкурс триває з ${contest.opensAt} до ${contest.closesAt}` },
      { status: 400 },
    )
  }

  const title = String(form.get('title') ?? '').trim().slice(0, 200)
  const annotation = String(form.get('annotation') ?? '').trim().slice(0, 1500)
  const genre = String(form.get('genre') ?? '').trim().slice(0, 100)

  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
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
          error: `У файлі «${f.name}» ${words} слів, а конкурс приймає ${contest.minWords}–${contest.maxWords}. Нічого не збережено — виправте і надішліть ще раз.`,
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
                  genre = coalesce(nullif($4,''), genre), updated_at = now()
            where id = $1`,
          [entryId, title, annotation, genre],
        )
      }
    } else {
      if (!title) {
        return NextResponse.json({ ok: false, error: 'Вкажіть назву твору' }, { status: 400 })
      }
      const ins = await dbQuery(
        `insert into contest_entries (author_id, author_name, email, contest, title, annotation, genre)
         values ($1,$2,$3,$4,$5,$6,$7) returning id::text`,
        [user.id, authorName, email, contest.id, title, annotation, genre],
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

    await sendMail({
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
    .map(a => `<li>Серія ${a.ord} — ${a.words} слів <span style="color:#8899bb">(${a.filename})</span></li>`)
    .join('')

  const left = p.totalNeed - p.totalNow
  const tail = left > 0
    ? `<p style="color:#c8d4e8">Прийнято ${p.totalNow} із ${p.totalNeed}. Решту (${left}) надсилайте тією самою сторінкою, у міру написання.</p>`
    : `<p style="color:#c8d4e8">Заявка повна: ${p.totalNow} із ${p.totalNeed}. Редакція відповість протягом десяти днів.</p>`

  const html = `
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px;max-width:680px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:16px;padding:28px;border:1px solid rgba(239,159,39,0.3);">
    <div style="font-size:22px;font-weight:700;color:#ef9f27;margin-bottom:20px;">Balabony</div>
    <p style="color:#c8d4e8;">Вітаємо${p.authorName ? ', <strong style="color:#f5f0e8">' + p.authorName + '</strong>' : ''}!</p>
    <p style="color:#c8d4e8;">Заявку на конкурс <strong style="color:#ef9f27">${p.contestName}</strong> отримано.</p>
    <p style="color:#c8d4e8;">Твір: <strong style="color:#f5f0e8">${p.title}</strong></p>
    <ul style="color:#c8d4e8;line-height:1.8;">${rows}</ul>
    ${tail}
    <p style="color:#8899bb;font-size:13px;">Якщо в переліку чогось бракує — напишіть на nazar@balabony.com, розберемося.</p>
  </div>
</body>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com'
  try {
    await resend.emails.send({
      from,
      to: p.to,
      subject: `[Балабони] Заявку прийнято: ${p.title}`,
      html,
    })
    await resend.emails.send({
      from,
      to: 'nazar@balabony.com',
      subject: `[Конкурс] ${p.contestName} — ${p.title} (${p.totalNow}/${p.totalNeed})`,
      html,
    })
  } catch (e) {
    // Лист не пішов — заявка вже в базі, це не привід повертати помилку автору.
    console.error('[contest/submit] mail', (e as Error)?.message)
  }
}
