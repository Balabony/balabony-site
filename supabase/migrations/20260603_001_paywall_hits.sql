-- Migration: 20260603_001_paywall_hits
-- Purpose: Track when an anonymous user hits the free-content limit (paywall).
--   This is the strongest "ready to pay" signal in the funnel.
--   user_id is the same anonymous balabony_uid used by /api/pick and payments,
--   so paywall hits can later be joined to subscriptions to compute conversion:
--   "how many users hit the paywall, and how many of them became subscribers?"
--
-- Written by /api/pick when:
--   - series: user already picked 2 episodes in this season  -> 'season_limit_reached'
--   - story:  user already picked 7 stories total            -> 'stories_limit_reached'

CREATE TABLE IF NOT EXISTS public.paywall_hits (
  id           BIGSERIAL   PRIMARY KEY,
  user_id      UUID        NOT NULL,
  content_type TEXT        NOT NULL CHECK (content_type IN ('series', 'story')),
  season       INTEGER     NULL,
  content_id   INTEGER     NOT NULL,
  limit_type   TEXT        NOT NULL
    CHECK (limit_type IN ('season_limit_reached', 'stories_limit_reached')),
  hit_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookups for the analytics dashboard
CREATE INDEX IF NOT EXISTS idx_paywall_hits_user
  ON public.paywall_hits (user_id);

CREATE INDEX IF NOT EXISTS idx_paywall_hits_hit_at
  ON public.paywall_hits (hit_at DESC);

CREATE INDEX IF NOT EXISTS idx_paywall_hits_limit_type
  ON public.paywall_hits (limit_type);

-- RLS: writes/reads happen via service_role from API routes (getSupabaseAdmin),
-- which bypasses RLS. Enable RLS as defence-in-depth (no policies = block anon/auth keys).
ALTER TABLE public.paywall_hits ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE  public.paywall_hits IS 'Anonymous users hitting the free-content limit. Strongest intent-to-pay signal. user_id = balabony_uid cookie.';
COMMENT ON COLUMN public.paywall_hits.user_id    IS 'Anonymous UUID from balabony_uid cookie (same as user_free_picks / payments)';
COMMENT ON COLUMN public.paywall_hits.limit_type IS 'season_limit_reached (series) or stories_limit_reached (stories)';
