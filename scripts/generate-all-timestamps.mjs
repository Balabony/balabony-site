#!/usr/bin/env node
/**
 * Generate LYRICS_TIMESTAMPS for all 18 karaoke songs in one run.
 *
 * Usage:
 *   node scripts/generate-all-timestamps.mjs
 *   node scripts/generate-all-timestamps.mjs 1 3 5   # specific ids only
 *
 * Processes songs sequentially (one Whisper call at a time).
 * Prints a complete LYRICS_TIMESTAMPS object at the end.
 * Failed songs are skipped and reported at the end.
 */

import { processOneSong, readApiKey } from './generate-timestamps.mjs'

const ALL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

async function main() {
  const apiKey = readApiKey()
  if (!apiKey) {
    console.error('OPENAI_API_KEY not found. Add it to .env.local:\n  OPENAI_API_KEY=sk-...')
    process.exit(1)
  }

  // Allow running a subset: node generate-all-timestamps.mjs 1 3 5
  const ids = process.argv.slice(2).map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 18)
  const songIds = ids.length ? ids : ALL_IDS

  console.log(`Processing ${songIds.length} songs: [${songIds.join(', ')}]\n`)

  const results = {}
  const failed  = []

  for (const id of songIds) {
    try {
      const { timestamps } = await processOneSong(id, apiKey)
      results[id] = timestamps
      console.log(`✓ Song ${id} done\n`)
    } catch (e) {
      console.error(`✗ Song ${id} failed: ${e.message}\n`)
      failed.push(id)
    }
  }

  // Output
  console.log('='.repeat(70))
  console.log('// Replace LYRICS_TIMESTAMPS in KaraokeSection.tsx with:')
  console.log('const LYRICS_TIMESTAMPS: Record<number, number[]> = {')
  for (const id of songIds) {
    if (results[id]) {
      console.log(`  ${id}: [${results[id].join(', ')}],`)
    }
  }
  console.log('}')
  console.log('='.repeat(70))

  if (failed.length) {
    console.log(`\nFailed songs (re-run individually): [${failed.join(', ')}]`)
    console.log('  node scripts/generate-timestamps.mjs <id>')
  }
}

main().catch(e => { console.error(e.message); process.exit(1) })
