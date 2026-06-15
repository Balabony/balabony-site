-- Migration: 20260615_004_referral_bonuses_season
-- Purpose: Support series referral bonuses (+1 free series per shared episode,
--   per season). Adds a season column to referral_bonuses.
--     season IS NULL  -> story bonus (counts toward the 7+ story limit)
--     season = N       -> series bonus for that season (counts toward the
--                         2-per-season free limit, capped per season in code)
--   UNIQUE(user_id, story_id) still guards one reward per unique shared item
--   (for series, story_id = "episodes/<slug>").
--
-- Safe to run repeatedly: ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.referral_bonuses
  ADD COLUMN IF NOT EXISTS season INTEGER NULL;

COMMENT ON COLUMN public.referral_bonuses.season IS 'NULL = story bonus; N = series bonus for season N (per-season free limit).';
