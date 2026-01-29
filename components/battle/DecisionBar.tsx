"use client";

import type { Confidence } from "@/lib/types";

interface DecisionBarProps {
  songATitle: string;
  songBTitle: string;
  confidenceLevels: number; // 2, 3, or 4
  allowDraws: boolean;
  onDecision: (winnerId: "a" | "b" | null, confidence: Confidence) => void;
  disabled?: boolean;
}

// Confidence options by level count (for one side)
// Order: strongest to weakest (for left side, reading left-to-right)
function getConfidenceOptionsForLevel(levels: number): { value: Confidence; label: string; shortLabel: string }[] {
  switch (levels) {
    case 2:
      return [
        { value: "obvious", label: "Clear win", shortLabel: "Clear" },
        { value: "slight", label: "Slight edge", shortLabel: "Slight" },
      ];
    case 3:
      return [
        { value: "obvious", label: "Clear win", shortLabel: "Clear" },
        { value: "clear", label: "Moderate", shortLabel: "Mod" },
        { value: "slight", label: "Slight edge", shortLabel: "Slight" },
      ];
    case 4:
      return [
        { value: "obvious", label: "No contest", shortLabel: "Obvious" },
        { value: "clear", label: "Clear win", shortLabel: "Clear" },
        { value: "slight", label: "Slight edge", shortLabel: "Slight" },
        { value: "coin_flip", label: "Coin flip", shortLabel: "~" },
      ];
    default:
      return [];
  }
}

export default function DecisionBar({
  songATitle,
  songBTitle,
  confidenceLevels,
  allowDraws,
  onDecision,
  disabled = false,
}: DecisionBarProps) {
  const options = getConfidenceOptionsForLevel(confidenceLevels);

  // Song A options: strongest on left edge, weakest near center
  // No reverse needed - options are already [strongest, ..., weakest]
  const songAOptions = options;

  // Song B options: weakest near center, strongest on right edge
  // Reverse so weakest is first (near center)
  const songBOptions = [...options].reverse();

  // Calculate key numbers
  const drawKeyNum = confidenceLevels + 1;
  const songBStartKey = allowDraws ? confidenceLevels + 2 : confidenceLevels + 1;

  return (
    <div className="space-y-1">
      {/* Labels */}
      <div className="flex justify-between text-xs text-foreground-muted">
        <span className="truncate max-w-[40%]">&larr; {songATitle}</span>
        <span className="truncate max-w-[40%]">{songBTitle} &rarr;</span>
      </div>

      {/* Decision bar */}
      <div className="flex h-14 sm:h-16 overflow-hidden rounded-xl border border-border bg-surface">
        {/* Song A wins - left side */}
        {songAOptions.map((opt, i) => {
          const keyNum = i + 1;
          return (
            <button
              key={`a-${opt.value}`}
              onClick={() => onDecision("a", opt.value)}
              disabled={disabled}
              className={`flex-1 flex flex-col items-center justify-center border-r border-border text-sm font-medium transition-all hover:bg-accent/20 hover:text-accent active:bg-accent/30 disabled:pointer-events-none disabled:opacity-50 ${
                i === 0 ? "bg-accent/10 text-accent" : "text-foreground-muted"
              }`}
              title={`${songATitle}: ${opt.label} (key ${keyNum})`}
            >
              <span>{opt.shortLabel}</span>
              <span className="text-[10px] opacity-40 hidden sm:inline">({keyNum})</span>
            </button>
          );
        })}

        {/* Draw option - center */}
        {allowDraws && (
          <button
            onClick={() => onDecision(null, "slight")}
            disabled={disabled}
            className="w-12 sm:w-14 shrink-0 flex flex-col items-center justify-center border-r border-border bg-surface-raised text-sm font-medium text-foreground-subtle transition-all hover:bg-foreground-subtle/20 hover:text-foreground active:bg-foreground-subtle/30 disabled:pointer-events-none disabled:opacity-50"
            title={`Draw - too close to call (key ${drawKeyNum})`}
          >
            <span>=</span>
            <span className="text-[10px] opacity-40 hidden sm:inline">({drawKeyNum})</span>
          </button>
        )}

        {/* Song B wins - right side */}
        {songBOptions.map((opt, i) => {
          const keyNum = songBStartKey + i;
          return (
            <button
              key={`b-${opt.value}`}
              onClick={() => onDecision("b", opt.value)}
              disabled={disabled}
              className={`flex-1 flex flex-col items-center justify-center text-sm font-medium transition-all hover:bg-accent/20 hover:text-accent active:bg-accent/30 disabled:pointer-events-none disabled:opacity-50 ${
                i === songBOptions.length - 1 ? "border-r-0" : "border-r border-border"
              } ${
                i === songBOptions.length - 1 ? "bg-accent/10 text-accent" : "text-foreground-muted"
              }`}
              title={`${songBTitle}: ${opt.label} (key ${keyNum})`}
            >
              <span>{opt.shortLabel}</span>
              <span className="text-[10px] opacity-40 hidden sm:inline">({keyNum})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
