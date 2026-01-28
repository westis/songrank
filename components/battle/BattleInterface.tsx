"use client";

import { useState, useEffect } from "react";
import { useBattle } from "@/hooks/useBattle";
import { useProject } from "@/hooks/useProjects";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import SongCard from "./SongCard";
import ScopeSelector from "./ScopeSelector";
import type { BattleScope, Confidence, Song } from "@/lib/types";

interface BattleInterfaceProps {
  projectId: string;
}

interface LastResult {
  songATitle: string;
  songBTitle: string;
  winnerTitle: string | null; // null = draw
}

interface ConfidenceOption {
  value: Confidence;
  label: string;
  key: string;
}

function getConfidenceOptions(levels: number): ConfidenceOption[] {
  switch (levels) {
    case 2:
      return [
        { value: "obvious", label: "Clear", key: "1" },
        { value: "slight", label: "Slight", key: "2" },
      ];
    case 3:
      return [
        { value: "obvious", label: "Clear", key: "1" },
        { value: "clear", label: "Moderate", key: "2" },
        { value: "slight", label: "Slight", key: "3" },
      ];
    case 4:
      return [
        { value: "obvious", label: "No contest", key: "1" },
        { value: "clear", label: "Clear", key: "2" },
        { value: "slight", label: "Slight", key: "3" },
        { value: "coin_flip", label: "Coin-flip", key: "4" },
      ];
    default:
      return [];
  }
}

