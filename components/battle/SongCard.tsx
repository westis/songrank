"use client";

import Image from "next/image";
import type { Song } from "@/lib/types";

interface SongCardProps {
  song: Song;
  onSelect: () => void;
  disabled?: boolean;
  selected?: boolean;
  onPlay?: (song: Song) => void;
  isPlaying?: boolean;
}

function getSpotifySearchUrl(song: Song): string {
  return `https://open.spotify.com/search/${encodeURIComponent(
    song.title + " " + song.artist
  )}`;
}

export default function SongCard({
  song,
  onSelect,
  disabled,
  selected,
  onPlay,
  isPlaying,
}: SongCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`group w-full rounded-xl border px-4 py-3 text-left transition-all sm:px-5 sm:py-4 ${
        selected
          ? "border-accent bg-accent-subtle ring-2 ring-accent/30"
          : "border-border bg-surface hover:border-accent/40 hover:bg-surface-raised"
      } ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
    >
      <div className="flex items-center gap-4">
        {/* Album art — only show if we actually have artwork */}
        {song.album_artwork_url && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg sm:h-16 sm:w-16">
            <Image
              src={song.album_artwork_url}
              alt={song.album || song.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        )}

        {/* Song info */}
        <div className="min-w-0 flex-1">
          <h3
            className={`truncate text-lg font-bold leading-tight sm:text-xl ${
              selected ? "text-accent" : "group-hover:text-accent"
            }`}
          >
            {song.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-foreground-muted">
            {song.album || song.artist}
            {song.year ? ` \u00b7 ${song.year}` : ""}
          </p>
        </div>

        {/* Play button (if playback available) */}
        {onPlay && song.spotify_uri && !song.spotify_uri.startsWith("manual:") && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(song);
            }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              isPlaying
                ? "bg-[#1DB954] text-white"
                : "bg-surface-raised text-foreground-muted hover:bg-[#1DB954] hover:text-white"
            }`}
            aria-label={isPlaying ? "Now playing" : "Play song"}
          >
            {isPlaying ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}

        {/* Spotify link (fallback when no playback or manual song) */}
        {(!onPlay || !song.spotify_uri || song.spotify_uri.startsWith("manual:")) && (
          <a
            href={getSpotifySearchUrl(song)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-foreground-subtle transition-colors hover:text-[#1DB954]"
            aria-label="Search on Spotify"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </a>
        )}
      </div>
    </button>
  );
}
