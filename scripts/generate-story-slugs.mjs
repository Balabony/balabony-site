// Generates Latin slugs for all stories from their Ukrainian titles.
// Transliteration: slugify with locale:'uk' (UA→Latin, e.g. "Пригоди" → "pryhody").
// Collision handling: base, base-2, base-3, ...
// Dry-run: shows all generated slugs and asks for confirmation before writing.
//
// Prerequisites — run once in Supabase SQL Editor:
//   ALTER TABLE stories ADD COLUMN IF NOT EXISTS slug TEXT;
//
// Usage: node --env-file=.env.local scripts/generate-story-slugs.mjs
//        node --env-file=.env.local scripts/generate-story-slugs.mjs --dry-run

import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'
import { createInterface } from 'readline'

const DRY_RUN = process.argv.includes('--dry-run')
const YES     = process.argv.includes('--yes')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function toSlug(title) {
  return slugify(title, { locale: 'uk', lower: true, strict: true })
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
const { data: stories, error } = await supabase
  .from('stories')
  .select('id, title, slug')
  .order('created_at')

if (error) { console.error('Failed to fetch stories:', error.message); process.exit(1) }
console.log(`Fetched ${stories.length} stories\n`)

// ── Generate slugs ────────────────────────────────────────────────────────────
const seen = new Set(stories.filter(s => s.slug).map(s => s.slug))

const updates = []
for (const story of stories) {
  if (story.slug) {
    console.log(`  SKIP  [already has slug] ${story.slug}`)
    continue
  }

  const base = toSlug(story.title)
  let slug = base
  let n = 1
  while (seen.has(slug)) { n++; slug = `${base}-${n}` }
  seen.add(slug)

  updates.push({ id: story.id, slug, title: story.title })
}

if (!updates.length) {
  console.log('All stories already have slugs. Nothing to do.')
  process.exit(0)
}

console.log(`\nSlugs to generate (${updates.length}):\n`)
for (const u of updates) {
  console.log(`  ${u.title.slice(0, 48).padEnd(48)}  →  ${u.slug}`)
}

if (DRY_RUN) {
  console.log('\n[dry-run] No changes written.')
  process.exit(0)
}

// ── Confirm ───────────────────────────────────────────────────────────────────
if (!YES) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise(res => rl.question('\nWrite these slugs to DB? [y/N] ', res))
  rl.close()
  if (answer.trim().toLowerCase() !== 'y') {
    console.log('Aborted.')
    process.exit(0)
  }
} else {
  console.log('\n[--yes] Skipping confirmation, writing to DB...')
}

// ── Write ─────────────────────────────────────────────────────────────────────
console.log('')
for (const u of updates) {
  const { error: err } = await supabase
    .from('stories')
    .update({ slug: u.slug })
    .eq('id', u.id)
  if (err) { console.error(`  FAILED ${u.id}: ${err.message}`); process.exit(1) }
  console.log(`  OK  ${u.slug}`)
}

console.log(`\nDone. ${updates.length} slugs written.`)
