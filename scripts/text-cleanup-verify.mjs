// scripts/text-cleanup-verify.mjs
//
// Перевіряє план ПЕРЕД записом: чи не втрачається справжній текст.
// БАЗУ НЕ ТОРКАЄ.
//
// Запуск:
//   node --env-file=.env.local scripts/text-cleanup-verify.mjs
//
// Виходи:
//   scripts/text-cleanup/verify.md          — підсумок і підозрілі випадки
//   scripts/text-cleanup/samples/<...>.txt  — повні тексти «до» і «після»
//                                             для найбільших скорочень

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('FAIL: немає ключів Supabase.')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseKey)

const OUT_DIR = 'scripts/text-cleanup'
const SAMPLES = join(OUT_DIR, 'samples')
mkdirSync(SAMPLES, { recursive: true })

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

// Рахуємо ЛИШЕ кирилицю. Вордівське сміття — це латиниця («MsoNormal»,
// «mso-bidi-font-family», «Calibri»), тож загальний лічильник літер завжди
// показував би «втрату» там, де зник лише службовий мотлох. Українського
// тексту в тегах і стилях немає, тому кирилиця — чесна міра.
function letters(s) {
  return (s.match(/[\u0400-\u04FF]/g) ?? []).length
}

// Слова твору: кириличні послідовності від трьох літер. Якщо хоч одне таке
// слово зникло — це вже втрата тексту, а не форматування.
function words(s) {
  return (s.match(/[\u0400-\u04FF]{3,}/g) ?? [])
}

function missingWords(before, after) {
  const inAfter = new Map()
  for (const w of words(after)) inAfter.set(w, (inAfter.get(w) ?? 0) + 1)
  const lost = []
  for (const w of words(before)) {
    const left = inAfter.get(w) ?? 0
    if (left === 0) { lost.push(w); continue }
    inAfter.set(w, left - 1)
  }
  return lost
}

// Які саме невидимі символи зникли — щоб «інше (пробіли/переноси)» перестало
// бути загадкою.
function invisibleDiff(before, after) {
  const names = {
    '\r': 'CR (перенос Windows)',
    '\u00a0': 'нерозривний пробіл',
    '\u200b': 'нульовий пробіл',
    '\u2002': 'en-пробіл',
    '\u2003': 'em-пробіл',
    '\u2009': 'тонкий пробіл',
    '\u00ad': 'мʼякий перенос',
    '\ufeff': 'BOM',
  }
  const out = []
  for (const [ch, name] of Object.entries(names)) {
    const b = (before.split(ch).length - 1)
    const a = (after.split(ch).length - 1)
    if (b !== a) out.push(`${name}: ${b} → ${a}`)
  }
  const bNl = (before.match(/\n{3,}/g) ?? []).length
  const aNl = (after.match(/\n{3,}/g) ?? []).length
  if (bNl !== aNl) out.push(`потрійних переносів: ${bNl} → ${aNl}`)
  const bTail = (before.match(/[ \t]+\n/g) ?? []).length
  const aTail = (after.match(/[ \t]+\n/g) ?? []).length
  if (bTail !== aTail) out.push(`пробілів у кінці рядка: ${bTail} → ${aTail}`)
  return out
}

const rows = await fetchAll()
const checks = []

for (const row of rows) {
  const p = planById.get(row.id)
  if (!p) continue
  for (const [field, after] of Object.entries(p.fields)) {
    const before = row[field] ?? ''
    const lb = letters(before)
    const la = letters(after)
    checks.push({
      id: row.id,
      title: row.title ?? row.slug ?? row.id,
      type: row.type,
      field,
      kind: p.kinds[field],
      lettersBefore: lb,
      lettersAfter: la,
      lettersLost: lb - la,
      charsLost: before.length - after.length,
      emptyAfter: after.trim().length === 0,
      lostWords: missingWords(before, after),
      before,
      after,
    })
  }
}

const lostLetters = checks.filter(c => c.lettersLost > 0)
const lostAnyWord = checks.filter(c => c.lostWords.length > 0)
const emptied = checks.filter(c => c.emptyAfter)
const bigDrop = checks.filter(c => c.lettersBefore > 0 && c.lettersAfter / c.lettersBefore < 0.95)

