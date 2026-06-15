-- Migration: 20260615_003_referral_bonuses
-- Purpose: Earned free-story bonuses for sharing (referral growth loop).
--   Reward rule: +1 free story per UNIQUE story shared, capped in code at 5
--   (MAX_REFERRAL_BONUS in /api/pick and /api/referral/share).
--
--   Written by /api/referral/share when a user shares a story.
--   Read by /api/pick: effective free-story limit = 7 + count(referral_bonuses).
--
--   UNIQUE(user_id, story_id) is the anti-abuse guard — re-sharing the same
--   story grants nothing extra. user_id = anonymous balabony_uid cookie.
--
-- Safe to run even if the table was already created manually: IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS public.referral_bonuses (
  id         BIGSERIAL    PRIMARY KEY,
  user_id    UUID         NOT NULL,
  story_id   TEXT         NOT NULL,
  channel    TEXT         NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT referral_bonuses_unique UNIQUE (user_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_bonuses_user
  ON public.referral_bonuses (user_id);

-- RLS: writes/reads happen via service_role from API routes (getSupabaseAdmin),
-- which bypasses RLS. Enable RLS as defence-in-depth (no policies = block anon/auth keys).
ALTER TABLE public.referral_bonuses ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.referral_bonuses IS 'Earned free-story bonuses for sharing. UNIQUE(user_id, story_id) = one reward per shared story. user_id = balabony_uid.';
