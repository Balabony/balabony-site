// scripts/dry-run-cleanup.mjs
//
// Тягне всі balabony-серії з content, генерує очищені версії,
// пише результати в файли. БД НЕ ТОРКАЄ.
//
// Запуск:
//   node --env-file=.env.local scripts/dry-run-cleanup.mjs
//
// Виходи:
//   scripts/cleanup-dry-run/originals/sNNeNN-original.md  (для діффу)
//   scripts/cleanup-dry-run/cleaned/sNNeNN-cleaned.md     (що буде записано)
//   scripts/cleanup-dry-run/report.md                     (звіт по всіх серіях)
//   scripts/cleanup-dry-run/report.json                   (machine-readable)

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// --- env ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('FAIL: SUPABASE env not configured');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// --- output dirs ---
const OUT_DIR = 'scripts/cleanup-dry-run';
const ORIG_DIR = join(OUT_DIR, 'originals');
const CLEAN_DIR = join(OUT_DIR, 'cleaned');
mkdirSync(ORIG_DIR, { recursive: true });
mkdirSync(CLEAN_DIR, { recursive: true });

// --- strip logic (копія з прототипу) ---
function softStrip(text) {
  let out = text;
  out = out.replace(/\s*\(((?!Звук:|Музика:|Шум:|Тиша:)[^()]{1,300}?)\)/g, (match, content) => {
    if (/^\d+[-\s]?[а-яА-ЯіїІЇєЄґҐ]{0,5}$/.test(content.trim())) {
      return match;
    }
    return '';
  });
  out = out.replace(/ +/g, ' ');
  out = out.split('\n').map(line => line.trim()).join('\n');
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}

function aggressiveStrip(text) {
  let out = softStrip(text);
  out = out.replace(/\s*\((?:Звук|Музика|Шум|Тиша):[^()]{1,500}?\)\s*/g, '\n\n');
  out = out.replace(/ +/g, ' ');
  out = out.split('\n').map(line => line.trim()).join('\n');
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}

function cleanupBody(text) {
  let out = aggressiveStrip(text);

  const headers = [
    'Hook', 'Гачок',
    "Зав'язка", 'Завязка',
    "Розв'язка", 'Розвязка',
    'Конфлікт', 'Кульмінація', 'Фінал',
    'Епілог', 'Пролог',
  ];
  const headerAlternatives = headers
    .map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['']?"))
    .join('|');
  const headerLineRegex = new RegExp(
    `^\\s*(?:${headerAlternatives})(?:\\s*\\([^)]{1,30}\\))?\\s*$`,
    'i'
  );

  const audioNotePatterns = [
    /^\s*Порада від Storriss/i,
    /^\s*Порада для озвучки/i,
    /^\s*Важливо:\s*звук/i,
    /^\s*Примітка для озвучки/i,
    /^\s*Технічна примітка/i,
  ];

  out = out
    .split('\n')
    .filter(line => {
      if (headerLineRegex.test(line)) return false;
      if (audioNotePatterns.some(p => p.test(line))) return false;
      return true;
    })
    .join('\n');

  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}

// --- main ---
console.log('Fetching balabony series from content...');
const { data: series, error } = await supabase
  .from('content')
  .select('slug, title, season_number, episode_number, text, published_version, status')
  .eq('type', 'balabony')
  .eq('status', 'published')
  .order('season_number', { ascending: true })
  .order('episode_number', { ascending: true });

if (error) {
  console.error('FAIL:', error);
  process.exit(1);
}

console.log(`Fetched ${series.length} series.\n`);

const report = [];

