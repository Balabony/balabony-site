export type ContentType = 'story' | 'balabony';

export interface BalabonyEpisode {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  cover_url: string | null;
  season_number: number;
  episode_number: number;
  duration_minutes: number | null;
  is_free: boolean;
  views_count: number;
  created_at: string;
  published_at: string | null;
}

export interface BalabonyArchivePreview {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  season_number: number;
  episode_number: number;
}

export interface BalabonyHomeData {
  newest: BalabonyEpisode;
  freeEpisode: BalabonyEpisode | null;
  archivePreviews: BalabonyArchivePreview[];
  totalCount: number;
}