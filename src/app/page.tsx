"use client";

import { useEffect, useState } from "react";
import LegButton from "@/components/LegButton";
import BookmakerSelector, { OddsMode } from "@/components/BookmakerSelector";
import BetSlip from "@/components/BetSlip";
import { impliedToDecimal, pickBookmakerPrice } from "@/lib/oddsMath";

interface GamesResponse {
  games: {
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
    players: {
      playerId: number;
      playerName: string;
      projection: {
        n: number;
        e: number;
        p: number;
        a: number;
        lines: { x: number; impliedOdds: number; hitRate: number; adjustedHitRate: number }[];
      };
      bookmakerOdds: { bookmaker: string; line: number; overPrice: number | null; underPrice: number | null }[];
    }[];
  }[];
  lastOddsSync: string | null;
}

export default function Home() {
  const [data, setData] = useState<GamesResponse | null>(null);
  const [mode, setMode] = useState<OddsMode>({ type: "best" });
  const [selected, setSelected] = useState<Record<string, { playerName: string; x: number; impliedDecimal: number }>>({});
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const res = await fetch("/api/games");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function manualRefresh() {
    setRefreshing(true);
    await fetch("/api/odds/refresh", { method: "POST" });
    await load();
    setRefreshing(false);
  }

  function toggleLeg(key: string, playerName: string, x: number, impliedDecimal: number | null) {
    if (impliedDecimal === null) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { playerName, x, impliedDecimal };
      return next;
    });
  }

  if (!data) return <div className="p-8 text-text-muted">Loading…</div>;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Disposals Value Finder</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">
            Odds last updated: {data.lastOddsSync ? new Date(data.lastOddsSync).toLocaleString() : "never"}
          </span>
          <button
            onClick={manualRefresh}
            disabled={refreshing}
            className="rounded-lg border border-brand bg-brand/20 px-3 py-2 text-sm hover:bg-brand/30 disabled:opacity-50"
          >
            {refreshing ? "Updating…" : "Update odds now"}
          </button>
        </div>
      </div>

      <BookmakerSelector mode={mode} onChange={setMode} />

      <div className="mt-6 flex flex-col gap-8">
        {data.games.map((game) => (
          <section key={game.fixtureId} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-lg font-medium">
              {game.awayTeam} @ {game.homeTeam}
              <span className="ml-3 text-sm text-text-muted">
                {new Date(game.commenceTime).toLocaleString()}
              </span>
            </h2>

            <div className="flex flex-col gap-6">
              {game.players.map((player) => (
                <div key={player.playerId}>
                  <div className="mb-2 text-sm text-text-muted">
                    {player.playerName} — e: {player.projection.e}, n: {player.projection.n}, p: {player.projection.p}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {player.projection.lines.map((line) => {
                      const impliedDecimal = impliedToDecimal(line.impliedOdds);
                      const actualDecimal = pickBookmakerPrice(player.bookmakerOdds, "over", mode);
                      const key = `${player.playerId}-${line.x}`;
                      return (
                        <LegButton
                          key={key}
                          playerName={player.playerName}
                          x={line.x}
                          impliedDecimal={impliedDecimal}
                          actualDecimal={actualDecimal}
                          hitRate={line.hitRate}
                          adjustedHitRate={line.adjustedHitRate}
                          n={player.projection.n}
                          selected={!!selected[key]}
                          onToggle={() =>
                            toggleLeg(key, player.playerName, line.x, impliedDecimal)
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <BetSlip
        legs={Object.entries(selected).map(([key, v]) => ({ key, ...v }))}
        onRemove={(key) => setSelected((prev) => { const n = { ...prev }; delete n[key]; return n; })}
      />
    </main>
  );
}