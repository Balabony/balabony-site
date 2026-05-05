ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS corrected_text    TEXT,
  ADD COLUMN IF NOT EXISTS changes           JSONB,
  ADD COLUMN IF NOT EXISTS published_version TEXT DEFAULT 'original';
