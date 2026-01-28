"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { computeWHR } from "@/lib/whr";
import type { Song, Confidence, Rating, BattleScope } from "@/lib/types";

const supabase = createClient();

interface BattleState {
  songA: Song | null;
  songB: Song | null;
  ratingA: Rating | null;
  ratingB: Rating | null;
  battleCount: number;
  lastBattleId: string | null;
  poolSize: number;
  totalPairs: number;
  completedPairs: number;
}

export function useBattle(projectId: string, scope?: BattleScope) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BattleState>({
    songA: null,
    songB: null,
    ratingA: null,
    ratingB: null,
    battleCount: 0,
    lastBattleId: null,
    poolSize: 0,
    totalPairs: 0,
    completedPairs: 0,
  });
  const [loading, setLoading] = useState(false);

  // Keep scope in a ref so loadNextPair always reads latest
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  const loadNextPair = useCallback(async () => {
    setLoading(true);
    try {
      const currentScope = scopeRef.current;

      // Get all songs for this project
      const { data: allSongs, error: songsError } = await supabase
        .from("songs")
        .select("*")
        .eq("project_id", projectId);

      if (songsError) throw songsError;
      if (!allSongs || allSongs.length < 2) {
        setState((s) => ({ ...s, songA: null, songB: null }));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get ratings for weighting
      const { data: ratings } = await supabase
        .from("ratings")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id);

      const ratingsMap = new Map<string, Rating>();
      ratings?.forEach((r) => ratingsMap.set(r.song_id, r));

      // Apply scope filter
      let pool = allSongs;
      let crossAlbumMode = false;
      let poolA: Song[] = [];
      let poolB: Song[] = [];

      if (currentScope?.type === "album" && currentScope.album) {
        pool = pool.filter((s) => s.album === currentScope.album);
      } else if (
        currentScope?.type === "cross_album" &&
        currentScope.albumA &&
        currentScope.albumB
      ) {
        crossAlbumMode = true;
        poolA = allSongs.filter((s) => s.album === currentScope.albumA);
        poolB = allSongs.filter((s) => s.album === currentScope.albumB);

        // If topN is set, limit to top-rated from each album
        if (currentScope.topN) {
          const sortByRating = (songs: Song[]) =>
            songs
              .map((s) => ({
                song: s,
                r: ratingsMap.get(s.id)?.rating ?? 1500,
              }))
              .sort((a, b) => b.r - a.r)
              .slice(0, currentScope.topN)
              .map((x) => x.song);
          poolA = sortByRating(poolA);
          poolB = sortByRating(poolB);
        }

        pool = [...poolA, ...poolB];
      }

      if (pool.length < 2) {
        setState((s) => ({
          ...s,
          songA: null,
          songB: null,
          poolSize: pool.length,
          totalPairs: 0,
          completedPairs: 0,
        }));
        return;
      }

      // Also need at least 1 song in each pool for cross-album
      if (crossAlbumMode && (poolA.length === 0 || poolB.length === 0)) {
        setState((s) => ({
          ...s,
          songA: null,
          songB: null,
          poolSize: 0,
          totalPairs: 0,
          completedPairs: 0,
        }));
        return;
      }

      // Compute pool stats
      const poolSize = pool.length;
      const totalPairs = crossAlbumMode
        ? poolA.length * poolB.length
        : (poolSize * (poolSize - 1)) / 2;

      // Count completed unique pairs within scope
      const { data: battles } = await supabase
        .from("battles")
        .select("song_a_id, song_b_id")
        .eq("project_id", projectId)
        .eq("user_id", user.id);

      const pairSet = new Set<string>();
      if (crossAlbumMode) {
        const poolAIds = new Set(poolA.map((s) => s.id));
        const poolBIds = new Set(poolB.map((s) => s.id));
        for (const b of battles ?? []) {
          const crossAB =
            poolAIds.has(b.song_a_id) && poolBIds.has(b.song_b_id);
          const crossBA =
            poolBIds.has(b.song_a_id) && poolAIds.has(b.song_b_id);
          if (crossAB || crossBA) {
            const pair = [b.song_a_id, b.song_b_id].sort().join("|");
            pairSet.add(pair);
          }
        }
      } else {
        const poolIds = new Set(pool.map((s) => s.id));
        for (const b of battles ?? []) {
          if (poolIds.has(b.song_a_id) && poolIds.has(b.song_b_id)) {
            const pair = [b.song_a_id, b.song_b_id].sort().join("|");
            pairSet.add(pair);
          }
        }
      }
      const completedPairs = pairSet.size;

      let songA: Song;
      let songB: Song;

      if (crossAlbumMode) {
        // Round-robin: every A×B pair exactly once
        // Generate all possible cross-album pairs
        const allCrossPairs: [Song, Song][] = [];
        for (const a of poolA) {
          for (const b of poolB) {
            allCrossPairs.push([a, b]);
          }
        }
        // Filter to unplayed pairs
        const unplayed = allCrossPairs.filter(([a, b]) => {
          const pair = [a.id, b.id].sort().join("|");
          return !pairSet.has(pair);
        });

        if (unplayed.length === 0) {
          // All pairs done — show completion
          setState((s) => ({
            ...s,
            songA: null,
            songB: null,
            poolSize,
            totalPairs,
            completedPairs,
          }));
          return;
        }

        // Pick a random unplayed pair
        const [pickedA, pickedB] =
          unplayed[Math.floor(Math.random() * unplayed.length)];
        songA = pickedA;
        songB = pickedB;
      } else {
        // Normal: RD-weighted random pick
        const weights = pool.map((s) => ratingsMap.get(s.id)?.rd ?? 350);
        songA = weightedPick(pool, weights);
        const remaining = pool.filter((s) => s.id !== songA.id);
        const remainingWeights = remaining.map(
          (s) => ratingsMap.get(s.id)?.rd ?? 350
        );
        songB = weightedPick(remaining, remainingWeights);
      }

      setState((s) => ({
        ...s,
        songA,
        songB,
        ratingA: ratingsMap.get(songA.id) || null,
        ratingB: ratingsMap.get(songB.id) || null,
        poolSize,
        totalPairs,
        completedPairs,
      }));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Auto-load on mount and when scope changes
  const scopeKey = JSON.stringify(scope || { type: "all" });
  useEffect(() => {
    loadNextPair();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadNextPair, scopeKey]);

  const selectWinner = useMutation({
    mutationFn: async ({
      winnerId,
      confidence = "obvious",
    }: {
      winnerId: string | null; // null = draw
      confidence?: Confidence;
    }) => {
      const { songA, songB } = state;
      if (!songA || !songB) throw new Error("No battle in progress");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Save battle
      const { data: battle, error: battleError } = await supabase
        .from("battles")
        .insert({
          project_id: projectId,
          user_id: user.id,
          song_a_id: songA.id,
          song_b_id: songB.id,
          winner_id: winnerId,
          confidence,
        })
        .select()
        .single();

      if (battleError) throw battleError;

      // 2. Run WHR on full battle history → updates all ratings
      await runWHR(projectId, user.id);

      setState((s) => ({
        ...s,
        battleCount: s.battleCount + 1,
        lastBattleId: battle.id,
      }));

      return { battle };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rankings", projectId] });
      loadNextPair();
    },
  });

  const undoLastBattle = useMutation({
    mutationFn: async () => {
      if (!state.lastBattleId) throw new Error("No battle to undo");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: deleteError } = await supabase
        .from("battles")
        .delete()
        .eq("id", state.lastBattleId);

      if (deleteError) throw deleteError;

      // Re-run WHR without the deleted battle
      await runWHR(projectId, user.id);

      setState((s) => ({
        ...s,
        battleCount: Math.max(0, s.battleCount - 1),
        lastBattleId: null,
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rankings", projectId] });
      loadNextPair();
    },
  });

  return {
    ...state,
    loading,
    loadNextPair,
    selectWinner,
    undoLastBattle,
  };
}

/**
 * Run WHR on all battles for this project/user and upsert all ratings.
 */
async function runWHR(projectId: string, userId: string) {
  // Fetch all battles
  const { data: battles } = await supabase
    .from("battles")
    .select("song_a_id, song_b_id, winner_id, confidence, created_at")
    .eq("project_id", projectId)
    .eq("user_id", userId);

  // Fetch all song IDs
  const { data: songs } = await supabase
    .from("songs")
    .select("id")
    .eq("project_id", projectId);

  if (!songs?.length) return;

  const songIds = songs.map((s) => s.id);
  const results = computeWHR(battles ?? [], songIds);

  // Count battles per song
  const battleCounts = new Map<string, number>();
  for (const b of battles ?? []) {
    battleCounts.set(b.song_a_id, (battleCounts.get(b.song_a_id) ?? 0) + 1);
    battleCounts.set(b.song_b_id, (battleCounts.get(b.song_b_id) ?? 0) + 1);
  }

  // Find last battle timestamp per song
  const lastBattleAt = new Map<string, string>();
  for (const b of battles ?? []) {
    for (const sid of [b.song_a_id, b.song_b_id]) {
      const existing = lastBattleAt.get(sid);
      if (!existing || b.created_at > existing) {
        lastBattleAt.set(sid, b.created_at);
      }
    }
  }

  // Batch upsert all ratings
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

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
