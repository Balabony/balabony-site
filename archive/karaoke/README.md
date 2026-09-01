# Karaoke (archived)

**Archived on:** 2026-05-10
**Reason:** Synchronization between minus tracks and lyrics text was not working reliably.

**Audio and tooling removed on:** 2026-09-01
See "To restore" below — nothing is lost, everything is recoverable from git.

## What is here
- `KaraokeSection.tsx` — the original UI component

## What was removed on 2026-09-01
- `public/karaoke/` — 18 minus tracks, 119 MB. They were shipped in every Vercel
  deployment while nothing on the live site linked to them.
- `scripts/generate-timestamps.mjs` and `scripts/generate-all-timestamps.mjs` —
  the Whisper-based lyric timing tools. They read `app/components/KaraokeSection.tsx`,
  which stopped existing on 2026-05-10 when the section was archived, so both
  scripts had already been broken for four months.

## What was missing / broken
- Audio-text sync: lyrics did not follow the playback position correctly
- No backend / API endpoints (it was front-only)
- Timing generation depended on OpenAI Whisper and on yt-dlp downloading a
  reference vocal track per song

## To restore

The last commit that still contains the audio and the scripts is **c0821c3**.

```
git checkout c0821c3 -- public/karaoke
git checkout c0821c3 -- scripts/generate-timestamps.mjs scripts/generate-all-timestamps.mjs
```

Then:

1. Copy `KaraokeSection.tsx` back to `app/components/`
2. Add import to `app/page.tsx`: `import KaraokeSection from './components/KaraokeSection'`
3. Add `<KaraokeSection />` somewhere in JSX
4. **First fix the sync logic** — probably needs a different audio library
   (e.g. howler.js with timed cues) or a JSON timing file per track
5. Before restoring 119 MB into `public/`, consider hosting the tracks in
   Supabase Storage instead. Static files in `public/` are re-uploaded on every
   single deployment; Supabase serves them once from its own CDN.

## To remove permanently
Just delete this folder. Git history retains everything.
