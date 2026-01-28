import type { Confidence } from "./types";

const K_BASE = 32;

const CONFIDENCE_MULTIPLIERS: Record<Confidence, number> = {
  coin_flip: 0.5,
  slight: 0.8,
  clear: 1.0,
  obvious: 1.5,
};

/**
 * Calculate expected outcome for player A using logistic function.
 * Returns probability of A winning (0..1).
 */
function expectedOutcome(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Update Elo ratings after a battle.
 *
 * @param ratingA  Current rating of song A
 * @param ratingB  Current rating of song B
 * @param winner   "a" | "b" | "draw"
 * @param confidence  Confidence level of the decision
 * @returns New ratings for both songs
 */
export function updateEloRatings(
  ratingA: number,
  ratingB: number,
  winner: "a" | "b" | "draw",
  confidence: Confidence = "clear"
): { newRatingA: number; newRatingB: number } {
  const expectedA = expectedOutcome(ratingA, ratingB);
  const expectedB = 1 - expectedA;

  let actualA: number;
  let actualB: number;

  if (winner === "a") {
    actualA = 1;
    actualB = 0;
  } else if (winner === "b") {
    actualA = 0;
    actualB = 1;
  } else {
    // draw
    actualA = 0.5;
    actualB = 0.5;
  }

  const k = K_BASE * CONFIDENCE_MULTIPLIERS[confidence];

  const newRatingA = ratingA + k * (actualA - expectedA);
  const newRatingB = ratingB + k * (actualB - expectedB);

  return {
    newRatingA: Math.round(newRatingA * 10) / 10,
    newRatingB: Math.round(newRatingB * 10) / 10,
  };
}

/**
 * Reduce Rating Deviation (RD) after a battle.
 * RD decreases as more battles are played, converging toward a minimum.
 */
export function updateRD(currentRD: number): number {
  const MIN_RD = 50;
  const DECAY = 0.95;
  return Math.max(MIN_RD, currentRD * DECAY);
}
