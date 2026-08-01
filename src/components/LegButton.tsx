"use client";

import { legColor } from "@/lib/oddsMath";

interface Props {
  playerName: string;
  x: number;
  impliedDecimal: number | null;
  actualDecimal: number | null;
  hitRate: number;
  adjustedHitRate: number;
  n: number;
  selected: boolean;
  onToggle: () => void;
}

export default function LegButton({
  playerName,
  x,
  impliedDecimal,
  actualDecimal,
  hitRate,
  adjustedHitRate,
  n,
  selected,
  onToggle,
}: Props) {
  const color = legColor(impliedDecimal, actualDecimal);

  const colorClasses = {
    green: "bg-green-600/20 border-green-500 hover:bg-green-600/30",
    red: "bg-brand/20 border-brand hover:bg-brand/30",
    neutral: "bg-surface-2 border-border hover:bg-surface",
  }[color];

  const hitRateNum = Math.round(hitRate * n);
  const adjHitRateNum = Math.round(adjustedHitRate * n);

  return (
    <button
      onClick={onToggle}
      className={`flex min-w-[150px] flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition
        ${colorClasses} ${selected ? "ring-2 ring-white" : ""}`}
    >
      <span className="text-sm font-medium text-text-muted">{playerName}</span>
      <span className="text-lg font-semibold">{x}+ disposals</span>
      <div className="flex w-full items-center justify-between text-sm">
        <span>Implied: {impliedDecimal ? impliedDecimal.toFixed(2) : "—"}</span>
        <span>Actual: {actualDecimal ? actualDecimal.toFixed(2) : "—"}</span>
      </div>
      <div className="flex gap-3 text-xs text-text-muted">
        <span>Hit rate {hitRateNum}/{n}</span>
        <span>Adj. {adjHitRateNum}/{n}</span>
      </div>
    </button>
  );
}