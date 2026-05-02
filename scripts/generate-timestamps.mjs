#!/usr/bin/env node
/**
 * Generate LYRICS_TIMESTAMPS for a karaoke song.
 *
 * Usage:
 *   node scripts/generate-timestamps.mjs <songId>
 *   node scripts/generate-timestamps.mjs 2
 *
 * Steps:
 *   1. Reads song title + lyrics from KaraokeSection.tsx
 *   2. Searches YouTube and downloads a vocal version via yt-dlp
 *   3. Transcribes with OpenAI Whisper (segment timestamps, language=uk)
 *   4. Matches segments → lyrics lines by word overlap
 *   5. Prints a LYRICS_TIMESTAMPS entry ready to paste
 *
 * Requires OPENAI_API_KEY in .env.local or environment.
 * No ffmpeg needed — downloads native audio (webm/m4a), Whisper accepts both.
 */

import { readFileSync, unlinkSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { tmpdir } from 'os'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT = join(__dirname, '..')

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

export function readApiKey() {
  try {
    const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of env.split('\n')) {
      const eq = line.indexOf('=')
      if (eq < 0) continue
      if (line.slice(0, eq).trim() === 'OPENAI_API_KEY')
        return line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    }
  } catch {}
  return process.env.OPENAI_API_KEY ?? ''
}

// ---------------------------------------------------------------------------
// KaraokeSection.tsx parsing
// ---------------------------------------------------------------------------

export function extractSongInfo(songId) {
  const src = readFileSync(join(ROOT, 'app/components/KaraokeSection.tsx'), 'utf8')

  const idPos = src.indexOf(`  id: ${songId},`)
  if (idPos === -1) throw new Error(`Song id ${songId} not found in SONGS array`)

  const titleMatch = src.slice(idPos, idPos + 300).match(/title: '([^']+)'/)
  if (!titleMatch) throw new Error(`Title not found for song ${songId}`)
  const title = titleMatch[1]

  const lyricsMarker = 'lyrics:\n`'
  const lyricsPos = src.indexOf(lyricsMarker, idPos)
  if (lyricsPos === -1) throw new Error(`Lyrics block not found for song ${songId}`)
  const start = lyricsPos + lyricsMarker.length
  const end   = src.indexOf('`,', start)
  if (end === -1) throw new Error('Lyrics closing backtick not found')
  const lines = src.slice(start, end).split('\n')

  return { title, lines }
}

// ---------------------------------------------------------------------------
// yt-dlp download
// ---------------------------------------------------------------------------

function ytdlpCmd() {
  // Prefer system yt-dlp; fall back to python -m yt_dlp (always works after pip install)
  const probe = spawnSync('yt-dlp', ['--version'], { encoding: 'utf8' })
  if (probe.status === 0) return ['yt-dlp']
  return ['python', ['-m', 'yt_dlp']]
}

export function downloadVocal(title, artist, outDir, songId) {
  const query    = `${title} ${artist} українська пісня`
  const outTpl   = join(outDir, `vocal-${songId}.%(ext)s`)

  // cmd is either ['yt-dlp'] or ['python', ['-m', 'yt_dlp']]
  const [bin, baseArgs = []] = ytdlpCmd()
  const args = [
    ...baseArgs,
    '--format', 'bestaudio',
    '--no-playlist',
    '--match-filter', 'duration < 600',   // max 10 min to avoid huge files
    '-o', outTpl,
    '--print', 'after_move:filepath',     // print final path to stdout
    `ytsearch1:${query}`,
  ]

  console.log(`  yt-dlp query: "${query}"`)
  const result = spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })

  if (result.status !== 0) {
    throw new Error(`yt-dlp failed:\n${result.stderr}`)
  }

  // --print after_move:filepath outputs the path as the last non-empty line
  const downloadedPath = result.stdout.trim().split('\n').filter(Boolean).pop()
  if (!downloadedPath || !existsSync(downloadedPath)) {
    // Fallback: glob the outDir for matching files
    const found = readdirSync(outDir).find(f => f.startsWith(`vocal-${songId}.`))
    if (!found) throw new Error('yt-dlp did not produce an output file')
    return join(outDir, found)
  }
  return downloadedPath
}

// ---------------------------------------------------------------------------
// Whisper transcription
// ---------------------------------------------------------------------------

