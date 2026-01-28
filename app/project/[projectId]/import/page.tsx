"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProjectShell from "@/components/project/ProjectShell";
import { useAddSong, useAddSongsBatch } from "@/hooks/useSongs";
import {
  MIDNIGHT_OIL_ALBUMS,
  MIDNIGHT_OIL_ARTIST,
  getAllSongs,
  getTotalSongCount,
} from "@/lib/seed-data/midnight-oil";

export default function ImportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const addSong = useAddSong();
  const addBatch = useAddSongsBatch();

  // Single song form
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [year, setYear] = useState("");

  // Bulk paste
  const [bulkText, setBulkText] = useState("");
  const [mode, setMode] = useState<"catalog" | "single" | "bulk">("catalog");
  const [bulkArtist, setBulkArtist] = useState("");
  const [bulkAlbum, setBulkAlbum] = useState("");
  const [bulkYear, setBulkYear] = useState("");

  // Catalog import
  const [catalogProgress, setCatalogProgress] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogDone, setCatalogDone] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleCatalogImport = async () => {
    setImporting(true);
    setCatalogError(null);
    setCatalogProgress("Starting import...");

    try {
      // Import album by album for progress feedback
      for (let i = 0; i < MIDNIGHT_OIL_ALBUMS.length; i++) {
        const albumData = MIDNIGHT_OIL_ALBUMS[i];
        setCatalogProgress(
          `Importing ${albumData.album} (${albumData.year})... [${i + 1}/${MIDNIGHT_OIL_ALBUMS.length}]`
        );

        const songs = albumData.tracks.map((title, trackIdx) => ({
          title,
          artist: MIDNIGHT_OIL_ARTIST,
          album: albumData.album,
          year: albumData.year,
          track_number: trackIdx + 1,
        }));

        await addBatch.mutateAsync({ projectId, songs });
      }

      setCatalogProgress(null);
      setCatalogDone(true);
    } catch (err) {
      setCatalogError(
        err instanceof Error ? err.message : "Import failed"
      );
      setCatalogProgress(null);
    } finally {
      setImporting(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;

    await addSong.mutateAsync({
      project_id: projectId,
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim() || undefined,
      year: year ? parseInt(year) : undefined,
    });

    setTitle("");
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim() || !bulkArtist.trim()) return;

    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const songs = lines.map((line, i) => ({
      title: line.replace(/^\d+[\.\)\-\s]+/, "").trim(),
      artist: bulkArtist.trim(),
      album: bulkAlbum.trim() || undefined,
      year: bulkYear ? parseInt(bulkYear) : undefined,
      track_number: i + 1,
    }));

    await addBatch.mutateAsync({ projectId, songs });

    setBulkText("");
    router.push(`/project/${projectId}/songs`);
  };

  return (
    <ProjectShell projectId={projectId}>
      <div className="mx-auto max-w-2xl">
      <div className="animate-fade-slide-up">
        <h2 className="text-xl font-bold">Add Songs</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Import a full catalog or add songs manually.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="animate-fade-slide-up stagger-1 mt-8 flex gap-2">
        <button
          onClick={() => setMode("catalog")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "catalog"
              ? "bg-accent text-background"
              : "border border-border text-foreground-muted hover:border-accent hover:text-accent"
          }`}
        >
          Catalog Import
        </button>
        <button
          onClick={() => setMode("single")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "single"
              ? "bg-accent text-background"
              : "border border-border text-foreground-muted hover:border-accent hover:text-accent"
          }`}
        >
          Single Song
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "bulk"
              ? "bg-accent text-background"
              : "border border-border text-foreground-muted hover:border-accent hover:text-accent"
          }`}
        >
          Bulk Paste
        </button>
      </div>

      {mode === "catalog" && (
        <div className="animate-fade-slide-up stagger-2 mt-6 space-y-4">
          {/* Midnight Oil catalog card */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Midnight Oil</h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  Complete studio discography &mdash;{" "}
                  {MIDNIGHT_OIL_ALBUMS.length} albums,{" "}
                  {getTotalSongCount()} songs (1978&ndash;2022)
                </p>
              </div>
            </div>

            {/* Album list preview */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {MIDNIGHT_OIL_ALBUMS.map((a) => (
                <div
                  key={a.album}
                  className="flex items-center justify-between rounded-lg border border-border-muted bg-surface-raised px-3 py-2 text-sm"
                >
                  <span className="truncate font-medium">{a.album}</span>
                  <span className="ml-2 shrink-0 text-xs text-foreground-subtle">
                    {a.year} &middot; {a.tracks.length} tracks
                  </span>
                </div>
              ))}
            </div>

            {catalogError && (
              <p className="mt-4 text-sm text-error">{catalogError}</p>
            )}

            {catalogProgress && (
              <div className="mt-4 rounded-lg border border-accent/30 bg-accent-subtle p-3">
                <p className="text-sm text-accent">{catalogProgress}</p>
              </div>
            )}

            {catalogDone ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-success/30 bg-success/10 p-3">
                  <p className="text-sm text-success">
                    Imported {getTotalSongCount()} songs across{" "}
                    {MIDNIGHT_OIL_ALBUMS.length} albums!
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/project/${projectId}/songs`}
                    className="flex-1 rounded-lg bg-accent py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
                  >
                    View Songs
                  </Link>
                  <Link
                    href={`/project/${projectId}/battle`}
                    className="flex-1 rounded-lg border border-border py-2.5 text-center text-sm font-semibold text-foreground-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    Start Battling
                  </Link>
                </div>
              </div>
            ) : (
              <button
                onClick={handleCatalogImport}
                disabled={importing}
                className="mt-4 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {importing
                  ? "Importing..."
                  : `Import All ${getTotalSongCount()} Songs`}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-foreground-subtle">
            Song data compiled from memory. You can edit the catalog in{" "}
            <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
              lib/seed-data/midnight-oil.ts
            </code>{" "}
            if any tracks are wrong or missing.
          </p>
        </div>
      )}

      {mode === "single" && (
        <form
          onSubmit={handleSingleSubmit}
          className="animate-fade-slide-up stagger-2 mt-6 rounded-xl border border-border bg-surface p-6"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="mb-1.5 block text-sm font-medium text-foreground-muted"
              >
                Song Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Beds Are Burning"
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="artist"
                className="mb-1.5 block text-sm font-medium text-foreground-muted"
              >
                Artist
              </label>
              <input
                id="artist"
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
                placeholder="Midnight Oil"
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="album"
                  className="mb-1.5 block text-sm font-medium text-foreground-muted"
                >
                  Album{" "}
                  <span className="text-foreground-subtle">(optional)</span>
                </label>
                <input
                  id="album"
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="Diesel and Dust"
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="year"
                  className="mb-1.5 block text-sm font-medium text-foreground-muted"
                >
                  Year{" "}
                  <span className="text-foreground-subtle">(optional)</span>
                </label>
                <input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="1987"
                  min={1900}
                  max={2100}
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {addSong.error && (
            <p className="mt-3 text-sm text-error">
              {(addSong.error as Error).message}
            </p>
          )}

          {addSong.isSuccess && (
            <p className="mt-3 text-sm text-success">Song added!</p>
          )}

          <button
            type="submit"
            disabled={addSong.isPending || !title.trim() || !artist.trim()}
            className="mt-6 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {addSong.isPending ? "Adding..." : "Add Song"}
          </button>
        </form>
      )}

      {mode === "bulk" && (
        <form
          onSubmit={handleBulkSubmit}
          className="animate-fade-slide-up stagger-2 mt-6 rounded-xl border border-border bg-surface p-6"
        >
          <p className="mb-4 text-sm text-foreground-muted">
            Paste a list of song titles, one per line. Numbering (e.g. &quot;1.
            Song Title&quot;) is stripped automatically.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="bulkArtist"
                  className="mb-1.5 block text-sm font-medium text-foreground-muted"
                >
                  Artist
                </label>
                <input
                  id="bulkArtist"
                  type="text"
                  value={bulkArtist}
                  onChange={(e) => setBulkArtist(e.target.value)}
                  required
                  placeholder="Midnight Oil"
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="bulkAlbum"
                  className="mb-1.5 block text-sm font-medium text-foreground-muted"
                >
                  Album
                </label>
                <input
                  id="bulkAlbum"
                  type="text"
                  value={bulkAlbum}
                  onChange={(e) => setBulkAlbum(e.target.value)}
                  placeholder="Diesel and Dust"
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="bulkYear"
                  className="mb-1.5 block text-sm font-medium text-foreground-muted"
                >
                  Year
                </label>
                <input
                  id="bulkYear"
                  type="number"
                  value={bulkYear}
                  onChange={(e) => setBulkYear(e.target.value)}
                  placeholder="1987"
                  min={1900}
                  max={2100}
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="bulkText"
                className="mb-1.5 block text-sm font-medium text-foreground-muted"
              >
                Song Titles (one per line)
              </label>
              <textarea
                id="bulkText"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                required
                rows={10}
                placeholder={`1. Beds Are Burning\n2. Put Down That Weapon\n3. The Dead Heart\n4. Dreamworld`}
                className="w-full resize-y rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {addBatch.error && (
            <p className="mt-3 text-sm text-error">
              {(addBatch.error as Error).message}
            </p>
          )}

          <button
            type="submit"
            disabled={
              addBatch.isPending || !bulkText.trim() || !bulkArtist.trim()
            }
            className="mt-6 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {addBatch.isPending
              ? "Importing..."
              : `Import ${bulkText.split("\n").filter((l) => l.trim()).length} Songs`}
          </button>
        </form>
      )}
    </div>
    </ProjectShell>
  );
}
