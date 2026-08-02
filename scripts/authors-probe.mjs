// scripts/authors-probe.mjs
//
// Розвідка перед звітом по згодах: перевіряє, які таблиці доступні та які
// в них поля. НІЧОГО НЕ ЗМІНЮЄ.
//
// Запуск:
//   node --env-file=.env.local scripts/authors-probe.mjs

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) { console.error('FAIL: немає ключів Supabase.'); process.exit(1) }
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLES = [
  'content',
  'author_profiles',
  'author_consents',
  'author_consent_current',
  'author_earnings',
  'contracts',
  'contract_works',
]

for (const t of TABLES) {
  const { data, error, count } = await supabase
    .from(t)
    .select('*', { count: 'exact' })
    .limit(1)
  if (error) {
    console.log(`\n${t}: НЕДОСТУПНА (${error.message})`)
    continue
  }
  const cols = data && data[0] ? Object.keys(data[0]) : []
  console.log(`\n${t}: рядків ${count}`)
  console.log(`  поля: ${cols.join(', ') || '(порожня, полів не видно)'}`)
}

// Скільки опублікованих творів і скільки з них мають author_id
const { count: pub } = await supabase
  .from('content')
  .select('*', { count: 'exact', head: true })
  .eq('type', 'story')
  .in('status', ['approved', 'published'])
console.log(`\nОпублікованих історій (approved+published): ${pub}`)

const { count: withAuthor } = await supabase
  .from('content')
  .select('*', { count: 'exact', head: true })
  .eq('type', 'story')
  .in('status', ['approved', 'published'])
  .not('author_id', 'is', null)
console.log(`З них мають author_id: ${withAuthor}`)
