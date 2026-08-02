// scripts/text-cleanup-dry-run.mjs
//
// Рахує, що дасть очистка текстів у таблиці content. БАЗУ НЕ ТОРКАЄ.
//
// Запуск:
//   node --env-file=.env.local scripts/text-cleanup-dry-run.mjs
//
// Виходи:
//   scripts/text-cleanup/report.md    — читабельний звіт із прикладами
//   scripts/text-cleanup/plan.json    — точний перелік того, що буде записано
//
// Логіку чистки НЕ дублюємо: беремо ту саму функцію, якою користується сайт.
// Якщо правила зміняться в lib/plain-text.ts — зміниться і цей скрипт.

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { toPlainText, looksLikeHtml } from '../lib/plain-text.ts'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('FAIL: немає NEXT_PUBLIC_SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Перевір файл .env.local у корені проєкту.')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseKey)

const OUT_DIR = 'scripts/text-cleanup'
mkdirSync(OUT_DIR, { recursive: true })

const FIELDS = ['text', 'corrected_text', 'humanized_text']
const ENTITY_RE = /&(?:[a-z]+|#\d+|#x[0-9a-f]+);/i

// Сторінками, бо творів під пів тисячі й Supabase віддає по 1000 за раз.
async function fetchAll() {
  const rows = []
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('content')
      .select('id, type, status, title, slug, text, corrected_text, humanized_text')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

function classify(before) {
  const tags = looksLikeHtml(before)
  const entities = ENTITY_RE.test(before)
  if (tags && entities) return 'розмітка + сутності'
  if (tags) return 'розмітка'
  if (entities) return 'сутності'
  return 'інше (пробіли/переноси)'
}

const rows = await fetchAll()
console.log(`Прочитано записів: ${rows.length}`)

const plan = []
const stats = { byField: {}, byKind: {}, byType: {} }
let untouched = 0

for (const row of rows) {
  const changes = {}
  for (const field of FIELDS) {
    const before = row[field]
    if (!before || typeof before !== 'string') continue
    const after = toPlainText(before)
    if (after === before) continue
    const kind = classify(before)
    changes[field] = { before, after, kind }
    stats.byField[field] = (stats.byField[field] ?? 0) + 1
    stats.byKind[kind] = (stats.byKind[kind] ?? 0) + 1
  }
  if (Object.keys(changes).length === 0) { untouched++; continue }
  stats.byType[row.type ?? '—'] = (stats.byType[row.type ?? '—'] ?? 0) + 1
  plan.push({
    id: row.id,
    type: row.type,
    status: row.status,
    title: row.title,
    slug: row.slug,
    fields: Object.fromEntries(Object.entries(changes).map(([f, c]) => [f, c.after])),
    kinds: Object.fromEntries(Object.entries(changes).map(([f, c]) => [f, c.kind])),
    lengthDelta: Object.fromEntries(
      Object.entries(changes).map(([f, c]) => [f, c.after.length - c.before.length]),
    ),
  })
}

// --- звіт ---
const L = []
L.push('# Очистка текстів — попередній розрахунок\n')
L.push(`Дата: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}\n`)
L.push(`Усього записів у content: **${rows.length}**`)
L.push(`Зміняться: **${plan.length}**`)
L.push(`Лишаться без змін: **${untouched}**\n`)

L.push('## За полем\n')
for (const [k, v] of Object.entries(stats.byField)) L.push(`- \`${k}\` — ${v}`)
L.push('\n## За причиною\n')
for (const [k, v] of Object.entries(stats.byKind)) L.push(`- ${k} — ${v}`)
L.push('\n## За типом контенту\n')
for (const [k, v] of Object.entries(stats.byType)) L.push(`- ${k} — ${v}`)

// Приклади: беремо по два на кожну причину, щоб побачити всі різновиди.
L.push('\n## Приклади «до → після»\n')
const shown = {}
for (const row of rows) {
  for (const field of FIELDS) {
    const before = row[field]
    if (!before || typeof before !== 'string') continue
    const after = toPlainText(before)
    if (after === before) continue
    const kind = classify(before)
    shown[kind] = (shown[kind] ?? 0)
    if (shown[kind] >= 2) continue
    shown[kind]++
    L.push(`### ${row.title ?? row.slug ?? row.id} — \`${field}\` (${kind})\n`)
    L.push('**Було:**\n')
    L.push('```\n' + before.slice(0, 300).replace(/```/g, '``') + '\n```\n')
    L.push('**Стане:**\n')
    L.push('```\n' + after.slice(0, 300).replace(/```/g, '``') + '\n```\n')
  }
}

// Найбільші скорочення — тут найімовірніше ховається несподіванка.
L.push('\n## Найбільша втрата символів (перевір ці уважно)\n')
const biggest = [...plan]
  .map(p => ({ p, worst: Math.min(...Object.values(p.lengthDelta)) }))
  .sort((a, b) => a.worst - b.worst)
  .slice(0, 15)
for (const { p, worst } of biggest) {
  L.push(`- ${worst} симв. · ${p.title ?? p.slug ?? p.id} · \`${p.type}\` · ${Object.values(p.kinds).join(', ')}`)
}

writeFileSync(join(OUT_DIR, 'report.md'), L.join('\n'), 'utf8')
writeFileSync(join(OUT_DIR, 'plan.json'), JSON.stringify(plan, null, 2), 'utf8')

console.log('')
console.log(`Зміняться записів: ${plan.length}`)
console.log(`Без змін:          ${untouched}`)
console.log('')
console.log('Звіт:  scripts/text-cleanup/report.md')
console.log('План:  scripts/text-cleanup/plan.json')
console.log('')
console.log('БАЗУ НЕ ЗМІНЕНО. Прочитай звіт, і аж тоді запускай apply.')
