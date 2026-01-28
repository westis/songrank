// ---- Enums / union types ----

export type SessionType =
  | "album"
  | "division"
  | "smart_ai"
  | "cross_album"
  | "manual";

export type SessionStatus = "active" | "paused" | "completed";

export type Confidence = "coin_flip" | "slight" | "clear" | "obvious";

export type ListenMode = "instant" | "quick_sample" | "full_listen";

export type Algorithm = "elo" | "whr";

// ---- Database row types ----

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  confidence_levels: number; // 1-4, default 1
  created_at: string;
  updated_at: string;
}

export interface ProjectCollaborator {
  project_id: string;
  user_id: string;
  role: "owner" | "collaborator";
  joined_at: string;
}

export interface Song {
  id: string;
  project_id: string;
  title: string;
  artist: string;
  album: string | null;
  album_id: string | null;
  year: number | null;
  era: string | null;
  duration_ms: number | null;
  spotify_uri: string;
  spotify_id: string;
  spotify_preview_url: string | null;
  isrc: string | null;
  track_number: number | null;
  disc_number: number | null;
  album_artwork_url: string | null;
  custom_tags: string[] | null;
  created_at: string;
}

export interface BattleSession {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  session_type: SessionType;
  config: Record<string, unknown> | null;
  status: SessionStatus;
  battles_completed: number;
  battles_total: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface Battle {
  id: string;
  project_id: string;
  session_id: string | null;
  user_id: string;
  song_a_id: string;
  song_b_id: string;
  winner_id: string | null; // null = draw
  confidence: Confidence | null;
  listen_mode: ListenMode | null;
  time_spent_seconds: number | null;
  created_at: string;
}

export interface Rating {
  id: string;
  project_id: string;
  song_id: string;
  user_id: string;
  rating: number;
  rd: number;
  battle_count: number;
  algorithm: Algorithm;
  last_battle_at: string | null;
  computed_at: string;
}

export interface WHRCalculation {
  id: string;
  project_id: string;
  user_id: string;
  battles_processed: number;
  songs_updated: number;
  calculation_time_ms: number | null;
  triggered_by: "auto" | "manual" | "session_complete";
  created_at: string;
}

// ---- Composite / view types ----

export interface SongWithRating extends Song {
  rating: number;
  rd: number;
  battle_count: number;
  algorithm: Algorithm;
  last_battle_at: string | null;
}

export interface BattlePair {
  songA: Song;
  songB: Song;
}

export interface BattleScope {
  type: "all" | "album" | "cross_album";
  album?: string;
  albumA?: string;
  albumB?: string;
  topN?: number;
}

export interface BattleWithSongs extends Battle {
  song_a: Song;
  song_b: Song;
}
