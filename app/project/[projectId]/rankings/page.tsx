"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import ProjectShell from "@/components/project/ProjectShell";
import { useRankings, useAlbums } from "@/hooks/useRankings";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useAuth } from "@/hooks/useAuth";
import RankingsTable from "@/components/rankings/RankingsTable";
import RankingFilters from "@/components/rankings/RankingFilters";
import SongDetailModal from "@/components/rankings/SongDetailModal";
import Loading from "@/components/shared/Loading";
import type { SongWithRating } from "@/lib/types";

export default function RankingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [minBattles, setMinBattles] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedSong, setSelectedSong] = useState<SongWithRating | null>(
    null
  );
  const [viewUserId, setViewUserId] = useState<string | undefined>(undefined);

  const { data: collaborators } = useCollaborators(projectId);
  const { data: rankings, isLoading } = useRankings(projectId, {
    album: selectedAlbum || undefined,
    minBattles,
    search: search || undefined,
    userId: viewUserId,
  });
  const { data: albums } = useAlbums(projectId);

  const hasCollaborators = collaborators && collaborators.length > 1;

  return (
    <ProjectShell projectId={projectId}>
      {isLoading ? (
        <Loading text="Loading rankings..." />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground-muted">
              {rankings?.length ?? 0} songs ranked by WHR
            </p>
          </div>

          {/* User toggle (only if collaborators exist) */}
          {hasCollaborators && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-foreground-subtle">View:</span>
              <UserPill
                active={!viewUserId || viewUserId === user?.id}
                onClick={() => setViewUserId(undefined)}
              >
                My Rankings
              </UserPill>
              {collaborators
                .filter((c) => c.user_id !== user?.id)
                .map((c) => (
                  <UserPill
                    key={c.user_id}
                    active={viewUserId === c.user_id}
                    onClick={() => setViewUserId(c.user_id)}
                  >
                    {c.display_name}
                  </UserPill>
                ))}
            </div>
          )}

          <RankingFilters
            albums={albums ?? []}
            selectedAlbum={selectedAlbum}
            onAlbumChange={setSelectedAlbum}
            minBattles={minBattles}
            onMinBattlesChange={setMinBattles}
            search={search}
            onSearchChange={setSearch}
          />

          <RankingsTable
            rankings={rankings ?? []}
            onSongClick={setSelectedSong}
          />
        </div>
      )}

      {selectedSong && (
        <SongDetailModal
          song={selectedSong}
          projectId={projectId}
          onClose={() => setSelectedSong(null)}
        />
      )}
    </ProjectShell>
  );
}

function UserPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-accent text-background"
          : "border border-border text-foreground-muted hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}
