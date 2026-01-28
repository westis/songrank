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

  // Song A options (reversed so strongest is on the outside)
  const songAOptions = [...options].reverse();
  // Song B options (strongest on outside)
  const songBOptions = [...options].reverse();

  return (
    <div className="space-y-2">
      {/* Labels */}
      <div className="flex justify-between text-xs text-foreground-muted">
        <span className="truncate max-w-[40%]">&larr; {songATitle}</span>
        <span className="truncate max-w-[40%]">{songBTitle} &rarr;</span>
      </div>

      {/* Decision bar */}
      <div className="flex h-12 overflow-hidden rounded-xl border border-border bg-surface">
        {/* Song A wins - left side */}
        {songAOptions.map((opt, i) => (
          <button
            key={`a-${opt.value}`}
            onClick={() => onDecision("a", opt.value)}
            disabled={disabled}
            className={`flex-1 border-r border-border text-xs font-medium transition-all hover:bg-accent/20 hover:text-accent disabled:pointer-events-none disabled:opacity-50 ${
              i === 0 ? "bg-accent/10 text-accent" : "text-foreground-muted"
            }`}
            title={`${songATitle}: ${opt.label}`}
          >
            <span className="hidden sm:inline">{opt.shortLabel}</span>
            <span className="sm:hidden">{opt.shortLabel.charAt(0)}</span>
          </button>
        ))}

        {/* Draw option - center */}
        {allowDraws && (
          <button
            onClick={() => onDecision(null, "slight")}
            disabled={disabled}
            className="flex-1 border-r border-border bg-surface-raised text-xs font-medium text-foreground-subtle transition-all hover:bg-foreground-subtle/20 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            title="Draw - too close to call"
          >
            =
          </button>
        )}

        {/* Song B wins - right side */}
        {songBOptions.map((opt, i) => (
          <button
            key={`b-${opt.value}`}
            onClick={() => onDecision("b", opt.value)}
            disabled={disabled}
            className={`flex-1 text-xs font-medium transition-all hover:bg-accent/20 hover:text-accent disabled:pointer-events-none disabled:opacity-50 ${
              i === songBOptions.length - 1 ? "border-r-0" : "border-r border-border"
            } ${
              i === songBOptions.length - 1 ? "bg-accent/10 text-accent" : "text-foreground-muted"
            }`}
            title={`${songBTitle}: ${opt.label}`}
          >
            <span className="hidden sm:inline">{opt.shortLabel}</span>
            <span className="sm:hidden">{opt.shortLabel.charAt(0)}</span>
          </button>
        ))}
      </div>

      {/* Keyboard hints */}
      <p className="text-center text-[10px] text-foreground-subtle">
        {songAOptions.map((_, i) => i + 1).join(" ")}
        {allowDraws && ` ${songAOptions.length + 1}`}
        {" "}
        {songBOptions.map((_, i) => songAOptions.length + (allowDraws ? 2 : 1) + i).join(" ")}
        {" = keyboard shortcuts"}
      </p>
    </div>
  );
}
