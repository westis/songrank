-- Add confidence_levels column to projects table
-- Controls how many tiers of certainty are available during battles:
--   1 = Win/Draw only (default)
--   2 = Clear / Slight / Draw
--   3 = Clear / Moderate / Slight / Draw
--   4 = Obvious / Clear / Slight / Coin-flip / Draw
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS confidence_levels integer NOT NULL DEFAULT 1
  CHECK (confidence_levels BETWEEN 1 AND 4);
