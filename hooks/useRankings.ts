"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SongWithRating } from "@/lib/types";

const supabase = createClient();

interface RankingsFilters {
  album?: string;
  minBattles?: number;
  search?: string;
  userId?: string; // specific user, or omit for current user
}

export function useRankings(projectId: string, filters?: RankingsFilters) {
  return useQuery<SongWithRating[]>({
    queryKey: ["rankings", projectId, filters],
    queryFn: async () => {
      const targetUserId = filters?.userId;

      // If no explicit userId, use the current user
      let userId = targetUserId;
      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        userId = user.id;
      }

      // Fetch songs
      const { data: songs, error: songsError } = await supabase
        .from("songs")
        .select("*")
        .eq("project_id", projectId);

      if (songsError) throw songsError;

      // Fetch ratings for the target user
      const { data: ratings, error: ratingsError } = await supabase
        .from("ratings")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (ratingsError) throw ratingsError;

      const ratingsMap = new Map(
        ratings?.map((r) => [r.song_id, r]) ?? []
      );

      let ranked: SongWithRating[] = (songs ?? []).map((song) => {
        const rating = ratingsMap.get(song.id);
        return {
          ...song,
          rating: rating?.rating ?? 1500,
          rd: rating?.rd ?? 350,
          battle_count: rating?.battle_count ?? 0,
          algorithm: rating?.algorithm ?? "whr",
          last_battle_at: rating?.last_battle_at ?? null,
        };
      });

      // Apply filters
      if (filters?.album) {
        ranked = ranked.filter((s) => s.album === filters.album);
      }
      if (filters?.minBattles !== undefined && filters.minBattles > 0) {
        ranked = ranked.filter((s) => s.battle_count >= filters.minBattles!);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        ranked = ranked.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.artist.toLowerCase().includes(q) ||
            (s.album && s.album.toLowerCase().includes(q))
        );
      }

      // Sort by rating descending
      ranked.sort((a, b) => b.rating - a.rating);

      return ranked;
    },
    enabled: !!projectId,
  });
}

export function useAlbums(projectId: string) {
  return useQuery<string[]>({
    queryKey: ["albums", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("album, year")
        .eq("project_id", projectId)
        .not("album", "is", null);

      if (error) throw error;

      // Deduplicate by album name, keep earliest year per album
      const albumMap = new Map<string, number>();
      for (const s of data ?? []) {
        if (!s.album) continue;
        const existing = albumMap.get(s.album);
        if (existing === undefined || (s.year != null && s.year < existing)) {
          albumMap.set(s.album, s.year ?? 9999);
        }
      }

      return [...albumMap.entries()]
        .sort((a, b) => a[1] - b[1])
        .map(([name]) => name);
    },
    enabled: !!projectId,
  });
}
