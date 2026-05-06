# Architecture Decision Records

---

## ADR-001: Content Model — Series vs Stories vs Audio

**Date:** 2026-05-06  
**Status:** Decided

---

### Context

Investigation triggered by 404 on `/episodes/s3e04` after publishing a new series via admin UI.

---

### Found Facts

#### Routing
- `app/episodes/` directory does **not exist** — no Next.js page handles `/episodes/[slug]`
- `app/stories/[id]/page.tsx` exists and handles `/stories/[id]` (user-submitted stories)
- All episode URLs are stored in `series.url` column (e.g. `/episodes/s3e04`) but no page renders them

#### Database — `series` table
Columns: `id, number, season, title, cover_url, has_audio, url, description, created_at`

- No `audio_url` column
- No FK to `stories`
- Two conflicting ID formats coexist in production:
  - New format (admin UI): `s3e04`, `s3e03`, `s3e05` — zero-padded episode number
  - Legacy format (seed script): `s3-ep45`, `s3-ep46`, `s3-ep47` — dash-separated
- All URLs consumed from DB field (no client-side URL construction), so DB is the single source of truth

#### Database — `stories` table
Columns: `id, author_name, title, genre, text, cover_url, status, ai_report, ai_score, admin_notes, created_at, approved_at, corrected_text, changes, published_version, humanized_text, humanize_summary, duration_minutes, category, audio_url, audio_status`

- Has `audio_url` and `audio_status` columns
- `audio_url` is `null` in all sampled rows (10/10); `audio_status: "pending"` everywhere
- No `series_id`, no `order_in_series` — **no FK linking stories to series**

#### Relationship between `series` and `stories`
- None. They are completely separate entities with no database relationship.
- `series` = Balabony editorial audio episodes (Grandpa Panas universe)
- `stories` = user-submitted authored stories (separate feature)

#### URL usage in codebase (`/episodes/`)
| File | Role |
|------|------|
| `app/api/admin/series/route.ts:20` | Generates URL on series creation |
| `scripts/seed-series.mjs` | Hardcodes legacy `s3-ep47` format |
| `app/components/SeriesStrip.tsx` | Renders links + share buttons from `s.url` |
| `app/components/FreshStoriesGrid.tsx` | Renders links + share buttons from `story.url` |
| `app/page.tsx` | Passes `s.url` as prop |

---

### Open Questions

1. **What is a "series" exactly?**  
   Is it a single audio episode (one file, one page), or a container for multiple `stories`?

2. **Where does the audio file for a series live?**  
   `series` has no `audio_url`. Is it stored in Supabase Storage under a predictable key? External CDN? Not yet implemented?

3. **Should `series` and `stories` be linked?**  
   If a series episode = a collection of user stories read aloud, a `series_id` FK on `stories` (+ `order_in_series`) would be needed. If they are fully independent, the audio must live directly on `series`.

4. **Slug format canon:**  
   Should `s3e04` (zero-padded, new) be the official format going forward? The 3 legacy records (`s3-ep45/46/47`) need either a DB migration or permanent redirects.

5. **Missing-zero redirect:**  
   `/episodes/s3e4` (no leading zero) is reachable from external links or user typing. Needs middleware redirect → `/episodes/s3e04`.

6. **Caching strategy for `/episodes/[slug]`:**  
   `revalidate = 3600` + `revalidatePath()` on publish vs `force-dynamic`. Not decided.

---

---

### Decisions Made

| # | Question | Decision |
|---|----------|----------|
| 1 | What is a "series"? | A single audio episode (one file, one page). Not a container for stories. |
| 2 | Where does audio live? | Will be stored in `audio_url` on the unified `content` table. Not yet populated. |
| 3 | Should series and stories be linked? | No FK. They are separate `type` values (`episode` vs `story`) in one `content` table. |
| 4 | Slug format canon | `s3e04` (zero-padded). Legacy `s3-ep45/46/47` normalised on migration via regex. |
| 5 | Missing-zero redirect | Middleware redirect `/episodes/s3e4` → `/episodes/s3e04` — deferred. |
| 6 | Caching strategy | Deferred until page exists. |

**Routing:** Unified route `/read/[slug]` for all content types.  
Old routes redirect: `/episodes/*` → `/read/*` and `/stories/*` → `/read/*`.

**Schema:** Single `content` table with `type ENUM('episode', 'story')`.  
`series_name` column (not type) carries the brand name "Балабони".

**Migration files:**
- `supabase/migrations/20260506_001_content_table.sql` — DDL
- `supabase/migrations/20260506_002_migrate_data.sql` — data migration + integrity check
