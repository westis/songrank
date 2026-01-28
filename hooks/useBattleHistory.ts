"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { BattleWithSongs } from "@/lib/types";

const supabase = createClient();

export function useBattleHistory(projectId: string, limit = 50) {
  return useQuery<BattleWithSongs[]>({
    queryKey: ["battles", projectId, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("battles")
        .select(`
          *,
          song_a:songs!battles_song_a_id_fkey(*),
          song_b:songs!battles_song_b_id_fkey(*)
        `)
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as BattleWithSongs[];
    },
    enabled: !!projectId,
  });
}

export function useDeleteBattle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ battleId, projectId }: { battleId: string; projectId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("battles")
        .delete()
        .eq("id", battleId)
        .eq("user_id", user.id); // Ensure user can only delete their own battles

      if (error) throw error;

      // Re-run WHR after deleting a battle
      await runWHR(projectId, user.id);

      return { battleId };
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["battles", projectId] });
      queryClient.invalidateQueries({ queryKey: ["rankings", projectId] });
    },
  });
}

export function useClearAllBattles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("battles")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Reset all ratings to default
      const { data: songs } = await supabase
        .from("songs")
        .select("id")
        .eq("project_id", projectId);

      if (songs?.length) {
        const now = new Date().toISOString();
        const rows = songs.map((s) => ({
          project_id: projectId,
          song_id: s.id,
          user_id: user.id,
          rating: 1500,
          rd: 350,
          battle_count: 0,
          algorithm: "whr" as const,
          computed_at: now,
          last_battle_at: null,
        }));

        await supabase
          .from("ratings")
          .upsert(rows, { onConflict: "project_id,song_id,user_id" });
      }

      return { projectId };
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["battles", projectId] });
      queryClient.invalidateQueries({ queryKey: ["rankings", projectId] });
    },
  });
}

// Re-run WHR on all battles
async function runWHR(projectId: string, userId: string) {
  // Import dynamically to avoid circular deps
  const { computeWHR } = await import("@/lib/whr");

  const { data: battles } = await supabase
    .from("battles")
    .select("song_a_id, song_b_id, winner_id, confidence, created_at")
    .eq("project_id", projectId)
    .eq("user_id", userId);

  const { data: songs } = await supabase
    .from("songs")
    .select("id")
    .eq("project_id", projectId);

  if (!songs?.length) return;

  const songIds = songs.map((s) => s.id);
  const results = computeWHR(battles ?? [], songIds);

  const battleCounts = new Map<string, number>();
  for (const b of battles ?? []) {
    battleCounts.set(b.song_a_id, (battleCounts.get(b.song_a_id) ?? 0) + 1);
    battleCounts.set(b.song_b_id, (battleCounts.get(b.song_b_id) ?? 0) + 1);
  }

  const lastBattleAt = new Map<string, string>();
  for (const b of battles ?? []) {
    for (const sid of [b.song_a_id, b.song_b_id]) {
      const existing = lastBattleAt.get(sid);
      if (!existing || b.created_at > existing) {
        lastBattleAt.set(sid, b.created_at);
      }
    }
  }

  const now = new Date().toISOString();
  const rows = songIds.map((songId) => {
    const result = results.get(songId) ?? { rating: 1500, rd: 350 };
    return {
      project_id: projectId,
      song_id: songId,
      user_id: userId,
      rating: result.rating,
      rd: result.rd,
      battle_count: battleCounts.get(songId) ?? 0,
      algorithm: "whr" as const,
      computed_at: now,
      last_battle_at: lastBattleAt.get(songId) ?? null,
    };
  });

  await supabase
    .from("ratings")
    .upsert(rows, { onConflict: "project_id,song_id,user_id" });
}
