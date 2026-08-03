// scripts/revoke-kolodiy.mjs
//
// Володимир Колодій відкликав згоду на публікацію.
// Скрипт: знімає його опубліковані твори з публікації (status → draft)
// і записує відкликання в author_consents.
//
// Запуск (холостий, нічого не змінює):
//   node --env-file=.env.local scripts/revoke-kolodiy.mjs
// Запуск із записом:
//   node --env-file=.env.local scripts/revoke-kolodiy.mjs --yes

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) { console.error('FAIL: немає ключів Supabase.'); process.exit(1) }
const supabase = createClient(supabaseUrl, supabaseKey)

const AUTHOR_NAME = 'Володимир Колодій'
const CHANNEL     = 'phone'   // як надійшло відкликання
const NOTE        = 'Автор відкликав згоду на публікацію. Твори знято з публікації.'

const apply = process.argv.includes('--yes')

// 1. Що саме зараз опубліковано
const { data: works, error } = await supabase
  .from('content')
  .select('id, title, slug, status')
  .eq('author_name', AUTHOR_NAME)
  .in('status', ['approved', 'published'])
if (error) { console.error('FAIL:', error.message); process.exit(1) }

console.log(`Автор: ${AUTHOR_NAME}`)
console.log(`Опублікованих творів: ${works?.length ?? 0}`)
for (const w of works ?? []) console.log(`  [${w.status}] ${w.title} · ${w.slug}`)

// 2. Чи вже є запис згоди
const { data: existing } = await supabase
  .from('author_consents')
  .select('id, status, happened_at')
  .eq('author_name', AUTHOR_NAME)
  .eq('scope', 'balabony')
console.log(`Наявних записів згоди: ${existing?.length ?? 0}`)
for (const c of existing ?? []) console.log(`  ${c.status} · ${(c.happened_at ?? '').slice(0, 10)}`)

if (!apply) {
  console.log('')
  console.log('Це холостий запуск — нічого не змінено.')
  console.log('Щоб виконати насправді, додай --yes у кінець команди.')
  process.exit(0)
}

// 3. Знімаємо з публікації
let moved = 0
for (const w of works ?? []) {
  const { error: e } = await supabase.from('content').update({ status: 'draft' }).eq('id', w.id)
  if (e) console.error(`  ПОМИЛКА «${w.title}»: ${e.message}`)
  else { moved++; console.log(`  знято: ${w.title}`) }
}

// 4. Записуємо відкликання. Історію не чіпаємо — додаємо новий рядок,
//    бо author_consents веде саме історію станів, а не поточний стан.
const { error: e2 } = await supabase.from('author_consents').insert({
  author_name: AUTHOR_NAME,
  scope: 'balabony',
  status: 'revoked',
  channel: CHANNEL,
  happened_at: new Date().toISOString(),
  note: NOTE,
})
if (e2) console.error('ПОМИЛКА запису відкликання:', e2.message)

console.log('')
console.log(`Знято з публікації: ${moved}`)
console.log(`Відкликання записано: ${e2 ? 'НІ' : 'так'}`)
