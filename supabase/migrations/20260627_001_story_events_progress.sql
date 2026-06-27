-- Доходимість читалки Тиші: розширюємо дозволені event_type у story_events.
-- Застосовано в Supabase 27.06.2026. Цей файл — для історії репо.
ALTER TABLE story_events DROP CONSTRAINT IF EXISTS story_events_event_type_check;
ALTER TABLE story_events ADD CONSTRAINT story_events_event_type_check
  CHECK (event_type IN (
    'open','read','share','review',
    'read_start','read_25','read_50','read_75','read_complete','read_next'
  ));
