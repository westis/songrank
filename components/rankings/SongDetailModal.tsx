"use client";

import { useState } from "react";
import {
  useSongBattleHistory,
  useEditBattle,
} from "@/hooks/useSongDetail";
import type { SongWithRating } from "@/lib/types";
import type { BattleHistoryEntry } from "@/hooks/useSongDetail";

interface SongDetailModalProps {
  song: SongWithRating;
  projectId: string;
  onClose: () => void;
}

export default function SongDetailModal({
  song,
  projectId,
  onClose,
}: SongDetailModalProps) {
  const { data: battles, isLoading } = useSongBattleHistory(
    projectId,
    song.id
  );
  const editBattle = useEditBattle(projectId);

  const wins = battles?.filter((b) => b.result === "win").length ?? 0;
  const losses = battles?.filter((b) => b.result === "loss").length ?? 0;
  const draws = battles?.filter((b) => b.result === "draw").length ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface-raised shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{song.title}</h2>
              <p className="text-sm text-foreground-muted">
                {song.artist}
                {song.album ? ` \u00b7 ${song.album}` : ""}
                {song.year ? ` \u00b7 ${song.year}` : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-md p-1 text-foreground-subtle transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-3 flex gap-4 text-sm">
            <div>
              <span className="text-foreground-subtle">Rating </span>
              <span className="font-mono font-semibold text-accent">
                {Math.round(song.rating)}
              </span>
              <span className="ml-1 font-mono text-foreground-subtle">
                &plusmn;{Math.round(song.rd)}
              </span>
            </div>
            <div className="text-foreground-subtle">
              {wins}W {losses}L {draws}D
            </div>
          </div>
        </div>

        {/* Battle history */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
          <h3 className="text-xs font-medium text-foreground-subtle uppercase tracking-wide">
            Battle History
          </h3>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              Loading...
            </p>
          ) : !battles?.length ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              No battles yet.
            </p>
          ) : (
            <div className="mt-2 space-y-1">
              {battles.map((b) => (
                <BattleRow
                  key={b.id}
                  battle={b}
                  songId={song.id}
                  editBattle={editBattle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BattleRow({
  battle,
  songId,
  editBattle,
}: {
  battle: BattleHistoryEntry;
  songId: string;
  editBattle: ReturnType<typeof useEditBattle>;
}) {
  const [editing, setEditing] = useState(false);

  const handleChangeResult = (newResult: "win" | "loss" | "draw") => {
    let newWinnerId: string | null;
    if (newResult === "draw") {
      newWinnerId = null;
    } else if (newResult === "win") {
      newWinnerId = songId;
    } else {
      // loss → opponent wins
      newWinnerId = battle.opponent.id;
    }
    editBattle.mutate(
      { battleId: battle.id, winnerId: newWinnerId },
      { onSuccess: () => setEditing(false) }
    );
  };

  const date = new Date(battle.created_at);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const resultColor =
    battle.result === "win"
      ? "text-green-500"
      : battle.result === "loss"
        ? "text-red-400"
        : "text-foreground-subtle";

  const resultLabel =
    battle.result === "win"
      ? "W"
      : battle.result === "loss"
        ? "L"
        : "D";

  if (editing) {
    return (
      <div className="rounded-lg border border-accent/30 bg-accent-subtle px-3 py-2">
        <p className="text-xs text-foreground-muted">
          vs {battle.opponent.title}
        </p>
        <div className="mt-1.5 flex gap-2">
          {(["win", "loss", "draw"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => handleChangeResult(opt)}
              disabled={editBattle.isPending}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                opt === battle.result
                  ? "border-accent bg-accent text-background"
                  : "border-border text-foreground-muted hover:border-accent hover:text-accent"
              }`}
            >
              {opt === "win" ? "Won" : opt === "loss" ? "Lost" : "Draw"}
            </button>
          ))}
          <button
            onClick={() => setEditing(false)}
            className="ml-auto text-xs text-foreground-subtle hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface">
      <span
        className={`w-5 text-center text-xs font-bold ${resultColor}`}
      >
        {resultLabel}
      </span>
      <span className="flex-1 truncate text-sm">
        {battle.opponent.title}
      </span>
      <span className="text-xs text-foreground-subtle">{dateStr}</span>
      <button
        onClick={() => setEditing(true)}
        className="invisible text-xs text-foreground-subtle transition-colors hover:text-accent group-hover:visible"
      >
        Edit
      </button>
    </div>
  );
}
