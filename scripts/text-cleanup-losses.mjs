// scripts/text-cleanup-losses.mjs
//
// Точкова проба: для записів, де зникає кирилиця, показує КОНТЕКСТ —
// що саме стояло навколо втраченого слова в оригіналі. БАЗУ НЕ ТОРКАЄ.
//
// Запуск:
//   node --env-file=.env.local scripts/text-cleanup-losses.mjs
//
// Вихід: scripts/text-cleanup/losses.md

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) { console.error('FAIL: немає ключів Supabase.'); process.exit(1) }
const supabase = createClient(supabaseUrl, supabaseKey)

const OUT_DIR = 'scripts/text-cleanup'
const plan = JSON.parse(readFileSync(join(OUT_DIR, 'plan.json'), 'utf8'))
const planById = new Map(plan.map(p => [p.id, p]))

async function fetchAll() {
  const rows = []
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('content')
      .select('id, type, title, slug, text, corrected_text, humanized_text')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

const cyr = s => (s.match(/[\u0400-\u04FF]/g) ?? []).length

// Порівнюємо суцільні ланцюжки кирилиці, ігноруючи пробіли й розділові:
// так «дос-коналий» і «досконалий» вважаються одним і тим самим.
const cyrOnly = s => (s.match(/[\u0400-\u04FF]/g) ?? []).join('')

const rows = await fetchAll()
const L = []
L.push('# Втрати кирилиці — з контекстом\n')

let cases = 0
for (const row of rows) {
  const p = planById.get(row.id)
  if (!p) continue
  for (const [field, after] of Object.entries(p.fields)) {
    const before = row[field] ?? ''
    const lost = cyr(before) - cyr(after)
    if (lost <= 0) continue
    cases++

    L.push(`## ${row.title ?? row.slug} · \`${field}\` · −${lost} літер\n`)

    // Знаходимо перше місце розбіжності в потоці самих лише кириличних літер
    const b = cyrOnly(before)
    const a = cyrOnly(after)
    let i = 0
    while (i < b.length && i < a.length && b[i] === a[i]) i++

    // Показуємо шматок ОРИГІНАЛУ навколо цього місця — з тегами, як є в базі.
    // Шукаємо, де в сирому тексті стоїть ця ділянка.
    const marker = b.slice(Math.max(0, i - 12), i + 8)
    let pos = -1
    if (marker.length > 4) {
      // грубий пошук: перші літери маркера підряд, дозволяючи будь-що між ними
      const re = new RegExp(marker.split('').map(ch => ch + '[^\\u0400-\\u04FF]*').join(''), 'u')
      const m = before.match(re)
      if (m) pos = m.index
    }

    if (pos >= 0) {
      L.push('**Оригінал у цьому місці (як лежить у базі):**\n')
      L.push('```\n' + before.slice(Math.max(0, pos - 120), pos + 260).replace(/```/g, '``') + '\n```\n')
    } else {
      L.push('_Точне місце не знайдено, показую початок оригіналу:_\n')
      L.push('```\n' + before.slice(0, 300).replace(/```/g, '``') + '\n```\n')
    }

    L.push(`Кирилиці: ${cyr(before)} → ${cyr(after)}\n`)
  }
}

L.unshift(`Записів із втратою кирилиці: **${cases}**\n`)
writeFileSync(join(OUT_DIR, 'losses.md'), L.join('\n'), 'utf8')

console.log(`Випадків із втратою кирилиці: ${cases}`)
console.log('Звіт: scripts/text-cleanup/losses.md')
console.log('БАЗУ НЕ ЗМІНЕНО.')
