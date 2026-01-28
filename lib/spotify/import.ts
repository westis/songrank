// Spotify track to Song transformation and import utilities

import type { SpotifyTrack, SpotifyAlbum } from "./types";
import type { Song } from "@/lib/types";

/**
 * Convert a Spotify track to a Song record (without id and created_at)
 */
export function spotifyTrackToSong(
  track: SpotifyTrack,
  projectId: string,
  albumOverride?: SpotifyAlbum
): Omit<Song, "id" | "created_at"> {
  const album = albumOverride || track.album;
  const year = album.release_date
    ? parseInt(album.release_date.slice(0, 4), 10)
    : null;

  return {
    project_id: projectId,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    album: album.name,
    album_id: album.id,
    year,
    era: null, // User can set this later
    duration_ms: track.duration_ms,
    spotify_uri: track.uri,
    spotify_id: track.id,
    spotify_preview_url: track.preview_url,
    isrc: track.external_ids?.isrc || null,
    track_number: track.track_number,
    disc_number: track.disc_number,
    album_artwork_url: album.images?.[0]?.url || null,
    custom_tags: null,
  };
}

/**
 * Deduplicate songs by ISRC, keeping the first occurrence
 */
export function deduplicateByISRC<T extends { isrc: string | null }>(
  songs: T[]
): { unique: T[]; duplicates: T[] } {
  const seen = new Set<string>();
  const unique: T[] = [];
  const duplicates: T[] = [];

  for (const song of songs) {
    if (song.isrc) {
      if (seen.has(song.isrc)) {
        duplicates.push(song);
      } else {
        seen.add(song.isrc);
        unique.push(song);
      }
    } else {
      // Songs without ISRC are always included
      unique.push(song);
    }
  }

  return { unique, duplicates };
}

/**
 * Deduplicate songs by Spotify ID (for cases where ISRC isn't available)
 */
export function deduplicateBySpotifyId<T extends { spotify_id: string }>(
  songs: T[]
): T[] {
  const seen = new Set<string>();
  return songs.filter((song) => {
    if (seen.has(song.spotify_id)) {
      return false;
    }
    seen.add(song.spotify_id);
    return true;
  });
}

/**
 * Sort songs by album, then disc number, then track number
 */
export function sortByAlbumOrder<
  T extends { album: string | null; disc_number: number | null; track_number: number | null }
>(songs: T[]): T[] {
  return [...songs].sort((a, b) => {
    // First by album name
    const albumCompare = (a.album || "").localeCompare(b.album || "");
    if (albumCompare !== 0) return albumCompare;

    // Then by disc number
    const discA = a.disc_number || 1;
    const discB = b.disc_number || 1;
    if (discA !== discB) return discA - discB;

    // Then by track number
    const trackA = a.track_number || 0;
    const trackB = b.track_number || 0;
    return trackA - trackB;
  });
}

/**
 * Group songs by album
 */
export function groupByAlbum<T extends { album: string | null }>(
  songs: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const song of songs) {
    const album = song.album || "Unknown Album";
    const existing = grouped.get(album) || [];
    existing.push(song);
    grouped.set(album, existing);
  }

  return grouped;
}