for (const row of series) {
  const slug = row.slug;
  const text = row.text || '';
  const cleaned = cleanupBody(text);

  const removed = text.length - cleaned.length;
  const pct = text.length > 0 ? Math.round((removed / text.length) * 100) : 0;

  const flags = [];
  if (text.length === 0) flags.push('EMPTY_TEXT');
  if (cleaned.length === 0) flags.push('CLEANED_EMPTY');
  if (pct === 0 && text.length > 0) flags.push('NO_CHANGE');
  if (pct > 40) flags.push('SUSPICIOUS_LARGE_REMOVAL');
  if (row.published_version !== 'original') flags.push(`PV_NOT_ORIGINAL:${row.published_version}`);

  // знайдемо leftover паттерни які могли пропустити
  const leftoverPatterns = [];
  if (/\(Звук[ауи]?:|\(Музик[аи]:|\(SFX:|\(Шуми?:/i.test(cleaned)) leftoverPatterns.push('leftover_sound_marker');
  if (/^(Hook|Конфлікт|Кульмінація|Фінал|Гачок|Епілог|Пролог|Зав'?язка|Розв'?язка)\s*$/im.test(cleaned)) leftoverPatterns.push('leftover_header');
  if (/Storriss|для озвучки|для аудіо/i.test(cleaned)) leftoverPatterns.push('leftover_audio_note');

  report.push({
    slug,
    title: row.title,
    season: row.season_number,
    episode: row.episode_number,
    original_len: text.length,
    cleaned_len: cleaned.length,
    removed,
    pct_removed: pct,
    flags,
    leftoverPatterns,
  });

  writeFileSync(join(ORIG_DIR, `${slug}-original.md`), text, 'utf8');
  writeFileSync(join(CLEAN_DIR, `${slug}-cleaned.md`), cleaned, 'utf8');

  console.log(`${slug.padEnd(8)} ${(row.title || '').slice(0, 40).padEnd(42)} ${String(text.length).padStart(5)} → ${String(cleaned.length).padStart(5)} (-${pct}%)${flags.length ? '  ⚠ ' + flags.join(',') : ''}${leftoverPatterns.length ? '  ⚠ leftover:' + leftoverPatterns.join(',') : ''}`);
}

// --- summary ---
const total = report.length;
const totalOriginal = report.reduce((s, r) => s + r.original_len, 0);
const totalCleaned = report.reduce((s, r) => s + r.cleaned_len, 0);
const avgPct = Math.round(report.reduce((s, r) => s + r.pct_removed, 0) / total);

const flagged = report.filter(r => r.flags.length > 0 || r.leftoverPatterns.length > 0);

const summary = `
=== SUMMARY ===
Total series:      ${total}
Total chars before:${totalOriginal.toLocaleString()}
Total chars after: ${totalCleaned.toLocaleString()}
Avg removal:       ${avgPct}%
Flagged for review:${flagged.length}
`;

console.log(summary);

// --- write reports ---
writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

const mdReport = [
  '# Cleanup Dry-Run Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `- Total series: **${total}**`,
  `- Chars before: ${totalOriginal.toLocaleString()}`,
  `- Chars after: ${totalCleaned.toLocaleString()}`,
  `- Avg removal: **${avgPct}%**`,
  `- Flagged for review: **${flagged.length}**`,
  '',
  '## Per-series breakdown',
  '',
  '| Slug | Title | Before | After | -% | Flags |',
  '|------|-------|-------:|------:|---:|-------|',
  ...report.map(r => `| ${r.slug} | ${(r.title || '').slice(0, 50)} | ${r.original_len} | ${r.cleaned_len} | ${r.pct_removed}% | ${[...r.flags, ...r.leftoverPatterns].join(', ') || '—'} |`),
  '',
  '## Flagged series (need manual review)',
  '',
  ...(flagged.length === 0
    ? ['_None_']
    : flagged.map(r => `### ${r.slug} — ${r.title}\n\nFlags: \`${[...r.flags, ...r.leftoverPatterns].join(', ')}\`\n\nBefore: ${r.original_len} chars, After: ${r.cleaned_len} chars (-${r.pct_removed}%)\n`)),
].join('\n');

writeFileSync(join(OUT_DIR, 'report.md'), mdReport, 'utf8');

console.log(`Reports written:`);
console.log(`  ${join(OUT_DIR, 'report.md')}`);
console.log(`  ${join(OUT_DIR, 'report.json')}`);
console.log(`Originals:  ${ORIG_DIR}`);
console.log(`Cleaned:    ${CLEAN_DIR}`);
console.log(`\nNEXT STEP: review report.md (especially flagged section), spot-check 5-10 cleaned files, then run apply-cleanup.mjs`);
