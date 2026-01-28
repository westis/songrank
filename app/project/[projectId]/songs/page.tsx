"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProjectShell from "@/components/project/ProjectShell";
import {
  useSongs,
  useDeleteSong,
  useDeleteAlbumSongs,
  useUpdateSong,
} from "@/hooks/useSongs";
import Loading from "@/components/shared/Loading";
import type { Song } from "@/lib/types";

export default function SongsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: songs, isLoading } = useSongs(projectId);
  const deleteSong = useDeleteSong();
  const deleteAlbumSongs = useDeleteAlbumSongs();
  const updateSong = useUpdateSong();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState<string | null>(
    null
  );

  // Group songs by album
  const albumGroups = new Map<string, Song[]>();
  for (const song of songs ?? []) {
    const key = song.album || "(No Album)";
    const group = albumGroups.get(key) ?? [];
    group.push(song);
    albumGroups.set(key, group);
  }

  // Sort albums by year (earliest song in album), then name
  const sortedAlbums = Array.from(albumGroups.entries()).sort(
    ([aName, aSongs], [bName, bSongs]) => {
      const aYear = Math.min(
        ...aSongs.map((s) => s.year ?? 9999)
      );
      const bYear = Math.min(
        ...bSongs.map((s) => s.year ?? 9999)
      );
      if (aYear !== bYear) return aYear - bYear;
      return aName.localeCompare(bName);
    }
  );

  return (
    <ProjectShell projectId={projectId}>
      {isLoading ? (
        <Loading text="Loading songs..." />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Manage Songs</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {songs?.length ?? 0} songs across{" "}
                {albumGroups.size} albums
              </p>
            </div>
            <Link
              href={`/project/${projectId}/import`}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
            >
              Add Songs
            </Link>
          </div>

          {sortedAlbums.length > 0 ? (
            <div className="mt-6 space-y-6">
              {sortedAlbums.map(([album, albumSongs]) => (
                <div
                  key={album}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  {/* Album header */}
                  <div className="flex items-center justify-between bg-surface px-4 py-3 border-b border-border">
                    <div>
                      <h3 className="text-sm font-semibold">{album}</h3>
                      <p className="text-xs text-foreground-muted">
                        {albumSongs.length} songs
                        {albumSongs[0]?.year
                          ? ` \u00B7 ${albumSongs[0].year}`
                          : ""}
                      </p>
                    </div>
                    {album !== "(No Album)" && (
                      <>
                        {confirmDeleteAlbum === album ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground-muted">
                              Delete all songs?
                            </span>
                            <button
                              onClick={() => {
                                deleteAlbumSongs.mutate({
                                  projectId,
                                  album,
                                });
                                setConfirmDeleteAlbum(null);
                              }}
                              className="rounded-md bg-error px-2.5 py-1 text-xs font-medium text-white"
                            >
                              Yes, delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteAlbum(null)}
                              className="text-xs text-foreground-muted hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteAlbum(album)}
                            className="text-xs text-foreground-subtle transition-colors hover:text-error"
                          >
                            Delete Album
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Songs table */}
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {albumSongs
                        .sort(
                          (a, b) =>
                            (a.track_number ?? 999) - (b.track_number ?? 999)
                        )
                        .map((song) => (
                          <SongRow
                            key={song.id}
                            song={song}
                            projectId={projectId}
                            isEditing={editingId === song.id}
                            onEdit={() =>
                              setEditingId(
                                editingId === song.id ? null : song.id
                              )
                            }
                            onSave={(updates) => {
                              updateSong.mutate({
                                songId: song.id,
                                projectId,
                                updates,
                              });
                              setEditingId(null);
                            }}
                            onDelete={() =>
                              deleteSong.mutate({
                                songId: song.id,
                                projectId,
                              })
                            }
                            onCancel={() => setEditingId(null)}
                          />
                        ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-surface/50 p-12 text-center">
              <p className="text-foreground-muted">No songs yet.</p>
              <p className="mt-1 text-sm text-foreground-subtle">
                Add songs from the catalog or paste them manually.
              </p>
            </div>
          )}
        </>
      )}
    </ProjectShell>
  );
}

function SongRow({
  song,
  projectId,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onCancel,
}: {
  song: Song;
  projectId: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: {
    title?: string;
    artist?: string;
    album?: string | null;
    year?: number | null;
    track_number?: number | null;
  }) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [album, setAlbum] = useState(song.album ?? "");
  const [year, setYear] = useState(song.year?.toString() ?? "");
  const [trackNum, setTrackNum] = useState(
    song.track_number?.toString() ?? ""
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isEditing) {
    return (
      <tr className="border-b border-border-muted bg-surface-raised">
        <td colSpan={99} className="px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-foreground-muted">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-foreground-muted">Artist</label>
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-foreground-muted">Album</label>
              <input
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-foreground-muted">Year</label>
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  type="number"
                  className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div className="w-20">
                <label className="text-xs text-foreground-muted">Track #</label>
                <input
                  value={trackNum}
                  onChange={(e) => setTrackNum(e.target.value)}
                  type="number"
                  className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() =>
                onSave({
                  title: title.trim() || song.title,
                  artist: artist.trim() || song.artist,
                  album: album.trim() || null,
                  year: year ? parseInt(year) : null,
                  track_number: trackNum ? parseInt(trackNum) : null,
                })
              }
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-background"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="text-xs text-foreground-muted hover:text-foreground"
            >
              Cancel
            </button>
            <div className="flex-1" />
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-error">Delete this song?</span>
                <button
                  onClick={onDelete}
                  className="rounded-md bg-error px-2.5 py-1 text-xs font-medium text-white"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-foreground-muted"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-foreground-subtle hover:text-error"
              >
                Delete Song
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border-muted transition-colors hover:bg-surface-raised">
      <td className="w-10 px-4 py-2.5 font-mono text-xs text-foreground-subtle">
        {song.track_number ?? "-"}
      </td>
      <td className="px-4 py-2.5">
        <span className="font-medium">{song.title}</span>
        <span className="mt-0.5 block text-xs text-foreground-muted sm:hidden">
          {song.artist}
        </span>
      </td>
      <td className="hidden px-4 py-2.5 text-foreground-muted sm:table-cell">
        {song.artist}
      </td>
      <td className="px-4 py-2.5 text-right">
        <button
          onClick={onEdit}
          className="text-xs text-foreground-subtle transition-colors hover:text-accent"
        >
          Edit
        </button>
      </td>
    </tr>
  );
}
