"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Song } from "@/lib/types";

const supabase = createClient();

export function useSongs(projectId: string) {
  return useQuery<Song[]>({
    queryKey: ["songs", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("project_id", projectId)
        .order("artist")
        .order("album")
        .order("track_number");

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useSongCount(projectId: string) {
  return useQuery<number>({
    queryKey: ["songs", projectId, "count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!projectId,
  });
}

export function useAddSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (song: {
      project_id: string;
      title: string;
      artist: string;
      album?: string;
      year?: number;
      duration_ms?: number;
      spotify_uri?: string;
      spotify_id?: string;
      track_number?: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // For manual entry, generate placeholder spotify fields
      const spotifyId = song.spotify_id || `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const { data, error } = await supabase
        .from("songs")
        .insert({
          project_id: song.project_id,
          title: song.title,
          artist: song.artist,
          album: song.album || null,
          year: song.year || null,
          duration_ms: song.duration_ms || null,
          spotify_uri: song.spotify_uri || `manual:track:${spotifyId}`,
          spotify_id: spotifyId,
          track_number: song.track_number || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial rating for this song
      await supabase.from("ratings").insert({
        project_id: song.project_id,
        song_id: data.id,
        user_id: user.id,
        rating: 1500,
        rd: 350,
        battle_count: 0,
        algorithm: "whr",
      });

      return data as Song;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["songs", variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });
}

export function useAddSongsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      songs,
    }: {
      projectId: string;
      songs: Array<{
        title: string;
        artist: string;
        album?: string;
        year?: number;
        track_number?: number;
      }>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const songRows = songs.map((s, i) => {
        const spotifyId = `manual_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`;
        return {
          project_id: projectId,
          title: s.title,
          artist: s.artist,
          album: s.album || null,
          year: s.year || null,
          spotify_uri: `manual:track:${spotifyId}`,
          spotify_id: spotifyId,
          track_number: s.track_number || null,
        };
      });

      const { data, error } = await supabase
        .from("songs")
        .insert(songRows)
        .select();

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      // Create initial ratings for all inserted songs
      const ratingRows = data.map((song) => ({
        project_id: projectId,
        song_id: song.id,
        user_id: user.id,
        rating: 1500,
        rd: 350,
        battle_count: 0,
        algorithm: "whr",
      }));

      const { error: ratingsError } = await supabase
        .from("ratings")
        .insert(ratingRows);

      if (ratingsError) throw ratingsError;

      return data as Song[];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["songs", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });
}

export function useUpdateSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      songId,
      projectId,
      updates,
    }: {
      songId: string;
      projectId: string;
      updates: {
        title?: string;
        artist?: string;
        album?: string | null;
        year?: number | null;
        track_number?: number | null;
      };
    }) => {
      const { data, error } = await supabase
        .from("songs")
        .update(updates)
        .eq("id", songId)
        .select()
        .single();

      if (error) throw error;
      return { song: data as Song, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["songs", projectId] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["albums", projectId] });
    },
  });
}

export function useDeleteSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ songId, projectId }: { songId: string; projectId: string }) => {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", songId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["songs", projectId] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["albums", projectId] });
    },
  });
}

export function useDeleteAlbumSongs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      album,
    }: {
      projectId: string;
      album: string;
    }) => {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("project_id", projectId)
        .eq("album", album);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["songs", projectId] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["albums", projectId] });
    },
  });
}
