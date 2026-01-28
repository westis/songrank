/**
 * Whole-History Rating (WHR) algorithm implementation.
 *
 * Based on the Bradley-Terry model with maximum likelihood estimation
 * via Newton's method. Computes ratings from the full battle history.
 *
 * Confidence levels affect the effective outcome score for the winner:
 *   obvious   → 1.0  (full win, no doubt)
 *   clear     → 0.85
 *   slight    → 0.7
 *   coin_flip → 0.55 (barely better, almost a draw)
 *   draw      → 0.5
 */

interface BattleRecord {
  song_a_id: string;
  song_b_id: string;
  winner_id: string | null; // null = draw
  confidence: string | null;
}

export interface WHRResult {
  rating: number; // Elo-scale (1500 center)
  rd: number; // Rating deviation (uncertainty)
}

// Confidence → effective score for the winner
const CONFIDENCE_SCORES: Record<string, number> = {
  obvious: 1.0,
  clear: 0.85,
  slight: 0.7,
  coin_flip: 0.55,
};

const ITERATIONS = 15;
// Prior variance on natural log scale.
// Chosen so that unbattled songs get RD ≈ 350:
//   RD = sqrt(σ²) × 400/ln(10)  →  σ² ≈ 4.0 gives RD ≈ 347
const PRIOR_VARIANCE = 4.0;

/**
 * Compute WHR ratings for all songs from the full battle history.
 *
 * @param battles  All battles for this project/user
 * @param songIds  All song IDs in the project
 * @returns Map from songId → { rating, rd }
 */
export function computeWHR(
  battles: BattleRecord[],
  songIds: string[]
): Map<string, WHRResult> {
  const n = songIds.length;
  if (n === 0) return new Map();

  const idToIndex = new Map<string, number>();
  songIds.forEach((id, i) => idToIndex.set(id, i));

  // Pre-compute per-song battle lists for efficiency
  const songBattles: { battle: BattleRecord; isA: boolean }[][] = Array.from(
    { length: n },
    () => []
  );
  for (const battle of battles) {
    const aIdx = idToIndex.get(battle.song_a_id);
    const bIdx = idToIndex.get(battle.song_b_id);
    if (aIdx !== undefined) songBattles[aIdx].push({ battle, isA: true });
    if (bIdx !== undefined) songBattles[bIdx].push({ battle, isA: false });
  }

  // Natural log scale ratings (0 = Elo 1500)
  const ratings = new Float64Array(n);

  // Newton's method iterations
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < n; i++) {
      if (songBattles[i].length === 0) continue; // skip unbattled songs

      let gradient = 0;
      let hessian = 0;

      // Gaussian prior centered at 0
      gradient -= ratings[i] / PRIOR_VARIANCE;
      hessian -= 1 / PRIOR_VARIANCE;

      for (const { battle, isA } of songBattles[i]) {
        const opponentIdx = isA
          ? idToIndex.get(battle.song_b_id)!
          : idToIndex.get(battle.song_a_id)!;
        const opponentRating = ratings[opponentIdx];

        // Expected probability that song i wins
        const diff = ratings[i] - opponentRating;
        const expected = 1 / (1 + Math.exp(-diff));

        // Actual outcome for song i
        let actual: number;
        if (battle.winner_id === null) {
          // Draw
          actual = 0.5;
        } else {
          const iWon = isA
            ? battle.winner_id === battle.song_a_id
            : battle.winner_id === battle.song_b_id;
          const score =
            CONFIDENCE_SCORES[battle.confidence ?? "obvious"] ?? 1.0;
          actual = iWon ? score : 1 - score;
        }

        gradient += actual - expected;
        hessian -= expected * (1 - expected);
      }

      // Newton update: r_new = r - gradient / hessian
      // (hessian is always negative → this moves r in the right direction)
      if (hessian !== 0) {
        ratings[i] -= gradient / hessian;
      }
    }
  }

  // Convert to Elo scale and compute RD from inverse Hessian
  const results = new Map<string, WHRResult>();
  const ELO_SCALE = 400 / Math.LN10; // ≈ 173.7

  for (let i = 0; i < n; i++) {
    const eloRating = 1500 + ratings[i] * ELO_SCALE;

    // Recompute Hessian at converged rating for uncertainty estimate
    let hessian = -1 / PRIOR_VARIANCE;
    for (const { battle, isA } of songBattles[i]) {
      const opponentIdx = isA
        ? idToIndex.get(battle.song_b_id)!
        : idToIndex.get(battle.song_a_id)!;
      const diff = ratings[i] - ratings[opponentIdx];
      const expected = 1 / (1 + Math.exp(-diff));
      hessian -= expected * (1 - expected);
    }

    // Variance = -1/hessian, RD = sqrt(variance) on Elo scale
    const variance = -1 / hessian;
    const rd = Math.sqrt(variance) * ELO_SCALE;

    results.set(songIds[i], {
      rating: Math.round(eloRating),
      rd: Math.round(rd),
    });
  }

  return results;
}
