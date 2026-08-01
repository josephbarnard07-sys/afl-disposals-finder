"use client";

interface Leg {
  key: string;
  playerName: string;
  x: number;
  impliedDecimal: number;
}

interface Props {
  legs: Leg[];
  onRemove: (key: string) => void;
}

export default function BetSlip({ legs, onRemove }: Props) {
  if (legs.length === 0) return null;

  const combined = legs.reduce((acc, leg) => acc * leg.impliedDecimal, 1);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-2xl border border-border bg-surface p-4 shadow-2xl">
      <div className="mb-2 text-sm font-medium text-text-muted">
        {legs.length} leg{legs.length > 1 ? "s" : ""} selected
      </div>
      <ul className="mb-3 flex max-h-40 flex-col gap-1 overflow-y-auto text-sm">
        {legs.map((leg) => (
          <li key={leg.key} className="flex items-center justify-between">
            <span>{leg.playerName} {leg.x}+</span>
            <button onClick={() => onRemove(leg.key)} className="text-text-muted hover:text-brand">
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="text-sm text-text-muted">Combined (implied)</span>
        <span className="text-lg font-semibold text-brand">{combined.toFixed(2)}</span>
      </div>
    </div>
  );
}