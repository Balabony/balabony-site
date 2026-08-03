// scripts/check-two-authors.mjs
//
// Показує все, що є в базі по двох авторах, ПЕРЕД зняттям з публікації.
// НІЧОГО НЕ ЗМІНЮЄ.
//
// Запуск:
//   node --env-file=.env.local scripts/check-two-authors.mjs

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) { console.error('FAIL: немає ключів Supabase.'); process.exit(1) }
const supabase = createClient(supabaseUrl, supabaseKey)

// Шукаємо за прізвищем, щоб зловити різні написання імені та можливі помилки набору.
const TARGETS = ['Колодій', 'Грабар']

for (const needle of TARGETS) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`ПОШУК: ${needle}`)
  console.log('='.repeat(60))

  const { data: works, error } = await supabase
    .from('content')
    .select('id, title, slug, status, type, author_name, author_id, approved_at, published_at')
    .ilike('author_name', `%${needle}%`)
    .order('status')
  if (error) { console.error('  помилка:', error.message); continue }

  if (!works || works.length === 0) {
    console.log('  творів не знайдено')
  } else {
    const byName = {}
    for (const w of works) {
      const k = w.author_name ?? '—'
      ;(byName[k] ??= []).push(w)
    }
    for (const [name, list] of Object.entries(byName)) {
      console.log(`\n  «${name}» — творів: ${list.length}`)
      for (const w of list) {
        console.log(`    [${w.status}] ${w.title}  ·  ${w.slug ?? '—'}  ·  тип: ${w.type}  ·  author_id: ${w.author_id ? 'є' : 'нема'}`)
      }
    }
  }

  // Згоди
  const { data: consents } = await supabase
    .from('author_consents')
    .select('author_name, scope, status, channel, happened_at, note')
    .ilike('author_name', `%${needle}%`)
  console.log(`\n  Записи згоди: ${consents?.length ?? 0}`)
  for (const c of consents ?? []) {
    console.log(`    ${c.author_name} · ${c.status} · ${c.channel ?? '—'} · ${(c.happened_at ?? '').slice(0, 10)} · ${c.note ?? ''}`)
  }

  // Профіль
  const { data: profiles } = await supabase
    .from('author_profiles')
    .select('user_id, full_name, display_name, pen_name, email, phone')
    .or(`full_name.ilike.%${needle}%,display_name.ilike.%${needle}%,pen_name.ilike.%${needle}%`)
  console.log(`  Профілі: ${profiles?.length ?? 0}`)
  for (const p of profiles ?? []) {
    console.log(`    ${p.full_name ?? p.display_name ?? '—'} · ${p.email ?? 'без пошти'} · ${p.phone ?? 'без телефону'}`)
  }

  // Нарахування
  const { count: earnings } = await supabase
    .from('author_earnings')
    .select('*', { count: 'exact', head: true })
  if (earnings === 0) console.log('  Нарахувань: таблиця порожня загалом')
}

console.log('\nБАЗУ НЕ ЗМІНЕНО.')
