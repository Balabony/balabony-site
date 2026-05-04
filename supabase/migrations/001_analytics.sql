-- Analytics tables for Balabony platform

CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  session_id text,
  age text,
  gender text,
  location text,
  device text,
  reading_time text,
  frequency text,
  format text,
  audio text,
  duration text,
  genres jsonb DEFAULT '[]',
  genre_other text,
  plan text,
  source text,
  attraction text,
  missing text,
  budget text,
  sharing text,
  recommend text
);

CREATE TABLE IF NOT EXISTS page_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  device text,
  country text,
  session_id text
);

CREATE TABLE IF NOT EXISTS story_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id text,
  story_title text,
  event_type text CHECK (event_type IN ('open', 'read', 'share', 'review')),
  duration_seconds integer,
  session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  session_id text PRIMARY KEY,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  visits_today integer DEFAULT 1,
  device text,
  city text
);

-- Disable RLS (service role key bypasses it anyway)
ALTER TABLE survey_responses  DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_views        DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_events      DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions     DISABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp   ON page_views   (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session      ON page_views   (session_id);
CREATE INDEX IF NOT EXISTS idx_story_events_type       ON story_events (event_type);
CREATE INDEX IF NOT EXISTS idx_story_events_story      ON story_events (story_id);
CREATE INDEX IF NOT EXISTS idx_survey_created          ON survey_responses (created_at DESC);