const L = []
L.push('# Перевірка плану перед записом\n')
L.push(`Перевірено полів: **${checks.length}**\n`)
L.push('## Головне\n')
L.push(`- Стають порожніми: **${emptied.length}** ${emptied.length ? '⚠️ ЦЕ ПОГАНО' : '✅'}`)
L.push(`- Втрачають хоч одну кириличну літеру: **${lostLetters.length}** ${lostLetters.length ? '⚠️ дивись нижче' : '✅'}`)
L.push(`- Втрачають хоч одне слово тексту: **${lostAnyWord.length}** ${lostAnyWord.length ? '⚠️ ЦЕ ГОЛОВНЕ' : '✅'}`)
L.push(`- Втрачають понад 5% літер: **${bigDrop.length}** ${bigDrop.length ? '⚠️' : '✅'}`)
L.push('')
L.push('Пояснення: рахується лише кирилиця. Вордівське сміття — латиниця')
L.push('(«MsoNormal», «Calibri», «mso-bidi-font-family»), тож у цю міру воно не')
L.push('потрапляє. Падіння загальної довжини саме собою нічого поганого не значить:')
L.push('зникають теги й стилі. Значення має лише рядок про втрачені слова.\n')

if (lostAnyWord.length) {
  L.push('## Втрачені слова — перевір кожен\n')
  for (const c of lostAnyWord.sort((a, b) => b.lostWords.length - a.lostWords.length).slice(0, 30)) {
    L.push(`- **${c.lostWords.length}** слів · ${c.title} · \`${c.field}\` · ${c.kind}`)
    L.push(`  - ${c.lostWords.slice(0, 15).join(', ')}`)
  }
  L.push('')
}

if (lostLetters.length) {
  L.push('## Втрата кириличних літер\n')
  for (const c of lostLetters.sort((a, b) => b.lettersLost - a.lettersLost).slice(0, 40)) {
    L.push(`- **−${c.lettersLost}** літер (${c.lettersBefore} → ${c.lettersAfter}) · ${c.title} · \`${c.field}\` · ${c.kind}`)
  }
  L.push('')
}

L.push('## Найбільші скорочення за символами (з розкладом)\n')
const biggest = [...checks].sort((a, b) => b.charsLost - a.charsLost).slice(0, 10)
for (const c of biggest) {
  L.push(`### ${c.title} · \`${c.field}\``)
  L.push(`- символів прибрано: ${c.charsLost}`)
  L.push(`- кириличних літер: ${c.lettersBefore} → ${c.lettersAfter} (${c.lettersLost === 0 ? 'без втрат ✅' : `втрачено ${c.lettersLost} ⚠️`})`)
  L.push(`- втрачених слів: ${c.lostWords.length}${c.lostWords.length ? ' → ' + c.lostWords.slice(0, 10).join(', ') : ' ✅'}`)
  L.push(`- причина: ${c.kind}`)
  const hasStyle = /<style[\s\S]*?<\/style>/i.test(c.before)
  const styleLen = hasStyle ? (c.before.match(/<style[\s\S]*?<\/style>/gi) ?? []).join('').length : 0
  if (hasStyle) L.push(`- у тексті був блок <style> на ${styleLen} символів (це вордівське сміття, не твір)`)
  L.push('')
}

// Розклад невидимих символів для категорії «інше»
const others = checks.filter(c => c.kind === 'інше (пробіли/переноси)')
L.push('## Що саме змінюється в категорії «інше (пробіли/переноси)»\n')
L.push(`Таких полів: ${others.length}. Розклад за причинами:\n`)
const reasonCount = {}
for (const c of others) {
  for (const r of invisibleDiff(c.before, c.after)) {
    const key = r.split(':')[0]
    reasonCount[key] = (reasonCount[key] ?? 0) + 1
  }
}
for (const [k, v] of Object.entries(reasonCount).sort((a, b) => b[1] - a[1])) L.push(`- ${k} — ${v}`)
L.push('')
L.push('Приклади:\n')
for (const c of others.slice(0, 5)) {
  L.push(`- ${c.title}: ${invisibleDiff(c.before, c.after).join('; ') || 'різниці не знайдено'} · літер ${c.lettersBefore} → ${c.lettersAfter}`)
}

writeFileSync(join(OUT_DIR, 'verify.md'), L.join('\n'), 'utf8')

// Повні тексти найбільших скорочень — щоб можна було прочитати очима
function safeName(s) {
  return s.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 60)
}
for (const c of biggest.slice(0, 5)) {
  writeFileSync(join(SAMPLES, `${safeName(c.title)}_BULO.txt`), c.before, 'utf8')
  writeFileSync(join(SAMPLES, `${safeName(c.title)}_STANE.txt`), c.after, 'utf8')
}

console.log('')
console.log(`Стають порожніми:        ${emptied.length}`)
console.log(`Втрачають кирилицю:      ${lostLetters.length}`)
console.log(`Втрачають слова тексту:  ${lostAnyWord.length}   <-- головне число`)
console.log(`Втрачають понад 5% літер: ${bigDrop.length}`)
console.log('')
console.log('Звіт: scripts/text-cleanup/verify.md')
console.log('Повні тексти найбільших скорочень: scripts/text-cleanup/samples/')
console.log('')
console.log('БАЗУ НЕ ЗМІНЕНО.')
