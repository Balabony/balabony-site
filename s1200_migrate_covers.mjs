/**
 * s1200 — перенесення обкладинок зі storriss.com у Supabase Storage.
 *
 * НАВІЩО. Ліміт Image Optimization на Vercel Hobby вичерпано (5000/5000),
 * через що картинки перестали показуватися. Тимчасово в next.config.mjs
 * стоїть unoptimized: true. Цей скрипт прибирає причину: зображення
 * переїжджають у Supabase Storage, стискаються у WebP і роздаються звідти,
 * не витрачаючи ліміт Vercel узагалі.
 *
 * ЩО РОБИТЬ
 *   1. Бере з таблиці content усі записи, де cover_url веде на storriss.com.
 *   2. Скачує файл.
 *   3. Стискає у WebP, ширина 800 px, якість 82 — цього досить для картки
 *      і для сторінки твору, а обсяг падає приблизно втричі.
 *   4. Заливає в бакет covers, тека imported/.
 *   5. Оновлює cover_url у базі.
 *   6. Пише звіт: скільки перенесено, скільки пропущено, що не вдалося.
 *
 * БЕЗПЕЧНО ЗАПУСКАТИ ПОВТОРНО. Записи, які вже переїхали, пропускаються.
 * Якщо скрипт обірветься — просто запустіть ще раз, він продовжить.
 *
 * СПОЧАТКУ СУХИЙ ПРОГІН: node s1200_migrate_covers.mjs --dry
 * Він нічого не змінює, лише показує, що буде зроблено.
 *
 * ЗАПУСК
 *   1. Покладіть цей файл у корінь проєкту (C:\Users\Bogdan\balabony-site).
 *   2. npm install sharp
 *   3. У файлі .env.local має бути:
 *        NEXT_PUBLIC_SUPABASE_URL=...
 *        SUPABASE_SERVICE_ROLE_KEY=...
 *      Ключ service_role нікуди не надсилайте — він дає повний доступ до бази.
 *   4. node s1200_migrate_covers.mjs --dry     (перевірка)
 *      node s1200_migrate_covers.mjs           (перенесення)
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { readFileSync, existsSync, appendFileSync } from 'node:fs'

// ── налаштування ────────────────────────────────────────────────
const BUCKET = 'covers'
const FOLDER = 'imported'
const WIDTH = 800          // ширина після стиснення
const QUALITY = 82         // якість WebP
const BATCH = 5            // скільки файлів обробляти одночасно
const PAUSE_MS = 300       // пауза між пачками, щоб не навантажувати storriss
const LOG = 'migrate-covers.log'

const DRY = process.argv.includes('--dry')

// ── читаємо .env.local ──────────────────────────────────────────
function loadEnv() {
  if (!existsSync('.env.local')) {
    console.error('Немає файлу .env.local у поточній теці.')
    console.error('Запускати треба з кореня проєкту: cd C:\\Users\\Bogdan\\balabony-site')
    process.exit(1)
  }
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('У .env.local бракує NEXT_PUBLIC_SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const db = createClient(URL, KEY, { auth: { persistSession: false } })

function log(msg) {
  const line = `${new Date().toISOString()}  ${msg}`
  console.log(msg)
  try { appendFileSync(LOG, line + '\n') } catch {}
}

function mb(bytes) { return (bytes / 1024 / 1024).toFixed(1) }

// ── головне ─────────────────────────────────────────────────────
async function main() {
  log(DRY ? '=== СУХИЙ ПРОГІН — нічого не змінюється ===' : '=== ПЕРЕНЕСЕННЯ ===')

  const { data: rows, error } = await db
    .from('content')
    .select('id, slug, title, cover_url')
    .like('cover_url', '%storriss.com%')
    .order('id')

  if (error) { log('Помилка читання бази: ' + error.message); process.exit(1) }

  log(`Знайдено записів для перенесення: ${rows.length}`)
  if (!rows.length) { log('Нічого робити.'); return }

  if (DRY) {
    for (const r of rows.slice(0, 10)) log(`  ${r.slug} → ${r.cover_url}`)
    if (rows.length > 10) log(`  … і ще ${rows.length - 10}`)
    log('')
    log('Щоб виконати перенесення, запустіть без --dry')
    return
  }

  let ok = 0, fail = 0, bytesIn = 0, bytesOut = 0
  const errors = []

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)

    await Promise.all(chunk.map(async (row) => {
      try {
        // 1. скачати
        const res = await fetch(row.cover_url, {
          headers: { 'User-Agent': 'Balabony-migration/1.0' },
          signal: AbortSignal.timeout(30000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const input = Buffer.from(await res.arrayBuffer())
        if (input.length < 1000) throw new Error('файл підозріло малий')

        // 2. стиснути
        const output = await sharp(input)
          .rotate()                                   // за EXIF
          .resize({ width: WIDTH, withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toBuffer()

        // 3. залити
        const path = `${FOLDER}/${row.slug}.webp`
        const { error: upErr } = await db.storage
          .from(BUCKET)
          .upload(path, output, { contentType: 'image/webp', upsert: true })
        if (upErr) throw new Error('upload: ' + upErr.message)

        const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path)

        // 4. оновити базу
        const { error: dbErr } = await db
          .from('content')
          .update({ cover_url: pub.publicUrl })
          .eq('id', row.id)
        if (dbErr) throw new Error('update: ' + dbErr.message)

        bytesIn += input.length
        bytesOut += output.length
        ok++
        log(`  ✓ ${row.slug}  ${mb(input.length)} → ${mb(output.length)} МБ`)
      } catch (e) {
        fail++
        errors.push(`${row.slug}: ${e.message}`)
        log(`  ✗ ${row.slug}  ${e.message}`)
      }
    }))

    const done = Math.min(i + BATCH, rows.length)
    if (done % 50 < BATCH) log(`--- оброблено ${done} з ${rows.length} ---`)
    await new Promise(r => setTimeout(r, PAUSE_MS))
  }

  log('')
  log('=== ПІДСУМОК ===')
  log(`Перенесено:  ${ok}`)
  log(`Не вдалося:  ${fail}`)
  log(`Обсяг було:  ${mb(bytesIn)} МБ`)
  log(`Обсяг стало: ${mb(bytesOut)} МБ`)
  if (bytesIn > 0) log(`Стиснення:   ${(100 - bytesOut / bytesIn * 100).toFixed(0)}%`)

  if (errors.length) {
    log('')
    log('НЕ ВДАЛОСЯ:')
    for (const e of errors) log('  ' + e)
    log('')
    log('Ці записи лишилися зі старим cover_url. Запустіть скрипт ще раз —')
    log('він спробує тільки їх, бо решта вже не має storriss.com у посиланні.')
  }

  log('')
  log('Повний журнал: ' + LOG)
}

main().catch(e => { log('ЗБІЙ: ' + e.message); process.exit(1) })
