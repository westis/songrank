"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Battle, Song } from "@/lib/types";

const supabase = createClient();

export interface BattleHistoryEntry extends Battle {
  opponent: Song;
  result: "win" | "loss" | "draw";
}

export function useSongBattleHistory(
  projectId: string,
  songId: string | null
) {
  return useQuery<BattleHistoryEntry[]>({
    queryKey: ["song-battles", projectId, songId],
    queryFn: async () => {
      if (!songId) return [];

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch battles involving this song
      const { data: battles, error } = await supabase
        .from("battles")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .or(`song_a_id.eq.${songId},song_b_id.eq.${songId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!battles?.length) return [];

      // Collect all opponent IDs
      const opponentIds = new Set<string>();
      for (const b of battles) {
        opponentIds.add(b.song_a_id === songId ? b.song_b_id : b.song_a_id);
      }

      // Fetch opponent songs
      const { data: songs } = await supabase
        .from("songs")
        .select("*")
        .in("id", [...opponentIds]);

      const songMap = new Map<string, Song>();
      songs?.forEach((s) => songMap.set(s.id, s));

      return battles.map((b) => {
        const opponentId =
          b.song_a_id === songId ? b.song_b_id : b.song_a_id;
        const result: "win" | "loss" | "draw" =
          b.winner_id === null
            ? "draw"
            : b.winner_id === songId
              ? "win"
              : "loss";
        return {
          ...b,
          opponent: songMap.get(opponentId)!,
          result,
        };
      });
    },
    enabled: !!songId && !!projectId,
  });
}

export function useEditBattle(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      battleId,
      winnerId,
    }: {
      battleId: string;
      winnerId: string | null; // null = draw
    }) => {
      const { error } = await supabase
        .from("battles")
        .update({ winner_id: winnerId })
        .eq("id", battleId);

      if (error) throw error;

      // Trigger WHR recalculation by fetching and recomputing
      // This is handled by the caller invalidating queries
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["song-battles", projectId] });
      queryClient.invalidateQueries({ queryKey: ["rankings", projectId] });
    },
  });
}
