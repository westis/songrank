"use client";

import { useState } from "react";
import { useBattleHistory, useDeleteBattle, useClearAllBattles } from "@/hooks/useBattleHistory";
import type { BattleWithSongs } from "@/lib/types";

interface BattleHistoryProps {
  projectId: string;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getResultText(battle: BattleWithSongs) {
  if (!battle.winner_id) {
    return "Draw";
  }
  const winner = battle.winner_id === battle.song_a_id ? battle.song_a : battle.song_b;
  return winner.title;
}

function getConfidenceLabel(confidence: string | null) {
  switch (confidence) {
    case "obvious":
      return "Clear";
    case "clear":
      return "Moderate";
    case "slight":
      return "Slight";
    case "coin_flip":
      return "Coin flip";
    default:
      return "";
  }
}

export default function BattleHistory({ projectId }: BattleHistoryProps) {
  const { data: battles, isLoading } = useBattleHistory(projectId, 100);
  const deleteBattle = useDeleteBattle();
  const clearAll = useClearAllBattles();
  const [confirmClear, setConfirmClear] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (!battles || battles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center">
        <p className="text-sm text-foreground-muted">No battles yet</p>
        <p className="mt-1 text-xs text-foreground-subtle">
          Start battling songs to build your ranking history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with clear all */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Battle History ({battles.length})
        </h3>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted">Delete all battles?</span>
            <button
              onClick={() => {
                clearAll.mutate(projectId);
                setConfirmClear(false);
              }}
              disabled={clearAll.isPending}
              className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
            >
              {clearAll.isPending ? "Deleting..." : "Yes, clear all"}
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="rounded-md px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="rounded-md px-2 py-1 text-xs text-foreground-subtle hover:text-red-400"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Battle list */}
      <div className="space-y-2">
        {battles.map((battle) => (
          <div
            key={battle.id}
            className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
          >
            {/* Songs */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`truncate ${
                    battle.winner_id === battle.song_a_id
                      ? "font-medium text-accent"
                      : battle.winner_id === null
                        ? "text-foreground"
                        : "text-foreground-muted"
                  }`}
                >
                  {battle.song_a.title}
                </span>
                <span className="shrink-0 text-foreground-subtle">vs</span>
                <span
                  className={`truncate ${
                    battle.winner_id === battle.song_b_id
                      ? "font-medium text-accent"
                      : battle.winner_id === null
                        ? "text-foreground"
                        : "text-foreground-muted"
                  }`}
                >
                  {battle.song_b.title}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-foreground-subtle">
                <span>
                  {battle.winner_id ? (
                    <>Winner: {getResultText(battle)}</>
                  ) : (
                    "Draw"
                  )}
                </span>
                {battle.confidence && (
                  <>
                    <span>&bull;</span>
                    <span>{getConfidenceLabel(battle.confidence)}</span>
                  </>
                )}
                <span>&bull;</span>
                <span>{formatDate(battle.created_at)}</span>
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={() => deleteBattle.mutate({ battleId: battle.id, projectId })}
              disabled={deleteBattle.isPending}
              className="shrink-0 rounded p-1 text-foreground-subtle opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
              title="Delete this battle"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
