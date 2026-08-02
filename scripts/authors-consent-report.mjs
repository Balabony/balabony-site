// scripts/authors-consent-report.mjs
//
// Зведення по авторах: у кого скільки опублікованого, чи є згода, договір,
// контакти. НІЧОГО НЕ ЗМІНЮЄ.
//
// Запуск:
//   node --env-file=.env.local scripts/authors-consent-report.mjs
//
// Вихід: scripts/authors/consent-report.md

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) { console.error('FAIL: немає ключів Supabase.'); process.exit(1) }
const supabase = createClient(supabaseUrl, supabaseKey)

const OUT = 'scripts/authors'
mkdirSync(OUT, { recursive: true })

// Таблиця договорів названа інакше, ніж «contracts» — шукаємо серед варіантів.
let contractsTable = null
for (const t of ['author_contracts', 'agreements', 'author_agreements', 'contracts_authors', 'contract']) {
  const { error } = await supabase.from(t).select('*').limit(1)
  if (!error) { contractsTable = t; break }
}

async function all(table, select) {
  const rows = []
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data || !data.length) break
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

const stories = await all('content', 'id, title, slug, status, author_name, author_id, approved_at, type')
const profiles = await all('author_profiles', 'user_id, display_name, full_name, pen_name, email, phone, is_fop, is_active')
const consents = await all('author_consent_current', 'author_name, scope, status, channel, happened_at, note')
const contracts = contractsTable ? await all(contractsTable, '*') : []

const published = stories.filter(s => s.type === 'story' && ['approved', 'published'].includes(s.status))

// Згоди — за іменем автора; зводимо до нижнього регістру, бо в базі трапляється
// різне написання («Кришталева» / «Криштальова» вже ловили руками).
const consentByName = new Map()
for (const c of consents) {
  if (!c.author_name) continue
  consentByName.set(c.author_name.trim().toLowerCase(), c)
}

const profileById = new Map(profiles.map(p => [p.user_id, p]))
const profileByName = new Map()
for (const p of profiles) {
  for (const n of [p.full_name, p.display_name, p.pen_name]) {
    if (n) profileByName.set(n.trim().toLowerCase(), p)
  }
}

// Договори: рахуємо, скільки в кого, як вийде — структура наперед невідома
const contractCountByUser = new Map()
for (const c of contracts) {
  const uid = c.user_id ?? c.author_id ?? null
  if (uid) contractCountByUser.set(uid, (contractCountByUser.get(uid) ?? 0) + 1)
}

// Групуємо опубліковане за автором
const byAuthor = new Map()
for (const s of published) {
  const key = (s.author_name ?? '(без імені)').trim()
  if (!byAuthor.has(key)) byAuthor.set(key, { name: key, works: [], withId: 0, withoutId: 0, userIds: new Set() })
  const g = byAuthor.get(key)
  g.works.push(s)
  if (s.author_id) { g.withId++; g.userIds.add(s.author_id) } else g.withoutId++
}

const groups = [...byAuthor.values()].map(g => {
  const consent = consentByName.get(g.name.toLowerCase()) ?? null
  const uid = [...g.userIds][0] ?? null
  const profile = (uid && profileById.get(uid)) || profileByName.get(g.name.toLowerCase()) || null
  return {
    ...g,
    consent,
    profile,
    contracts: uid ? (contractCountByUser.get(uid) ?? 0) : 0,
    hasContacts: Boolean(profile && (profile.phone || profile.email)),
  }
})

// Ризик: багато опублікованого + немає згоди + немає контактів
const risk = g => {
  let r = 0
  if (!g.consent) r += 1000
  if (!g.hasContacts) r += 500
  return r + g.works.length
}
groups.sort((a, b) => risk(b) - risk(a))

const noConsent = groups.filter(g => !g.consent)
const refused = groups.filter(g => g.consent && g.consent.status === 'refused')
const given = groups.filter(g => g.consent && g.consent.status === 'given')

const L = []
L.push('# Згоди авторів — зведення\n')
L.push(`Дата: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}\n`)
L.push(`Таблиця договорів: ${contractsTable ?? 'НЕ ЗНАЙДЕНА'}\n`)
L.push(`Опублікованих історій: **${published.length}**`)
L.push(`Авторів (за іменем у творі): **${groups.length}**`)
L.push(`Зі згодою «given»: **${given.length}**`)
L.push(`З відмовою: **${refused.length}**`)
L.push(`**Без жодного запису згоди: ${noConsent.length}** — і в них ${noConsent.reduce((s, g) => s + g.works.length, 0)} опублікованих творів\n`)

if (refused.length) {
  L.push('## ⚠️ Відмови — твори мають бути зняті з публікації\n')
  for (const g of refused) {
    L.push(`- **${g.name}** — опублікованих зараз: ${g.works.length}`)
    for (const w of g.works.slice(0, 10)) L.push(`  - ${w.title} (${w.status})`)
  }
  L.push('')
}

L.push('## Без згоди — за спаданням ризику\n')
L.push('| Автор | Творів | Контакти | Договорів | author_id |')
L.push('|---|---|---|---|---|')
for (const g of noConsent) {
  const contacts = g.profile
    ? [g.profile.phone, g.profile.email].filter(Boolean).join(' · ') || '— немає —'
    : '— профілю немає —'
  L.push(`| ${g.name} | ${g.works.length} | ${contacts} | ${g.contracts} | ${g.withId}/${g.works.length} |`)
}
L.push('')

L.push('## Твори без згоди — поіменно\n')
for (const g of noConsent) {
  L.push(`### ${g.name} (${g.works.length})\n`)
  for (const w of g.works) L.push(`- ${w.title} · \`${w.slug}\` · ${w.status}`)
  L.push('')
}

L.push('## Зі згодою — для повноти\n')
for (const g of given) {
  L.push(`- ${g.name} — творів ${g.works.length}, канал: ${g.consent.channel ?? '—'}, коли: ${(g.consent.happened_at ?? '').slice(0, 10)}`)
}

writeFileSync(join(OUT, 'consent-report.md'), L.join('\n'), 'utf8')

console.log('')
console.log(`Опублікованих історій:      ${published.length}`)
console.log(`Авторів:                    ${groups.length}`)
console.log(`Зі згодою:                  ${given.length}`)
console.log(`Відмов:                     ${refused.length}`)
console.log(`БЕЗ згоди:                  ${noConsent.length}  (творів: ${noConsent.reduce((s, g) => s + g.works.length, 0)})`)
console.log(`Таблиця договорів:          ${contractsTable ?? 'не знайдена'}`)
console.log('')
console.log('Звіт: scripts/authors/consent-report.md')
