// Spotify Web API client

import type {
  SpotifyArtistSearchResponse,
  SpotifyAlbumsResponse,
  SpotifyTracksResponse,
  SpotifyTrack,
  SpotifyUser,
  SpotifyError,
} from "./types";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

interface FetchOptions {
  token: string;
  retryOnUnauthorized?: boolean;
  onTokenRefresh?: () => Promise<string | null>;
}

/**
 * Make an authenticated request to Spotify API
 */
async function spotifyFetch<T>(
  endpoint: string,
  options: FetchOptions
): Promise<T> {
  const { token, retryOnUnauthorized = true, onTokenRefresh } = options;

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return spotifyFetch(endpoint, options);
  }

  // Handle token expiration
  if (response.status === 401 && retryOnUnauthorized && onTokenRefresh) {
    const newToken = await onTokenRefresh();
    if (newToken) {
      return spotifyFetch(endpoint, {
        ...options,
        token: newToken,
        retryOnUnauthorized: false,
      });
    }
  }

  if (!response.ok) {
    const error = (await response.json()) as SpotifyError;
    throw new Error(error.error?.message || `Spotify API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Search for artists by name
 */
export async function searchArtists(
  query: string,
  token: string,
  limit = 5,
  onTokenRefresh?: () => Promise<string | null>
): Promise<SpotifyArtistSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    type: "artist",
    limit: String(limit),
  });

  return spotifyFetch<SpotifyArtistSearchResponse>(
    `/search?${params.toString()}`,
    { token, onTokenRefresh }
  );
}

/**
 * Get albums for an artist
 */
export async function getArtistAlbums(
  artistId: string,
  token: string,
  options?: {
    includeGroups?: ("album" | "single" | "compilation")[];
    limit?: number;
    offset?: number;
    onTokenRefresh?: () => Promise<string | null>;
  }
): Promise<SpotifyAlbumsResponse> {
  const {
    includeGroups = ["album", "compilation"],
    limit = 50,
    offset = 0,
    onTokenRefresh,
  } = options || {};

  const params = new URLSearchParams({
    include_groups: includeGroups.join(","),
    limit: String(limit),
    offset: String(offset),
    market: "from_token",
  });

  return spotifyFetch<SpotifyAlbumsResponse>(
    `/artists/${artistId}/albums?${params.toString()}`,
    { token, onTokenRefresh }
  );
}

/**
 * Get all albums for an artist (handles pagination)
 */
export async function getAllArtistAlbums(
  artistId: string,
  token: string,
  options?: {
    includeGroups?: ("album" | "single" | "compilation")[];
    onTokenRefresh?: () => Promise<string | null>;
  }
): Promise<SpotifyAlbumsResponse["items"]> {
  const { includeGroups = ["album", "compilation"], onTokenRefresh } =
    options || {};

  const albums: SpotifyAlbumsResponse["items"] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await getArtistAlbums(artistId, token, {
      includeGroups,
      limit,
      offset,
      onTokenRefresh,
    });

    albums.push(...response.items);

    if (!response.next || albums.length >= response.total) {
      break;
    }

    offset += limit;
  }

  return albums;
}

/**
 * Get tracks for an album
 */
export async function getAlbumTracks(
  albumId: string,
  token: string,
  options?: {
    limit?: number;
    offset?: number;
    onTokenRefresh?: () => Promise<string | null>;
  }
): Promise<SpotifyTracksResponse> {
  const { limit = 50, offset = 0, onTokenRefresh } = options || {};

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    market: "from_token",
  });

  return spotifyFetch<SpotifyTracksResponse>(
    `/albums/${albumId}/tracks?${params.toString()}`,
    { token, onTokenRefresh }
  );
}

/**
 * Get full track details (includes ISRC)
 */
export async function getTracks(
  trackIds: string[],
  token: string,
  onTokenRefresh?: () => Promise<string | null>
): Promise<SpotifyTrack[]> {
  // Spotify allows max 50 tracks per request
  const chunks: string[][] = [];
  for (let i = 0; i < trackIds.length; i += 50) {
    chunks.push(trackIds.slice(i, i + 50));
  }

  const results: SpotifyTrack[] = [];
  for (const chunk of chunks) {
    const params = new URLSearchParams({
      ids: chunk.join(","),
      market: "from_token",
    });

    const response = await spotifyFetch<{ tracks: SpotifyTrack[] }>(
      `/tracks?${params.toString()}`,
      { token, onTokenRefresh }
    );

    results.push(...response.tracks);
  }

  return results;
}

/**
 * Get current user's Spotify profile
 */
export async function getCurrentUser(
  token: string,
  onTokenRefresh?: () => Promise<string | null>
): Promise<SpotifyUser> {
  return spotifyFetch<SpotifyUser>("/me", { token, onTokenRefresh });
}
