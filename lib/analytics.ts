export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('bly_sid')
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('bly_sid', id) }
  return id
}

export function trackStoryEvent(
  storyId: string,
  storyTitle: string,
  eventType: 'open' | 'read' | 'share' | 'review',
  durationSeconds?: number
) {
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'story_event',
        story_id: storyId,
        story_title: storyTitle,
        event_type: eventType,
        duration_seconds: durationSeconds ?? null,
        session_id: getSessionId(),
      }),
    }).catch(() => {})
  } catch { /* never break the page */ }
}
