-- Migration: Create unified content table
-- Replaces separate `series` and `stories` tables with a single `content` table.
-- Route: /read/[slug] for all content types.

CREATE TYPE content_type AS ENUM ('episode', 'story');
CREATE TYPE content_status AS ENUM ('draft', 'humanizing', 'review', 'approved', 'published');
CREATE TYPE audio_status_type AS ENUM ('pending', 'processing', 'ready', 'failed');

CREATE TABLE content (
  -- identity
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,       -- URL slug: s3e04 for episodes, UUID text for stories
  type          content_type NOT NULL,

  -- common fields
  title         TEXT NOT NULL,
  description   TEXT,
  cover_url     TEXT,
  status        content_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ,

  -- episode-only fields (NULL for stories)
  series_name   TEXT,                       -- e.g. 'Балабони'
  season_number INTEGER,
  episode_number INTEGER,

  -- story-only fields (NULL for episodes)
  author_name   TEXT,
  genre         TEXT,
  category      TEXT,
  text          TEXT,
  corrected_text TEXT,
  humanized_text TEXT,
  humanize_summary TEXT,
  changes       JSONB,
  published_version TEXT,
  ai_report     TEXT,
  ai_score      NUMERIC,
  admin_notes   TEXT,
  duration_minutes INTEGER,

  -- audio (shared)
  audio_url     TEXT,
  audio_status  audio_status_type DEFAULT 'pending',

  CONSTRAINT episode_required_fields CHECK (
    type != 'episode' OR (
      series_name IS NOT NULL
      AND season_number IS NOT NULL
      AND episode_number IS NOT NULL
    )
  ),
  CONSTRAINT story_required_fields CHECK (
    type != 'story' OR author_name IS NOT NULL
  )
);

-- Enforce uniqueness of (series_name, season, episode) for episodes only
CREATE UNIQUE INDEX episode_series_unique
  ON content (series_name, season_number, episode_number)
  WHERE type = 'episode';

-- Fast lookup by type
CREATE INDEX content_type_idx ON content (type);
CREATE INDEX content_status_idx ON content (status);
CREATE INDEX content_published_idx ON content (published_at DESC NULLS LAST);
