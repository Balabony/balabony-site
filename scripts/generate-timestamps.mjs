#!/usr/bin/env node
/**
 * Generate LYRICS_TIMESTAMPS for a karaoke song using OpenAI Whisper.
 *
 * Usage:
 *   node scripts/generate-timestamps.mjs <songId>
 *   node scripts/generate-timestamps.mjs 2
 *
 * Requires OPENAI_API_KEY in .env.local or as an environment variable.
 * Uses Node 18+ built-in fetch — no extra packages needed.
 *
 * Output: a LYRICS_TIMESTAMPS entry ready to paste into KaraokeSection.tsx.
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readApiKey() {
  try {
    const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of env.split('\n')) {
      const eqIdx = line.indexOf('=')
      if (eqIdx < 0) continue
      const key = line.slice(0, eqIdx).trim()
      if (key === 'OPENAI_API_KEY') return line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '')
    }
  } catch {}
  return process.env.OPENAI_API_KEY ?? ''
}

/**
 * Parse the lyrics for a given song id directly from KaraokeSection.tsx
 * by finding the template-literal block after `id: N,`.
 */
function extractLyrics(songId) {
  const src = readFileSync(join(ROOT, 'app/components/KaraokeSection.tsx'), 'utf8')

  const idPos = src.indexOf(`  id: ${songId},`)
  if (idPos === -1) throw new Error(`Song id ${songId} not found in SONGS array`)

  const lyricsMarker = 'lyrics:\n`'
  const lyricsPos = src.indexOf(lyricsMarker, idPos)
  if (lyricsPos === -1) throw new Error(`Lyrics block not found for song ${songId}`)

  const start = lyricsPos + lyricsMarker.length
  const end   = src.indexOf('`,', start)
  if (end === -1) throw new Error('Lyrics closing backtick not found')

  return src.slice(start, end).split('\n')
}

/** Lowercase, strip punctuation, collapse whitespace. */
function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[''`"«»—–\-]/g, ' ')
    .replace(/[^а-яёіїєґa-z0-9\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Fraction of words in `line` that appear in `segText`.
 * Scores 0–1; higher = better match.
 */
function wordOverlap(line, segText) {
  const lineWords = new Set(normalize(line).split(' ').filter(Boolean))
  if (!lineWords.size) return 0
  const segWords = normalize(segText).split(' ').filter(Boolean)
  const hits = segWords.filter(w => lineWords.has(w)).length
  return hits / lineWords.size
}

// ---------------------------------------------------------------------------
// Whisper API
// ---------------------------------------------------------------------------

async function transcribe(mp3Path, apiKey) {
  const audioData = readFileSync(mp3Path)
  const filename  = mp3Path.split(/[\\/]/).pop()

  const form = new FormData()
  form.append('file', new Blob([audioData], { type: 'audio/mpeg' }), filename)
  form.append('model', 'whisper-1')
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'segment')
  form.append('language', 'uk')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Whisper API ${res.status}: ${body}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Segment → line matching
// ---------------------------------------------------------------------------

/**
 * For each lyrics line, find the best-matching Whisper segment (by word overlap).
 * Segments are consumed in order so earlier lines can't steal segments from later ones.
 * Empty lines get a small +2 s gap from the previous timestamp.
 */
function matchSegmentsToLines(lines, segments) {
  const timestamps = []
  let segCursor = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line) {
      const prev = timestamps.length ? timestamps[timestamps.length - 1] : 0
      timestamps.push(prev + 2)
      console.log(`  [${String(i).padStart(2)}] t=${String(prev + 2).padStart(4)}s  (empty line)`)
      continue
    }

    // Search up to 12 segments ahead for the best word-overlap match
    let bestScore = 0
    let bestIdx   = segCursor
    const limit   = Math.min(segments.length, segCursor + 12)

    for (let j = segCursor; j < limit; j++) {
      const score = wordOverlap(line, segments[j].text)
      if (score > bestScore) { bestScore = score; bestIdx = j }
    }

    const seg = segments[bestIdx] ?? segments[segments.length - 1]
    const t   = Math.round(seg?.start ?? i * 8)
    timestamps.push(t)

    if (bestScore > 0) segCursor = bestIdx + 1  // advance cursor past matched segment

    console.log(
      `  [${String(i).padStart(2)}] t=${String(t).padStart(4)}s` +
      `  score=${bestScore.toFixed(2)}` +
      `  "${line.slice(0, 50)}"`
    )
  }

  return timestamps
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const songId = parseInt(process.argv[2] ?? '', 10)
  if (isNaN(songId)) {
    console.error('Usage: node scripts/generate-timestamps.mjs <songId>')
    console.error('Example: node scripts/generate-timestamps.mjs 2')
    process.exit(1)
  }

  const apiKey = readApiKey()
  if (!apiKey) {
    console.error('OPENAI_API_KEY not found. Add it to .env.local:\n  OPENAI_API_KEY=sk-...')
    process.exit(1)
  }

  const mp3Path = join(ROOT, 'public', 'karaoke', String(songId).padStart(2, '0') + '.mp3')
  const lines   = extractLyrics(songId)

  console.log(`Song ${songId}: ${lines.length} lyrics lines`)
  console.log(`Audio:  ${mp3Path}`)
  console.log('Sending to Whisper API (this may take 10–30 seconds)...\n')

  const data     = await transcribe(mp3Path, apiKey)
  const segments = data.segments ?? []
  console.log(`Whisper returned ${segments.length} segments\n`)

  if (!segments.length) {
    console.error('No segments in Whisper response. Check the audio file.')
    process.exit(1)
  }

  const timestamps = matchSegmentsToLines(lines, segments)

  console.log('\n// ── Paste into LYRICS_TIMESTAMPS in KaraokeSection.tsx ─────────────────')
  console.log(`  ${songId}: [${timestamps.join(', ')}],`)
  console.log('// ────────────────────────────────────────────────────────────────────────')
}

main().catch(e => { console.error('\nError:', e.message); process.exit(1) })