export async function transcribe(filePath, apiKey) {
  const ext      = filePath.split('.').pop()
  const mimeMap  = { mp3: 'audio/mpeg', m4a: 'audio/mp4', webm: 'audio/webm',
                     ogg: 'audio/ogg', wav: 'audio/wav', opus: 'audio/ogg' }
  const mime     = mimeMap[ext] ?? 'audio/webm'
  const filename = filePath.split(/[\\/]/).pop()

  const audioData = readFileSync(filePath)
  const form = new FormData()
  form.append('file', new Blob([audioData], { type: mime }), filename)
  form.append('model', 'whisper-1')
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'segment')
  form.append('language', 'uk')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body:    form,
  })
  if (!res.ok) throw new Error(`Whisper API ${res.status}: ${await res.text()}`)
  return res.json()
}

// ---------------------------------------------------------------------------
// Segment → line matching
// ---------------------------------------------------------------------------

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[''`"«»—–\-]/g, ' ')
    .replace(/[^а-яёіїєґa-z0-9\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function wordOverlap(line, segText) {
  const lineWords = new Set(normalize(line).split(' ').filter(Boolean))
  if (!lineWords.size) return 0
  const hits = normalize(segText).split(' ').filter(w => lineWords.has(w)).length
  return hits / lineWords.size
}

export function matchSegmentsToLines(lines, segments) {
  const timestamps = []
  let cursor = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line) {
      const prev = timestamps.at(-1) ?? 0
      timestamps.push(prev + 2)
      console.log(`  [${String(i).padStart(2)}] t=${String(prev + 2).padStart(4)}s  (empty)`)
      continue
    }

    let bestScore = 0, bestIdx = cursor
    for (let j = cursor; j < Math.min(segments.length, cursor + 15); j++) {
      const score = wordOverlap(line, segments[j].text)
      if (score > bestScore) { bestScore = score; bestIdx = j }
    }

    const seg = segments[bestIdx] ?? segments.at(-1)
    const t   = Math.round(seg?.start ?? i * 8)
    timestamps.push(t)
    if (bestScore > 0) cursor = bestIdx + 1

    console.log(
      `  [${String(i).padStart(2)}] t=${String(t).padStart(4)}s` +
      `  score=${bestScore.toFixed(2)}` +
      `  "${line.slice(0, 48)}"`
    )
  }
  return timestamps
}

// ---------------------------------------------------------------------------
// Main exported function (used by generate-all-timestamps.mjs too)
// ---------------------------------------------------------------------------

export async function processOneSong(songId, apiKey) {
  const { title, lines } = extractSongInfo(songId)
  // Extract artist too for a better search query
  const src         = readFileSync(join(ROOT, 'app/components/KaraokeSection.tsx'), 'utf8')
  const idPos       = src.indexOf(`  id: ${songId},`)
  const artistMatch = src.slice(idPos, idPos + 400).match(/artist: '([^']+)'/)
  const artist      = artistMatch?.[1] ?? ''

  console.log(`\n── Song ${songId}: "${title}" (${lines.length} lines) ──`)

  const outDir = tmpdir()
  let vocalPath

  try {
    console.log('Downloading vocal version...')
    vocalPath = downloadVocal(title, artist, outDir, songId)
    console.log(`Downloaded: ${vocalPath}`)
  } catch (e) {
    throw new Error(`Download failed: ${e.message}`)
  }

  let data
  try {
    console.log('Transcribing with Whisper...')
    data = await transcribe(vocalPath, apiKey)
  } finally {
    if (vocalPath && existsSync(vocalPath)) unlinkSync(vocalPath)
  }

  const segments = data.segments ?? []
  console.log(`Whisper: ${segments.length} segments`)
  if (!segments.length) throw new Error('Whisper returned no segments')

  console.log('Matching segments to lines:')
  const timestamps = matchSegmentsToLines(lines, segments)
  return { songId, title, timestamps }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const songId = parseInt(process.argv[2] ?? '', 10)
  if (isNaN(songId)) {
    console.error('Usage: node scripts/generate-timestamps.mjs <songId>')
    process.exit(1)
  }

  const apiKey = readApiKey()
  if (!apiKey) {
    console.error('OPENAI_API_KEY not found. Add it to .env.local:\n  OPENAI_API_KEY=sk-...')
    process.exit(1)
  }

  processOneSong(songId, apiKey)
    .then(({ songId, timestamps }) => {
      console.log('\n// ── Paste into LYRICS_TIMESTAMPS in KaraokeSection.tsx ──────────────')
      console.log(`  ${songId}: [${timestamps.join(', ')}],`)
      console.log('// ─────────────────────────────────────────────────────────────────────')
    })
    .catch(e => { console.error('\nError:', e.message); process.exit(1) })
}
