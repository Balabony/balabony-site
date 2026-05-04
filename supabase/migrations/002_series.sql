CREATE TABLE IF NOT EXISTS series (
  id          TEXT PRIMARY KEY,
  number      INTEGER NOT NULL,
  season      INTEGER NOT NULL DEFAULT 1,
  title       TEXT    NOT NULL,
  cover_url   TEXT,
  has_audio   BOOLEAN NOT NULL DEFAULT false,
  url         TEXT    NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE series DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_series_season_number ON series(season ASC, number ASC);
