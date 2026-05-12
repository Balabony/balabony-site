// scripts/apply-cleanup.mjs (v2 - expanded patterns)
//
// Writes cleaned versions into content.corrected_text and switches
// published_version='corrected' for all balabony series.
//
// V2 CHANGES vs v1:
// - Now strips structural headers in inline form: "Hook: Title", "Final: Title", etc.
// - New header types: "Vstup: Title", "Chastyna N: Title"
// - New audio block formats: (Zvukovyi suprovid:), (Zvukovyi fon:), (Zvukovyi soprovid:)
//
// SAFE:
// - Requires --confirm flag to execute
// - Without --confirm: preview only (what will be done)
// - Saves log to scripts/cleanup-apply/apply-log.json
// - Skips series with non-standard published_version (need manual attention)
//
// Run (dry-run):
//   node --env-file=.env.local scripts/apply-cleanup.mjs
//
// Run (real update):
//   node --env-file=.env.local scripts/apply-cleanup.mjs --confirm

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CONFIRM = process.argv.includes('--confirm');

// --- env ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('FAIL: SUPABASE env not configured');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const OUT_DIR = 'scripts/cleanup-apply';
mkdirSync(OUT_DIR, { recursive: true });

// --- strip logic ---
function softStrip(text) {
  let out = text;
  // Inline parenthetical remarks - exclude audio blocks (including new "Zvukovyi" variants)
  out = out.replace(/\s*\(((?!\u0417\u0432\u0443\u043a:|\u041c\u0443\u0437\u0438\u043a\u0430:|\u0428\u0443\u043c:|\u0422\u0438\u0448\u0430:|\u0417\u0432\u0443\u043a\u043e\u0432\u0438\u0439\s)[^()]{1,300}?)\)/g, (match, content) => {
    if (/^\d+[-\s]?[\u0430-\u044f\u0410-\u042f\u0456\u0457\u0406\u0407\u0454\u0404\u0491\u0490]{0,5}$/.test(content.trim())) return match;
    return '';
  });
  out = out.replace(/ +/g, ' ');
  out = out.split('\n').map(line => line.trim()).join('\n');
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}

function aggressiveStrip(text) {
  let out = softStrip(text);
  // Audio blocks: Zvuk, Muzyka, Shum, Tysha + Zvukovyi suprovid/soprovid/fon
  out = out.replace(/\s*\((?:\u0417\u0432\u0443\u043a|\u041c\u0443\u0437\u0438\u043a\u0430|\u0428\u0443\u043c|\u0422\u0438\u0448\u0430|\u0417\u0432\u0443\u043a\u043e\u0432\u0438\u0439\s+(?:\u0441\u0443\u043f\u0440\u043e\u0432\u0456\u0434|\u0441\u043e\u043f\u0440\u043e\u0432\u0456\u0434|\u0444\u043e\u043d)):[^()]{1,800}?\)\s*/g, '\n\n');
  out = out.replace(/ +/g, ' ');
  out = out.split('\n').map(line => line.trim()).join('\n');
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}

