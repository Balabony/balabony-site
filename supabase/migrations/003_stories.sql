CREATE TABLE IF NOT EXISTS stories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name     TEXT NOT NULL,
  title           TEXT NOT NULL,
  genre           TEXT NOT NULL,
  text            TEXT NOT NULL,
  cover_url       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  ai_report       JSONB,
  ai_score        TEXT,
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at     TIMESTAMPTZ
);

ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stories_status  ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_approved ON stories(approved_at DESC) WHERE status = 'approved';
