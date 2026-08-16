// app/api/admin/compress-covers/route.ts
//
// Стиснення обкладинок у WebP — щоб збити Cached Egress Supabase.
//
// Причина: обкладинки віддаються звичайним <img src> напряму зі сховища,
// без участі CDN Vercel. 21 PNG по ~1,9 МБ дають половину всієї ваги.
//
// ЖОДЕН ОРИГІНАЛ НЕ ЗНИКАЄ. Стиснена копія лягає окремим файлом у теку
// webp/, оригінал лишається на місці. cover_url перемикається лише після
// того, як новий файл залито І перечитано зі сховища — якщо перевірка не
// пройшла, база не чіпається і твір далі показує стару обкладинку.
//
// Кожна заміна пишеться в cover_compression_log зі старим і новим шляхом,
// тож відкотити можна одним UPDATE ... FROM журналу.
//
// Пропускаємо: те, що вже webp; те, що після стиснення не стало
// відчутно легшим (<10% виграшу) — інакше плодимо файли задарма.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { dbQuery } from '@/lib/db'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const maxDuration = 300

function checkAuth(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

// Ширина з запасом: найбільший показ обкладинки на сайті — герой епізоду.
// 1200 px покриває його і на екранах з подвійною щільністю.
const MAX_WIDTH = 1200
const QUALITY = 82
const MIN_GAIN = 0.10

type Candidate = {
  name: string
  size: number
  mimetype: string
  url: string
}

/** Твори, на які реально хтось дивиться. Сироти в бакеті трафіку не дають. */
const USED_SQL = `
  with used as (
    select regexp_replace(cover_url, '^.*/covers/', '') as name
      from content where cover_url like '%/covers/%'
    union
    select regexp_replace(cover_url, '^.*/covers/', '')
      from stories where cover_url like '%/covers/%'
    union
    select regexp_replace(cover_url, '^.*/covers/', '')
      from series  where cover_url like '%/covers/%'
  )
  select o.name,
         (o.metadata->>'size')::bigint     as size,
         coalesce(o.metadata->>'mimetype', '') as mimetype
    from storage.objects o
    join used u on u.name = o.name
   where o.bucket_id = 'covers'
     and coalesce(o.metadata->>'mimetype', '') <> 'image/webp'
     and not exists (
       select 1 from cover_compression_log l where l.old_name = o.name
     )
   order by (o.metadata->>'size')::bigint desc
   limit $1
`

async function loadCandidates(limit: number): Promise<Candidate[]> {
  const supabase = getSupabaseAdmin()
  const { rows } = await dbQuery(USED_SQL, [limit])
  return rows.map((r: { name: string; size: string; mimetype: string }) => {
    const { data } = supabase.storage.from('covers').getPublicUrl(r.name)
    return {
      name: r.name,
      size: Number(r.size),
      mimetype: r.mimetype,
      url: data.publicUrl,
    }
  })
}

/** GET — розвідка: що лишилось стиснути і скільки це важить. */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const items = await loadCandidates(500)
    const total = items.reduce((s, i) => s + i.size, 0)
    const done = await dbQuery(
      `select count(*)::int as n,
              coalesce(sum(old_size), 0)::bigint as was,
              coalesce(sum(new_size), 0)::bigint as now
         from cover_compression_log`,
    )
    return NextResponse.json({
      pending: items.length,
      pendingBytes: total,
      byFormat: items.reduce<Record<string, number>>((acc, i) => {
        acc[i.mimetype] = (acc[i.mimetype] ?? 0) + 1
        return acc
      }, {}),
      heaviest: items.slice(0, 10).map((i) => ({ name: i.name, size: i.size })),
      done: done.rows[0],
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Не вдалось порахувати' },
      { status: 500 },
    )
  }
}

