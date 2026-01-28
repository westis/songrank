"use client";

import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";

interface PlaybackControlsProps {
  compact?: boolean;
}

export default function PlaybackControls({ compact = false }: PlaybackControlsProps) {
  const { isConnected } = useSpotifyAuth();
  const {
    isReady,
    isPremium,
    currentTrack,
    position,
    duration,
    isPlaying,
    volume,
    error,
    togglePlay,
    seek,
    setVolume,
  } = useSpotifyPlayer();

  // Format time as mm:ss
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress percentage
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  // Handle seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newPosition = Math.floor(percent * duration);
    seek(newPosition);
  };

  // Not connected
  if (!isConnected) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised p-3 text-center text-sm text-foreground-muted">
        Connect Spotify in Settings to enable playback
      </div>
    );
  }

  // Premium required
  if (isPremium === false) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised p-3 text-center text-sm text-foreground-muted">
        Spotify Premium required for playback
      </div>
    );
  }

  // Loading/connecting
  if (!isReady) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised p-3 text-center text-sm text-foreground-muted">
        {error || "Connecting to Spotify..."}
      </div>
    );
  }

  // Compact mode (just play/pause)
  if (compact) {
    return (
      <button
        onClick={togglePlay}
        disabled={!currentTrack}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
    );
  }

  // Full controls
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {/* Track info */}
      {currentTrack ? (
        <div className="mb-3 flex items-center gap-3">
          {currentTrack.albumArtUrl && (
            <img
              src={currentTrack.albumArtUrl}
              alt={currentTrack.album}
              className="h-12 w-12 rounded object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{currentTrack.name}</p>
            <p className="truncate text-xs text-foreground-muted">
              {currentTrack.artist}
            </p>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-sm text-foreground-muted">No track playing</p>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="w-10 text-right text-xs text-foreground-muted">
          {formatTime(position)}
        </span>
        <div
          className="relative h-2 flex-1 cursor-pointer rounded-full bg-surface-raised"
          onClick={handleSeek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#1DB954]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-10 text-xs text-foreground-muted">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          onClick={togglePlay}
          disabled={!currentTrack}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Volume */}
      <div className="mt-3 flex items-center gap-2">
        <VolumeIcon className="h-4 w-4 text-foreground-muted" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="h-1 flex-1 appearance-none rounded-full bg-surface-raised accent-[#1DB954]"
        />
      </div>
    </div>
  );
}

function PlayIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function VolumeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
    </svg>
  );
}
