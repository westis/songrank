"use client";

import type { SongWithRating } from "@/lib/types";

interface RankingsTableProps {
  rankings: SongWithRating[];
  onSongClick?: (song: SongWithRating) => void;
}

export default function RankingsTable({
  rankings,
  onSongClick,
}: RankingsTableProps) {
  if (rankings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-foreground-muted">No ranked songs yet.</p>
        <p className="mt-1 text-sm text-foreground-subtle">
          Import songs and start battling to see rankings.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-xs font-medium text-foreground-muted">
              #
            </th>
            <th className="px-4 py-3 text-xs font-medium text-foreground-muted">
              Title
            </th>
            <th className="px-4 py-3 text-xs font-medium text-foreground-muted">
              Artist
            </th>
            <th className="px-4 py-3 text-xs font-medium text-foreground-muted">
              Album
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-foreground-muted">
              Rating
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-foreground-muted">
              &plusmn; RD
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-foreground-muted">
              Battles
            </th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((song, i) => (
            <tr
              key={song.id}
              onClick={() => onSongClick?.(song)}
              className={`border-b border-border-muted transition-colors hover:bg-surface-raised ${
                onSongClick ? "cursor-pointer" : ""
              }`}
            >
              <td className="px-4 py-3 font-mono text-foreground-subtle">
                {i + 1}
              </td>
              <td className="px-4 py-3 font-medium">{song.title}</td>
              <td className="px-4 py-3 text-foreground-muted">{song.artist}</td>
              <td className="px-4 py-3 text-foreground-muted">
                {song.album || "--"}
              </td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-accent">
                {Math.round(song.rating)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-foreground-subtle">
                {Math.round(song.rd)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-foreground-subtle">
                {song.battle_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