function cleanupBody(text) {
  let out = aggressiveStrip(text);

  // Structural headers (alone, with (...), or as "Header: Title")
  // Hook, Hachok, Zav'yazka, Rozv'yazka, Konflikt, Kulminatsia, Final, Epilog, Prolog, Vstup
  const headers = [
    'Hook', '\u0413\u0430\u0447\u043e\u043a',
    "\u0417\u0430\u0432'\u044f\u0437\u043a\u0430", '\u0417\u0430\u0432\u044f\u0437\u043a\u0430',
    "\u0420\u043e\u0437\u0432'\u044f\u0437\u043a\u0430", '\u0420\u043e\u0437\u0432\u044f\u0437\u043a\u0430',
    '\u041a\u043e\u043d\u0444\u043b\u0456\u043a\u0442', '\u041a\u0443\u043b\u044c\u043c\u0456\u043d\u0430\u0446\u0456\u044f', '\u0424\u0456\u043d\u0430\u043b',
    '\u0415\u043f\u0456\u043b\u043e\u0433', '\u041f\u0440\u043e\u043b\u043e\u0433',
    '\u0412\u0441\u0442\u0443\u043f',
  ];
  const headerAlternatives = headers
    .map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['\u2019]?"))
    .join('|');
  // Match: header alone OR "Header (Title)" OR "Header: Title"
  const headerLineRegex = new RegExp(
    `^\\s*(?:${headerAlternatives})(?:\\s*\\([^)]{1,30}\\))?(?:\\s*:\\s*[^\\n]{0,200})?\\s*$`,
    'i'
  );

  // "Chastyna N: Title" or "Chastyna N" alone
  const partRegex = /^\s*\u0427\u0430\u0441\u0442\u0438\u043d\u0430\s+\d+(?:\s*:\s*[^\n]{0,200})?\s*$/i;

  const audioNotePatterns = [
    /^\s*\u041f\u043e\u0440\u0430\u0434\u0430 \u0432\u0456\u0434 Storriss/i,
    /^\s*\u041f\u043e\u0440\u0430\u0434\u0430 \u0434\u043b\u044f \u043e\u0437\u0432\u0443\u0447\u043a\u0438/i,
    /^\s*\u0412\u0430\u0436\u043b\u0438\u0432\u043e:\s*\u0437\u0432\u0443\u043a/i,
    /^\s*\u041f\u0440\u0438\u043c\u0456\u0442\u043a\u0430 \u0434\u043b\u044f \u043e\u0437\u0432\u0443\u0447\u043a\u0438/i,
    /^\s*\u0422\u0435\u0445\u043d\u0456\u0447\u043d\u0430 \u043f\u0440\u0438\u043c\u0456\u0442\u043a\u0430/i,
  ];

  out = out
    .split('\n')
    .filter(line => {
      if (headerLineRegex.test(line)) return false;
      if (partRegex.test(line)) return false;
      if (audioNotePatterns.some(p => p.test(line))) return false;
      return true;
    })
    .join('\n');

  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}

// --- mode banner ---
console.log('================================================================');
if (CONFIRM) {
  console.log('LIVE MODE - WILL WRITE TO DB');
} else {
  console.log('PREVIEW MODE - DB not touched. For real write add --confirm');
}
console.log('================================================================\n');

// --- fetch ---
console.log('Fetching balabony series from content...');
const { data: series, error } = await supabase
  .from('content')
  .select('id, slug, title, season_number, episode_number, text, published_version, status, corrected_text')
  .eq('type', 'balabony')
  .eq('status', 'published')
  .order('season_number', { ascending: true })
  .order('episode_number', { ascending: true });

if (error) {
  console.error('FAIL:', error);
  process.exit(1);
}

console.log(`Fetched ${series.length} series.\n`);

// --- process ---
const planned = [];
const skipped = [];

for (const row of series) {
  if (row.published_version !== 'original') {
    skipped.push({ slug: row.slug, reason: `published_version=${row.published_version}` });
    continue;
  }

  if (!row.text || row.text.length === 0) {
    skipped.push({ slug: row.slug, reason: 'empty text' });
    continue;
  }

  const cleaned = cleanupBody(row.text);

  if (cleaned.length === 0) {
    skipped.push({ slug: row.slug, reason: 'cleaned result is empty' });
    continue;
  }

  planned.push({
    id: row.id,
    slug: row.slug,
    title: row.title,
    original_len: row.text.length,
    cleaned_len: cleaned.length,
    cleaned,
    had_corrected: !!row.corrected_text,
  });
}

console.log(`Planned updates: ${planned.length}`);
console.log(`Skipped:         ${skipped.length}`);
if (skipped.length) {
  console.log('\nSkipped series:');
  for (const s of skipped) console.log(`  - ${s.slug}: ${s.reason}`);
}

console.log('\n--- Update plan ---');
for (const p of planned.slice(0, 5)) {
  console.log(`  ${p.slug}: ${p.original_len} -> ${p.cleaned_len}${p.had_corrected ? '  ! corrected_text was not null, will be overwritten' : ''}`);
}
if (planned.length > 5) console.log(`  ... and ${planned.length - 5} more`);

if (!CONFIRM) {
  console.log('\n[OK] PREVIEW MODE. No DB writes performed.');
  console.log('To execute, re-run with --confirm flag.');
  process.exit(0);
}

// --- live update ---
console.log('\n[LIVE] Writing to DB...\n');

const log = [];
let success = 0;
let failed = 0;

for (const p of planned) {
  const { error: updErr } = await supabase
    .from('content')
    .update({
      corrected_text: p.cleaned,
      published_version: 'corrected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', p.id);

  if (updErr) {
    console.error(`  X ${p.slug}: ${updErr.message}`);
    log.push({ slug: p.slug, status: 'error', error: updErr.message });
    failed++;
  } else {
    console.log(`  V ${p.slug}: ${p.original_len} -> ${p.cleaned_len}`);
    log.push({ slug: p.slug, status: 'ok', original_len: p.original_len, cleaned_len: p.cleaned_len });
    success++;
  }
}

console.log(`\n=== DONE ===`);
console.log(`Success: ${success}`);
console.log(`Failed:  ${failed}`);
console.log(`Skipped: ${skipped.length}`);

writeFileSync(
  join(OUT_DIR, 'apply-log.json'),
  JSON.stringify({ timestamp: new Date().toISOString(), success, failed, log, skipped }, null, 2),
  'utf8'
);
console.log(`\nLog written to ${join(OUT_DIR, 'apply-log.json')}`);
console.log(`\nROLLBACK (if needed):`);
console.log(`  UPDATE content SET published_version = 'original' WHERE type = 'balabony' AND published_version = 'corrected';`);