type Result = {
  name: string
  status: 'ok' | 'skipped' | 'failed'
  oldSize?: number
  newSize?: number
  rows?: number
  reason?: string
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let limit = 5
  let dryRun = false
  try {
    const body = await req.json()
    if (typeof body?.limit === 'number') limit = Math.min(Math.max(body.limit, 1), 20)
    if (body?.dryRun === true) dryRun = true
  } catch {
    // тіло не обов'язкове — тоді беремо типові 5 файлів
  }

  const supabase = getSupabaseAdmin()
  const results: Result[] = []

  let candidates: Candidate[]
  try {
    candidates = await loadCandidates(limit)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Не вдалось прочитати список' },
      { status: 500 },
    )
  }

  for (const item of candidates) {
    try {
      const { data: blob, error: dlErr } = await supabase.storage
        .from('covers')
        .download(item.name)
      if (dlErr || !blob) {
        results.push({ name: item.name, status: 'failed', reason: dlErr?.message ?? 'не завантажився' })
        continue
      }

      const original = Buffer.from(await blob.arrayBuffer())
      const compressed = await sharp(original)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer()

      const gain = 1 - compressed.byteLength / original.byteLength
      if (gain < MIN_GAIN) {
        results.push({
          name: item.name,
          status: 'skipped',
          oldSize: original.byteLength,
          newSize: compressed.byteLength,
          reason: `виграш лише ${Math.round(gain * 100)}%`,
        })
        continue
      }

      const newName = `webp/${item.name.replace(/\.[^./]+$/, '')}.webp`

      if (dryRun) {
        results.push({
          name: item.name,
          status: 'ok',
          oldSize: original.byteLength,
          newSize: compressed.byteLength,
          reason: 'пробний прогін, нічого не записано',
        })
        continue
      }

      const { error: upErr } = await supabase.storage
        .from('covers')
        .upload(newName, compressed, { contentType: 'image/webp', upsert: true })
      if (upErr) {
        results.push({ name: item.name, status: 'failed', reason: `сховище: ${upErr.message}` })
        continue
      }

      // Перечитуємо залите: якщо файл не читається або порожній —
      // база лишається на старій обкладинці, і твір нічого не втрачає.
      const { data: check, error: checkErr } = await supabase.storage
        .from('covers')
        .download(newName)
      if (checkErr || !check || check.size !== compressed.byteLength) {
        results.push({
          name: item.name,
          status: 'failed',
          reason: 'залитий файл не перечитався — cover_url не змінено',
        })
        continue
      }

      const { data: pub } = supabase.storage.from('covers').getPublicUrl(newName)
      const newUrl = pub.publicUrl

      const c = await dbQuery(
        `update content set cover_url = $1 where cover_url like $2`,
        [newUrl, `%/covers/${item.name}`],
      )
      const s = await dbQuery(
        `update stories set cover_url = $1 where cover_url like $2`,
        [newUrl, `%/covers/${item.name}`],
      )
      const r = await dbQuery(
        `update series set cover_url = $1 where cover_url like $2`,
        [newUrl, `%/covers/${item.name}`],
      )

      await dbQuery(
        `insert into cover_compression_log
           (old_name, new_name, old_url, new_url, old_size, new_size,
            rows_content, rows_stories, rows_series)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          item.name, newName, item.url, newUrl,
          original.byteLength, compressed.byteLength,
          c.rowCount ?? 0, s.rowCount ?? 0, r.rowCount ?? 0,
        ],
      )

      results.push({
        name: item.name,
        status: 'ok',
        oldSize: original.byteLength,
        newSize: compressed.byteLength,
        rows: (c.rowCount ?? 0) + (s.rowCount ?? 0) + (r.rowCount ?? 0),
      })
    } catch (e) {
      results.push({
        name: item.name,
        status: 'failed',
        reason: e instanceof Error ? e.message : 'невідома помилка',
      })
    }
  }

  const ok = results.filter((r) => r.status === 'ok')
  return NextResponse.json({
    processed: results.length,
    ok: ok.length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length,
    savedBytes: ok.reduce((s, r) => s + ((r.oldSize ?? 0) - (r.newSize ?? 0)), 0),
    dryRun,
    results,
  })
}
