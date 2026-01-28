// Spotify API type definitions

export interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres: string[];
  popularity: number;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: "album" | "single" | "compilation";
  total_tracks: number;
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  images: SpotifyImage[];
  artists: Pick<SpotifyArtist, "id" | "name">[];
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  album: SpotifyAlbum;
  artists: Pick<SpotifyArtist, "id" | "name">[];
  duration_ms: number;
  track_number: number;
  disc_number: number;
  preview_url: string | null;
  uri: string;
  external_ids: {
    isrc?: string;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface SpotifyArtistSearchResponse {
  artists: SpotifySearchResult<SpotifyArtist>;
}

export interface SpotifyAlbumSearchResponse {
  albums: SpotifySearchResult<SpotifyAlbum>;
}

export interface SpotifyAlbumsResponse {
  items: SpotifyAlbum[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

export interface SpotifyTracksResponse {
  items: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

export interface SpotifyRefreshResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string; // May or may not be returned on refresh
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: SpotifyImage[];
  product: "free" | "open" | "premium";
  country: string;
}

export interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}

// Database token record
export interface SpotifyTokenRecord {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string | null;
  created_at: string;
  updated_at: string;
}
