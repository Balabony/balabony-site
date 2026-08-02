// scripts/text-cleanup-apply.mjs
//
// Записує в базу те, що порахував dry-run. Читає ГОТОВИЙ plan.json, а не
// перераховує заново: записуємо рівно те, що людина переглянула у звіті.
//
// Запуск (тільки після бекапу і після читання report.md):
//   node --env-file=.env.local scripts/text-cleanup-apply.mjs --yes
//
// Без --yes скрипт лише покаже, скільки записів чекає, і вийде.

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('FAIL: немає ключів Supabase. Перевір .env.local.')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseKey)

let plan
try {
  plan = JSON.parse(readFileSync('scripts/text-cleanup/plan.json', 'utf8'))
} catch {
  console.error('FAIL: не знайдено scripts/text-cleanup/plan.json.')
  console.error('Спершу запусти dry-run.')
  process.exit(1)
}

if (!Array.isArray(plan) || plan.length === 0) {
  console.log('План порожній — нічого змінювати.')
  process.exit(0)
}

console.log(`У плані записів: ${plan.length}`)

if (!process.argv.includes('--yes')) {
  console.log('')
  console.log('Це був холостий запуск: нічого не записано.')
  console.log('Щоб записати насправді, додай --yes у кінець команди.')
  process.exit(0)
}

const failures = []
let done = 0

for (const item of plan) {
  const patch = {}
  for (const [field, value] of Object.entries(item.fields)) patch[field] = value

  const { error } = await supabase.from('content').update(patch).eq('id', item.id)
  if (error) {
    failures.push({ id: item.id, title: item.title, error: error.message })
    console.error(`ПОМИЛКА ${item.id} (${item.title ?? '—'}): ${error.message}`)
  } else {
    done++
    if (done % 25 === 0) console.log(`  ...записано ${done} із ${plan.length}`)
  }
}

console.log('')
console.log(`Записано: ${done}`)
console.log(`Помилок:  ${failures.length}`)

if (failures.length) {
  writeFileSync('scripts/text-cleanup/failures.json', JSON.stringify(failures, null, 2), 'utf8')
  console.log('Перелік помилок: scripts/text-cleanup/failures.json')
  console.log('Записи з помилками лишились у старому вигляді — їх можна прогнати повторно.')
}
