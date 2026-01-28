"use client";

import { useAlbums } from "@/hooks/useRankings";
import type { BattleScope } from "@/lib/types";

interface ScopeSelectorProps {
  projectId: string;
  scope: BattleScope;
  onScopeChange: (scope: BattleScope) => void;
}

export default function ScopeSelector({
  projectId,
  scope,
  onScopeChange,
}: ScopeSelectorProps) {
  const { data: albums } = useAlbums(projectId);

  return (
    <div className="space-y-3">
      {/* Mode pills */}
      <div className="flex flex-wrap items-center gap-2">
        <ScopePill
          active={scope.type === "all"}
          onClick={() => onScopeChange({ type: "all" })}
        >
          All Songs
        </ScopePill>
        <ScopePill
          active={scope.type === "album"}
          onClick={() => {
            if (albums && albums.length > 0) {
              onScopeChange({ type: "album", album: albums[0] });
            }
          }}
          disabled={!albums || albums.length === 0}
        >
          Single Album
        </ScopePill>
        <ScopePill
          active={scope.type === "cross_album"}
          onClick={() => {
            if (albums && albums.length >= 2) {
              onScopeChange({
                type: "cross_album",
                albumA: albums[0],
                albumB: albums[1],
                topN: 4,
              });
            }
          }}
          disabled={!albums || albums.length < 2}
        >
          Cross-Album
        </ScopePill>
      </div>

      {/* Album selector for single album mode */}
      {scope.type === "album" && albums && albums.length > 0 && (
        <select
          value={scope.album || ""}
          onChange={(e) => onScopeChange({ ...scope, album: e.target.value })}
          className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none sm:w-auto"
        >
          {albums.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      )}

      {/* Album selectors for cross-album mode */}
      {scope.type === "cross_album" && albums && albums.length >= 2 && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={scope.albumA || ""}
            onChange={(e) =>
              onScopeChange({ ...scope, albumA: e.target.value })
            }
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {albums.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <span className="text-xs font-medium text-foreground-subtle">vs</span>
          <select
            value={scope.albumB || ""}
            onChange={(e) =>
              onScopeChange({ ...scope, albumB: e.target.value })
            }
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {albums.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-foreground-subtle">Top</label>
            <select
              value={scope.topN || 0}
              onChange={(e) => {
                const n = parseInt(e.target.value);
                onScopeChange({ ...scope, topN: n || undefined });
              }}
              className="rounded-lg border border-border bg-surface-raised px-2 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value={0}>All</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
            </select>
            <span className="text-xs text-foreground-subtle">per album</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ScopePill({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-accent text-background"
          : disabled
            ? "border border-border text-foreground-subtle opacity-50"
            : "border border-border text-foreground-muted hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}
