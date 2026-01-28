import type { Song } from "./types";

/**
 * Select a random pair of songs for a quick battle.
 * Weights selection toward songs with fewer battles (higher RD).
 */
export function selectRandomPair(
  songs: Song[],
  ratingsBysongId?: Map<string, { rd: number; battle_count: number }>
): { songA: Song; songB: Song } | null {
  if (songs.length < 2) return null;

  if (!ratingsBysongId) {
    // Pure random selection
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    return { songA: shuffled[0], songB: shuffled[1] };
  }

  // Weight by RD -- higher RD means less certain, should battle more
  const weights = songs.map((song) => {
    const rating = ratingsBysongId.get(song.id);
    return rating ? rating.rd : 350; // default RD for unrated
  });

  const songA = weightedRandomPick(songs, weights);
  // Remove picked song and select second
  const remaining = songs.filter((s) => s.id !== songA.id);
  const remainingWeights = remaining.map((song) => {
    const rating = ratingsBysongId.get(song.id);
    return rating ? rating.rd : 350;
  });
  const songB = weightedRandomPick(remaining, remainingWeights);

  return { songA, songB };
}

function weightedRandomPick<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }

  return items[items.length - 1];
}