export default function BattleInterface({ projectId }: BattleInterfaceProps) {
  const [scope, setScope] = useState<BattleScope>({ type: "all" });
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  // pick is used for confidence levels > 1 (select, then pick confidence)
  const [pick, setPick] = useState<string | "draw" | null>(null);

  const { data: project } = useProject(projectId);
  const confidenceLevels = project?.confidence_levels ?? 1;
  const confidenceOptions = getConfidenceOptions(confidenceLevels);

  // Spotify playback
  const { isConnected: spotifyConnected } = useSpotifyAuth();
  const { play, pause, isPlaying, currentTrack, isReady: playerReady, position, duration } = useSpotifyPlayer();

  const {
    songA,
    songB,
    lastBattleId,
    poolSize,
    totalPairs,
    completedPairs,
    loading,
    selectWinner,
    undoLastBattle,
  } = useBattle(projectId, scope);

  const isPending = selectWinner.isPending || undoLastBattle.isPending;

  const submitBattle = (
    winnerId: string | null,
    confidence: Confidence = "obvious"
  ) => {
    if (isPending || !songA || !songB) return;
    setLastResult({
      songATitle: songA.title,
      songBTitle: songB.title,
      winnerTitle:
        winnerId === null
          ? null
          : winnerId === songA.id
            ? songA.title
            : songB.title,
    });
    setPick(null);
    selectWinner.mutate({ winnerId, confidence });
  };

  const handleCardClick = (songId: string) => {
    if (isPending || !songA || !songB) return;
    if (confidenceLevels === 1) {
      submitBattle(songId);
    } else {
      setPick(pick === songId ? null : songId);
    }
  };

  const handleDrawClick = () => {
    if (isPending) return;
    if (confidenceLevels === 1) {
      submitBattle(null);
    } else {
      setPick(pick === "draw" ? null : "draw");
    }
  };

  const handleConfidenceSelect = (confidence: Confidence) => {
    if (pick === null) return;
    const winnerId = pick === "draw" ? null : pick;
    submitBattle(winnerId, confidence);
  };

  const handleUndo = () => {
    if (!lastBattleId || undoLastBattle.isPending) return;
    setLastResult(null);
    setPick(null);
    undoLastBattle.mutate();
  };

  // Handle song playback
  const handlePlay = (song: Song) => {
    if (!song.spotify_uri || song.spotify_uri.startsWith("manual:")) return;

    // If this song is already playing, pause it
    if (currentTrack?.uri === song.spotify_uri && isPlaying) {
      pause();
    } else {
      // Play the song
      play(song.spotify_uri);
    }
  };

  // Check if a specific song is currently playing
  const isSongPlaying = (song: Song) => {
    return currentTrack?.uri === song.spotify_uri && isPlaying;
  };

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;

      switch (e.key) {
        case "ArrowLeft":
          if (songA && !isPending) handleCardClick(songA.id);
          break;
        case "ArrowRight":
          if (songB && !isPending) handleCardClick(songB.id);
          break;
        case "d":
        case "D":
          if (!isPending) handleDrawClick();
          break;
        case "Escape":
          setPick(null);
          break;
        case "z":
          if (e.ctrlKey && lastBattleId && !undoLastBattle.isPending) {
            handleUndo();
          }
          break;
        // Playback shortcuts
        case "q":
        case "Q":
          if (songA && spotifyConnected && playerReady) {
            e.preventDefault();
            handlePlay(songA);
          }
          break;
        case "e":
        case "E":
          if (songB && spotifyConnected && playerReady) {
            e.preventDefault();
            handlePlay(songB);
          }
          break;
        case " ":
          if (spotifyConnected && playerReady && currentTrack) {
            e.preventDefault();
            if (isPlaying) pause();
            else play(currentTrack.uri);
          }
          break;
        default:
          // Number keys for confidence selection
          if (pick !== null && confidenceOptions.length > 0) {
            const opt = confidenceOptions.find((o) => o.key === e.key);
            if (opt) handleConfidenceSelect(opt.value);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songA, songB, isPending, lastBattleId, pick, confidenceOptions.length, spotifyConnected, playerReady, currentTrack, isPlaying, position, duration]);

  if (loading && !songA) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
        </div>
        <p className="mt-4 text-sm text-foreground-muted">
          Loading battle...
        </p>
      </div>
    );
  }

  if (!songA || !songB) {
    const allDone = totalPairs > 0 && completedPairs >= totalPairs;
    return (
      <div className="space-y-4">
        <ScopeSelector
          projectId={projectId}
          scope={scope}
          onScopeChange={setScope}
        />
        {allDone ? (
          <div className="rounded-xl border border-accent/30 bg-accent-subtle p-12 text-center">
            <p className="text-lg font-semibold text-accent">
              All matchups complete!
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              You&apos;ve battled all {totalPairs} pairs in this scope. Check
              Rankings or pick a different scope.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-12 text-center">
            <p className="text-lg font-semibold">Not enough songs</p>
            <p className="mt-1 text-sm text-foreground-muted">
              {scope.type !== "all"
                ? "Try a different scope or import more songs."
                : "Import at least 2 songs to start battling."}
            </p>
          </div>
        )}
      </div>
    );
  }

  const pct =
    totalPairs > 0 ? Math.round((completedPairs / totalPairs) * 100) : 0;

  const pickLabel =
    pick === "draw"
      ? "Draw"
      : pick === songA.id
        ? songA.title
        : pick === songB.id
          ? songB.title
          : null;

  return (
    <div className="space-y-3">
      {/* Scope selector */}
      <ScopeSelector
        projectId={projectId}
        scope={scope}
        onScopeChange={setScope}
      />

      {/* Progress meter */}
      {totalPairs > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-foreground-subtle">
            <span>
              {poolSize} songs &middot; {totalPairs} matchups
            </span>
            <span>
              {completedPairs} covered ({pct}%)
            </span>
          </div>
          <div className="h-1 rounded-full bg-border">
            <div
              className="h-1 rounded-full bg-accent transition-all"
              style={{
                width: `${Math.min(100, pct)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Undo bar — shows after each battle */}
      {lastBattleId && lastResult && pick === null && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
          <span className="flex-1 text-sm text-foreground-muted">
            {lastResult.winnerTitle ? (
              <>
                Picked{" "}
                <span className="font-medium text-foreground">
                  {lastResult.winnerTitle}
                </span>
              </>
            ) : (
              <span className="font-medium text-foreground">Draw</span>
            )}
          </span>
          <button
            onClick={handleUndo}
            disabled={undoLastBattle.isPending}
            className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {undoLastBattle.isPending ? "Undoing..." : "Undo"}
          </button>
        </div>
      )}

      {/* Confidence selector — shows when a pick is made and levels > 1 */}
      {pick !== null && confidenceLevels >= 2 && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-subtle px-3 py-2.5">
          <span className="text-sm text-foreground-muted">
            {pickLabel}:
          </span>
          <span className="text-xs text-foreground-subtle">How clear?</span>
          <div className="flex gap-1.5">
            {confidenceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleConfidenceSelect(opt.value)}
                disabled={isPending}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setPick(null)}
            className="text-xs text-foreground-subtle hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Which do you prefer? */}
      <p className="text-sm text-foreground-muted">
        {confidenceLevels >= 2
          ? "Tap the song you prefer, then select how clear:"
          : "Tap the song you prefer:"}
      </p>

      {/* Song cards — stacked on mobile, side by side on desktop */}
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <SongCard
          song={songA}
          onSelect={() => handleCardClick(songA.id)}
          disabled={isPending}
          selected={pick === songA.id}
          onPlay={spotifyConnected && playerReady ? handlePlay : undefined}
          isPlaying={isSongPlaying(songA)}
          playbackPosition={isSongPlaying(songA) ? position : 0}
          playbackDuration={isSongPlaying(songA) ? duration : 0}
        />
        <SongCard
          song={songB}
          onSelect={() => handleCardClick(songB.id)}
          disabled={isPending}
          selected={pick === songB.id}
          onPlay={spotifyConnected && playerReady ? handlePlay : undefined}
          isPlaying={isSongPlaying(songB)}
          playbackPosition={isSongPlaying(songB) ? position : 0}
          playbackDuration={isSongPlaying(songB) ? duration : 0}
        />
      </div>

      {/* Draw option */}
      <button
        onClick={handleDrawClick}
        disabled={isPending}
        className={`w-full rounded-lg border py-2 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 ${
          pick === "draw"
            ? "border-accent bg-accent-subtle text-accent"
            : "border-border text-foreground-subtle hover:border-foreground-subtle hover:text-foreground-muted"
        }`}
      >
        Can&apos;t decide &mdash; Draw
      </button>

      {/* Keyboard hint */}
      <p className="text-center text-[11px] text-foreground-subtle">
        &larr;/&rarr; pick winner &bull; D&nbsp;draw &bull; Ctrl+Z undo
        {confidenceLevels >= 2 && (
          <>
            {" "}
            &bull; 1&#8209;{confidenceLevels}&nbsp;certainty &bull;
            Esc&nbsp;cancel
          </>
        )}
        {spotifyConnected && playerReady && (
          <>
            {" "}
            &bull; Q/E&nbsp;play &bull; Space&nbsp;pause
          </>
        )}
      </p>
    </div>
  );
}
