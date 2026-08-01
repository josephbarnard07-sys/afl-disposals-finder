"use client";

const BOOKMAKERS = [
  "betr",
  "betright",
  "ladbrokes_au",
  "neds",
  "playup",
  "pointsbetau",
  "sportsbet",
  "tab",
  "unibet",
];

export type OddsMode =
  | { type: "single"; bookmaker: string }
  | { type: "best"; among?: string[] };

interface Props {
  mode: OddsMode;
  onChange: (mode: OddsMode) => void;
}

export default function BookmakerSelector({ mode, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3">
      <select
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
        value={mode.type === "single" ? mode.bookmaker : mode.type === "best" && !mode.among ? "best-all" : "best-some"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "best-all") onChange({ type: "best" });
          else if (v === "best-some") onChange({ type: "best", among: BOOKMAKERS.slice(0, 3) });
          else onChange({ type: "single", bookmaker: v });
        }}
      >
        <option value="best-all">Best odds — all bookmakers</option>
        <option value="best-some">Best odds — selected bookmakers</option>
        {BOOKMAKERS.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      {mode.type === "best" && mode.among && (
        <div className="flex flex-wrap gap-2">
          {BOOKMAKERS.map((b) => {
            const active = mode.among!.includes(b);
            return (
              <button
                key={b}
                onClick={() =>
                  onChange({
                    type: "best",
                    among: active
                      ? mode.among!.filter((x) => x !== b)
                      : [...mode.among!, b],
                  })
                }
                className={`rounded-full border px-3 py-1 text-xs ${
                  active ? "border-brand bg-brand/20" : "border-border bg-surface-2"
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}