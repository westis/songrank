"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProjectShell from "@/components/project/ProjectShell";
import SpotifyConnect from "@/components/auth/SpotifyConnect";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { useAddSong, useAddSongsBatch, useImportSpotifySongs } from "@/hooks/useSongs";
import {
  searchArtists,
  getAllArtistAlbums,
  getAlbumTracks,
  getTracks,
} from "@/lib/spotify/api";
import {
  spotifyTrackToSong,
  deduplicateByISRC,
  sortByAlbumOrder,
} from "@/lib/spotify/import";
import type { SpotifyArtist, SpotifyAlbum, SpotifyTrack } from "@/lib/spotify/types";
import type { Song } from "@/lib/types";

type ImportMode = "spotify" | "single" | "bulk";
type SpotifyStep = "search" | "albums" | "tracks" | "importing" | "done";

export default function ImportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { isConnected, getValidToken } = useSpotifyAuth();
  const addSong = useAddSong();
  const addBatch = useAddSongsBatch();
  const importSpotify = useImportSpotifySongs();

  // Mode selection
  const [mode, setMode] = useState<ImportMode>("spotify");

  // Spotify import state
  const [spotifyStep, setSpotifyStep] = useState<SpotifyStep>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<Set<string>>(new Set());
  const [albumFilter, setAlbumFilter] = useState<"all" | "album" | "single" | "compilation">("all");
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [tracks, setTracks] = useState<Array<Omit<Song, "id" | "created_at">>>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);

  // Single song form
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [year, setYear] = useState("");

  // Bulk paste
  const [bulkText, setBulkText] = useState("");
  const [bulkArtist, setBulkArtist] = useState("");
  const [bulkAlbum, setBulkAlbum] = useState("");
  const [bulkYear, setBulkYear] = useState("");

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || !isConnected) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const token = await getValidToken();
        if (!token) return;

        const results = await searchArtists(searchQuery, token, 5, getValidToken);
        setSearchResults(results.artists.items);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isConnected, getValidToken]);

  // Select artist and fetch albums
  const handleSelectArtist = useCallback(async (artist: SpotifyArtist) => {
    setSelectedArtist(artist);
    setSpotifyStep("albums");
    setLoadingAlbums(true);
    setAlbums([]);

    try {
      const token = await getValidToken();
      if (!token) return;

      const albumList = await getAllArtistAlbums(artist.id, token, {
        includeGroups: ["album", "single", "compilation"],
        onTokenRefresh: getValidToken,
      });

      // Sort by release date (newest first)
      albumList.sort((a, b) => b.release_date.localeCompare(a.release_date));
      setAlbums(albumList);

      // Default: select all studio albums
      const studioAlbums = albumList
        .filter((a) => a.album_type === "album")
        .map((a) => a.id);
      setSelectedAlbums(new Set(studioAlbums));
    } catch (err) {
      console.error("Failed to fetch albums:", err);
    } finally {
      setLoadingAlbums(false);
    }
  }, [getValidToken]);

  // Filter albums by type
  const filteredAlbums = albums.filter((a) => {
    if (albumFilter === "all") return true;
    return a.album_type === albumFilter;
  });

  // Toggle album selection
  const toggleAlbum = (albumId: string) => {
    setSelectedAlbums((prev) => {
      const next = new Set(prev);
      if (next.has(albumId)) {
        next.delete(albumId);
      } else {
        next.add(albumId);
      }
      return next;
    });
  };

  // Select/deselect all visible albums
  const selectAllVisible = () => {
    setSelectedAlbums((prev) => {
      const next = new Set(prev);
      filteredAlbums.forEach((a) => next.add(a.id));
      return next;
    });
  };

  const deselectAllVisible = () => {
    setSelectedAlbums((prev) => {
      const next = new Set(prev);
      filteredAlbums.forEach((a) => next.delete(a.id));
      return next;
    });
  };

  // Fetch tracks for selected albums
  const handleFetchTracks = useCallback(async () => {
    if (selectedAlbums.size === 0) return;

    setSpotifyStep("tracks");
    setLoadingTracks(true);
    setTracks([]);
    setDuplicateCount(0);

    try {
      const token = await getValidToken();
      if (!token) return;

      const allTracks: SpotifyTrack[] = [];
      const selectedAlbumsList = albums.filter((a) => selectedAlbums.has(a.id));

      // Fetch tracks for each album
      for (const album of selectedAlbumsList) {
        const tracksResponse = await getAlbumTracks(album.id, token, {
          onTokenRefresh: getValidToken,
        });

        // Track items from album endpoint are simplified; we need full track details
        const trackIds = tracksResponse.items.map((t) => t.id);
        const fullTracks = await getTracks(trackIds, token, getValidToken);

        // Add album info to tracks (album endpoint tracks don't have full album data)
        fullTracks.forEach((track) => {
          // Ensure album info is complete
          if (!track.album.images?.length && album.images?.length) {
            track.album.images = album.images;
          }
        });

        allTracks.push(...fullTracks);
      }

      // Convert to Song format
      const songData = allTracks.map((track) =>
        spotifyTrackToSong(track, projectId)
      );

      // Deduplicate by ISRC
      const { unique, duplicates } = deduplicateByISRC(songData);
      setDuplicateCount(duplicates.length);

      // Sort by album order
      const sorted = sortByAlbumOrder(unique);
      setTracks(sorted);
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
      setImportError(err instanceof Error ? err.message : "Failed to fetch tracks");
    } finally {
      setLoadingTracks(false);
    }
  }, [selectedAlbums, albums, projectId, getValidToken]);

  // Import tracks to database
  const handleImport = useCallback(async () => {
    if (tracks.length === 0) return;

    setSpotifyStep("importing");
    setImportProgress("Importing songs...");
    setImportError(null);

    try {
      await importSpotify.mutateAsync({
        projectId,
        songs: tracks,
      });

      setImportedCount(tracks.length);
      setSpotifyStep("done");
    } catch (err) {
      console.error("Import failed:", err);
      setImportError(err instanceof Error ? err.message : "Import failed");
      setSpotifyStep("tracks");
    }
  }, [tracks, projectId, importSpotify]);

  // Reset Spotify import flow
  const resetSpotifyImport = () => {
    setSpotifyStep("search");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedArtist(null);
    setAlbums([]);
    setSelectedAlbums(new Set());
    setTracks([]);
    setDuplicateCount(0);
    setImportedCount(0);
    setImportError(null);
  };

  // Single song submit
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

  // Bulk paste submit
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
      <div className="mx-auto max-w-3xl">
        <div className="animate-fade-slide-up">
          <h2 className="text-xl font-bold">Add Songs</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Import from Spotify or add songs manually.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="animate-fade-slide-up stagger-1 mt-8 flex gap-2">
          <button
            onClick={() => setMode("spotify")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === "spotify"
                ? "bg-[#1DB954] text-white"
                : "border border-border text-foreground-muted hover:border-[#1DB954] hover:text-[#1DB954]"
            }`}
          >
            Spotify Import
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

        {/* Spotify Import */}
        {mode === "spotify" && (
          <div className="animate-fade-slide-up stagger-2 mt-6 space-y-4">
            {!isConnected ? (
              <div className="rounded-xl border border-border bg-surface p-6 text-center">
                <h3 className="text-lg font-semibold">Connect Spotify</h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  Connect your Spotify account to search and import songs.
                </p>
                <div className="mt-4 flex justify-center">
                  <SpotifyConnect returnPath={`/project/${projectId}/import`} />
                </div>
              </div>
            ) : (
              <>
                {/* Step 1: Search */}
                {spotifyStep === "search" && (
                  <div className="rounded-xl border border-border bg-surface p-6">
                    <h3 className="text-lg font-semibold">Search for Artist</h3>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., Midnight Oil"
                      className="mt-4 w-full rounded-lg border border-border bg-surface-raised px-4 py-3 text-foreground placeholder:text-foreground-subtle focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                      autoFocus
                    />

                    {searching && (
                      <p className="mt-4 text-sm text-foreground-muted">Searching...</p>
                    )}

                    {searchResults.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {searchResults.map((artist) => (
                          <button
                            key={artist.id}
                            onClick={() => handleSelectArtist(artist)}
                            className="flex w-full items-center gap-4 rounded-lg border border-border bg-surface-raised p-3 text-left transition-colors hover:border-[#1DB954]"
                          >
                            {artist.images[0] ? (
                              <Image
                                src={artist.images[0].url}
                                alt={artist.name}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-foreground-muted">
                                <span className="text-lg">{artist.name[0]}</span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{artist.name}</p>
                              <p className="text-sm text-foreground-muted">
                                {artist.genres.slice(0, 3).join(", ") || "Artist"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Album Selection */}
                {spotifyStep === "albums" && selectedArtist && (
                  <div className="rounded-xl border border-border bg-surface p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={resetSpotifyImport}
                          className="rounded-lg p-1 text-foreground-muted hover:text-foreground"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <h3 className="text-lg font-semibold">{selectedArtist.name}</h3>
                      </div>
                      <p className="text-sm text-foreground-muted">
                        {selectedAlbums.size} selected
                      </p>
                    </div>

                    {loadingAlbums ? (
                      <p className="mt-4 text-sm text-foreground-muted">Loading albums...</p>
                    ) : (
                      <>
                        {/* Filter tabs */}
                        <div className="mt-4 flex gap-2">
                          {(["all", "album", "single", "compilation"] as const).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setAlbumFilter(filter)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                albumFilter === filter
                                  ? "bg-accent text-background"
                                  : "border border-border text-foreground-muted hover:text-foreground"
                              }`}
                            >
                              {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1) + "s"}
                            </button>
                          ))}
                        </div>

                        {/* Select all/none */}
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={selectAllVisible}
                            className="text-xs text-accent hover:underline"
                          >
                            Select all visible
                          </button>
                          <span className="text-foreground-subtle">|</span>
                          <button
                            onClick={deselectAllVisible}
                            className="text-xs text-foreground-muted hover:underline"
                          >
                            Deselect all visible
                          </button>
                        </div>

                        {/* Album grid */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {filteredAlbums.map((album) => (
                            <button
                              key={album.id}
                              onClick={() => toggleAlbum(album.id)}
                              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                                selectedAlbums.has(album.id)
                                  ? "border-[#1DB954] bg-[#1DB954]/10"
                                  : "border-border bg-surface-raised hover:border-border-muted"
                              }`}
                            >
                              {album.images[0] ? (
                                <Image
                                  src={album.images[0].url}
                                  alt={album.name}
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded bg-surface text-foreground-muted">
                                  <span className="text-xs">No Art</span>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{album.name}</p>
                                <p className="text-xs text-foreground-muted">
                                  {album.release_date.slice(0, 4)} &middot; {album.total_tracks} tracks
                                </p>
                              </div>
                              <div
                                className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                                  selectedAlbums.has(album.id)
                                    ? "border-[#1DB954] bg-[#1DB954]"
                                    : "border-border"
                                }`}
                              >
                                {selectedAlbums.has(album.id) && (
                                  <svg className="h-full w-full text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleFetchTracks}
                          disabled={selectedAlbums.size === 0}
                          className="mt-6 w-full rounded-lg bg-[#1DB954] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          Continue with {selectedAlbums.size} album{selectedAlbums.size !== 1 ? "s" : ""}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Step 3: Track Review */}
                {spotifyStep === "tracks" && (
                  <div className="rounded-xl border border-border bg-surface p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSpotifyStep("albums")}
                          className="rounded-lg p-1 text-foreground-muted hover:text-foreground"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <h3 className="text-lg font-semibold">Review Tracks</h3>
                      </div>
                    </div>

                    {loadingTracks ? (
                      <div className="mt-4">
                        <p className="text-sm text-foreground-muted">Loading tracks...</p>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-sm text-foreground-muted">
                          {tracks.length} songs ready to import
                          {duplicateCount > 0 && (
                            <span className="text-foreground-subtle">
                              {" "}({duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} removed by ISRC)
                            </span>
                          )}
                        </p>

                        {/* Track list preview */}
                        <div className="mt-4 max-h-80 space-y-1 overflow-y-auto">
                          {tracks.slice(0, 50).map((track, i) => (
                            <div
                              key={track.spotify_id}
                              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-raised"
                            >
                              <span className="w-6 text-right text-xs text-foreground-subtle">{i + 1}</span>
                              <span className="flex-1 truncate">{track.title}</span>
                              <span className="truncate text-xs text-foreground-muted">{track.album}</span>
                            </div>
                          ))}
                          {tracks.length > 50 && (
                            <p className="py-2 text-center text-xs text-foreground-subtle">
                              ...and {tracks.length - 50} more
                            </p>
                          )}
                        </div>

                        {importError && (
                          <p className="mt-4 text-sm text-error">{importError}</p>
                        )}

                        <button
                          onClick={handleImport}
                          disabled={tracks.length === 0}
                          className="mt-6 w-full rounded-lg bg-[#1DB954] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          Import {tracks.length} Songs
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Step 4: Importing */}
                {spotifyStep === "importing" && (
                  <div className="rounded-xl border border-border bg-surface p-6 text-center">
                    <div className="animate-pulse">
                      <p className="text-lg font-semibold">{importProgress}</p>
                      <p className="mt-2 text-sm text-foreground-muted">Please wait...</p>
                    </div>
                  </div>
                )}

                {/* Step 5: Done */}
                {spotifyStep === "done" && (
                  <div className="rounded-xl border border-border bg-surface p-6">
                    <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center">
                      <p className="text-lg font-semibold text-success">
                        Successfully imported {importedCount} songs!
                      </p>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Link
                        href={`/project/${projectId}/songs`}
                        className="flex-1 rounded-lg bg-accent py-3 text-center text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
                      >
                        View Songs
                      </Link>
                      <Link
                        href={`/project/${projectId}/battle`}
                        className="flex-1 rounded-lg border border-border py-3 text-center text-sm font-semibold text-foreground-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        Start Battling
                      </Link>
                    </div>

                    <button
                      onClick={resetSpotifyImport}
                      className="mt-4 w-full text-sm text-foreground-muted hover:text-foreground"
                    >
                      Import more songs
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Single Song Mode */}
        {mode === "single" && (
          <form
            onSubmit={handleSingleSubmit}
            className="animate-fade-slide-up stagger-2 mt-6 rounded-xl border border-border bg-surface p-6"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-foreground-muted">
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
                <label htmlFor="artist" className="mb-1.5 block text-sm font-medium text-foreground-muted">
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
                  <label htmlFor="album" className="mb-1.5 block text-sm font-medium text-foreground-muted">
                    Album <span className="text-foreground-subtle">(optional)</span>
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
                  <label htmlFor="year" className="mb-1.5 block text-sm font-medium text-foreground-muted">
                    Year <span className="text-foreground-subtle">(optional)</span>
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
              <p className="mt-3 text-sm text-error">{(addSong.error as Error).message}</p>
            )}

            {addSong.isSuccess && <p className="mt-3 text-sm text-success">Song added!</p>}

            <button
              type="submit"
              disabled={addSong.isPending || !title.trim() || !artist.trim()}
              className="mt-6 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {addSong.isPending ? "Adding..." : "Add Song"}
            </button>
          </form>
        )}

        {/* Bulk Paste Mode */}
        {mode === "bulk" && (
          <form
            onSubmit={handleBulkSubmit}
            className="animate-fade-slide-up stagger-2 mt-6 rounded-xl border border-border bg-surface p-6"
          >
            <p className="mb-4 text-sm text-foreground-muted">
              Paste a list of song titles, one per line. Numbering (e.g. &quot;1. Song Title&quot;) is stripped automatically.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="bulkArtist" className="mb-1.5 block text-sm font-medium text-foreground-muted">
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
                  <label htmlFor="bulkAlbum" className="mb-1.5 block text-sm font-medium text-foreground-muted">
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
                  <label htmlFor="bulkYear" className="mb-1.5 block text-sm font-medium text-foreground-muted">
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
                <label htmlFor="bulkText" className="mb-1.5 block text-sm font-medium text-foreground-muted">
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
              <p className="mt-3 text-sm text-error">{(addBatch.error as Error).message}</p>
            )}

            <button
              type="submit"
              disabled={addBatch.isPending || !bulkText.trim() || !bulkArtist.trim()}
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
