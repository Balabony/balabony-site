-- Migration: 20260527_001_user_free_picks
-- Purpose: Track anonymous user picks for free content (series + stories)
-- Rules:
--   - series: up to 2 picks per season (4 seasons × 2 = 8 max)
--   - story: up to 7 picks across all stories
--   - user_id is anonymous UUID stored in HttpOnly cookie (1 year)

CREATE TABLE IF NOT EXISTS public.user_free_picks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('series', 'story')),
  season INTEGER NULL,
  content_id INTEGER NOT NULL,
  picked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- A user can pick the same content only once (idempotent INSERT)
  CONSTRAINT user_free_picks_unique_pick UNIQUE (user_id, content_type, content_id),
  
  -- season is required for series, must be NULL for stories
  CONSTRAINT user_free_picks_season_check CHECK (
    (content_type = 'series' AND season IS NOT NULL AND season BETWEEN 1 AND 4)
    OR
    (content_type = 'story' AND season IS NULL)
  )
);

-- Fast lookup: "how many series picks does user X have in season Y?"
CREATE INDEX IF NOT EXISTS idx_user_free_picks_series_lookup
  ON public.user_free_picks (user_id, content_type, season)
  WHERE content_type = 'series';

-- Fast lookup: "how many story picks does user X have total?"
CREATE INDEX IF NOT EXISTS idx_user_free_picks_story_lookup
  ON public.user_free_picks (user_id, content_type)
  WHERE content_type = 'story';

-- General lookup by user
CREATE INDEX IF NOT EXISTS idx_user_free_picks_user
  ON public.user_free_picks (user_id);

-- RLS: we use service_role from API routes (getSupabaseAdmin), which bypasses RLS.
-- But enable RLS as defence-in-depth (block anon key access by default).
ALTER TABLE public.user_free_picks ENABLE ROW LEVEL SECURITY;

-- No policies = no access via anon/authenticated keys.
-- All reads/writes happen via /api/pick using service_role.

COMMENT ON TABLE public.user_free_picks IS 'Anonymous user picks for free content. user_id stored in HttpOnly cookie. Series: max 2/season. Stories: max 7 total.';
COMMENT ON COLUMN public.user_free_picks.user_id IS 'Anonymous UUID from HttpOnly cookie, 1-year lifespan';
COMMENT ON COLUMN public.user_free_picks.content_type IS 'series or story';
COMMENT ON COLUMN public.user_free_picks.season IS 'For series: 1-4. For stories: NULL';
COMMENT ON COLUMN public.user_free_picks.content_id IS 'For series: globalEp 1-80. For stories: story.id';
