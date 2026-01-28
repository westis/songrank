"use client";

import { useState, useEffect } from "react";
import { useBattle } from "@/hooks/useBattle";
import { useProject } from "@/hooks/useProjects";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import SongCard from "./SongCard";
import ScopeSelector from "./ScopeSelector";
import DecisionBar from "./DecisionBar";
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
  const allowDraws = project?.allow_draws ?? true;
  const confidenceOptions = getConfidenceOptions(confidenceLevels);

  // Spotify playback
  const { isConnected: spotifyConnected, connect: connectSpotify } = useSpotifyAuth();
  const { play, pause, seek, isPlaying, currentTrack, isReady: playerReady, position, duration, error: playerError } = useSpotifyPlayer();

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

  // Handler for DecisionBar (one-click battle submission)
  const handleDecision = (winner: "a" | "b" | null, confidence: Confidence) => {
    if (isPending || !songA || !songB) return;
    const winnerId = winner === "a" ? songA.id : winner === "b" ? songB.id : null;
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

      // Arrow keys select winner (all levels)
      switch (e.key) {
        case "ArrowLeft":
          if (songA && !isPending) handleCardClick(songA.id);
          return;
        case "ArrowRight":
          if (songB && !isPending) handleCardClick(songB.id);
          return;
        case "d":
        case "D":
          if (!isPending && allowDraws) handleDrawClick();
          return;
      }

      // For level 2+: if a pick is made, number keys select confidence
      if (confidenceLevels >= 2 && pick !== null && pick !== "draw") {
        const keyNum = parseInt(e.key);
        if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= confidenceOptions.length) {
          e.preventDefault();
          handleConfidenceSelect(confidenceOptions[keyNum - 1].value);
          return;
        }
      }

      // For level 2+: number keys for decision bar (only when no pick is selected)
      if (confidenceLevels >= 2 && pick === null && songA && songB && !isPending) {
        const keyNum = parseInt(e.key);
        if (!isNaN(keyNum) && keyNum >= 1) {
          const totalSegments = confidenceLevels * 2 + (allowDraws ? 1 : 0);
          if (keyNum <= totalSegments) {
            e.preventDefault();
            // Map key to decision
            // Keys 1-N are Song A (strongest to weakest)
            // Middle key is Draw (if allowed)
            // Keys N+1 to end are Song B (weakest to strongest)
            const confidenceValues: Confidence[] =
              confidenceLevels === 2 ? ["obvious", "slight"] :
              confidenceLevels === 3 ? ["obvious", "clear", "slight"] :
              ["obvious", "clear", "slight", "coin_flip"];

            if (keyNum <= confidenceLevels) {
              // Song A wins
              handleDecision("a", confidenceValues[keyNum - 1]);
            } else if (allowDraws && keyNum === confidenceLevels + 1) {
              // Draw
              handleDecision(null, "slight");
            } else {
              // Song B wins
              const bIndex = keyNum - confidenceLevels - (allowDraws ? 2 : 1);
              handleDecision("b", confidenceValues[confidenceLevels - 1 - bIndex]);
            }
            return;
          }
        }
      }

      switch (e.key) {
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
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songA, songB, isPending, lastBattleId, pick, confidenceLevels, allowDraws, spotifyConnected, playerReady, currentTrack, isPlaying]);

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

      {/* Spotify connection prompt */}
      {!spotifyConnected && (
        <button
          onClick={() => connectSpotify(`/project/${projectId}/battle`)}
          className="flex w-full items-center gap-3 rounded-lg border border-[#1DB954]/30 bg-[#1DB954]/10 px-4 py-2.5 text-left transition-colors hover:border-[#1DB954]/50 hover:bg-[#1DB954]/20"
        >
          <svg className="h-5 w-5 shrink-0 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1DB954]">Connect Spotify</p>
            <p className="text-xs text-foreground-muted">Play songs directly during battles</p>
          </div>
          <svg className="h-4 w-4 text-foreground-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Spotify player error */}
      {spotifyConnected && playerError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {playerError}
        </div>
      )}

      {/* Spotify player loading */}
      {spotifyConnected && !playerReady && !playerError && (
        <div className="flex items-center gap-2 rounded-lg border border-[#1DB954]/30 bg-[#1DB954]/10 px-4 py-2.5 text-sm text-[#1DB954]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Initializing Spotify player...</span>
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

      {/* Which do you prefer? */}
      <p className="text-sm text-foreground-muted">
        {confidenceLevels >= 2
          ? "Which is better? Use the decision bar below:"
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
          onSeek={isSongPlaying(songA) ? seek : undefined}
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
          onSeek={isSongPlaying(songB) ? seek : undefined}
        />
      </div>

      {/* Confidence selector — shows when a pick is made and levels > 1 */}
      {pick !== null && pick !== "draw" && confidenceLevels >= 2 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-accent/30 bg-accent-subtle px-3 py-2.5">
          <span className="text-sm font-medium text-accent">
            {pick === songA.id ? songA.title : songB.title}
          </span>
          <span className="text-xs text-foreground-subtle">How confident?</span>
          <div className="flex flex-wrap gap-1.5">
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
          <button
            onClick={() => setPick(null)}
            className="ml-auto text-xs text-foreground-subtle hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Decision bar — for confidence levels 2+ */}
      {confidenceLevels >= 2 && (
        <DecisionBar
          songATitle={songA.title}
          songBTitle={songB.title}
          confidenceLevels={confidenceLevels}
          allowDraws={allowDraws}
          onDecision={handleDecision}
          disabled={isPending}
        />
      )}

      {/* Simple draw option — only for level 1 and if draws allowed */}
      {confidenceLevels === 1 && allowDraws && (
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
      )}

      {/* Keyboard hint */}
      <p className="text-center text-[11px] text-foreground-subtle">
        &larr;/&rarr; pick winner
        {allowDraws && " \u2022 D\u00a0draw"}
        {" "}&bull; Ctrl+Z undo
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
