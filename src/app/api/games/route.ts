import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { buildProjection, computeP } from "@/lib/statsEngine";

export async function GET() {
  const { data: fixtures } = await supabase
    .from("fixtures")
    .select("*")
    .order("commence_time", { ascending: true });

  if (!fixtures) return NextResponse.json({ games: [] });

  const result = [];

  for (const fixture of fixtures) {
    const { data: odds } = await supabase
      .from("disposal_odds")
      .select("*, players(id, full_name)")
      .eq("fixture_id", fixture.id);

    if (!odds || odds.length === 0) continue;

    const byPlayer = new Map<number, typeof odds>();
    for (const row of odds) {
      const arr = byPlayer.get(row.player_id) ?? [];
      arr.push(row);
      byPlayer.set(row.player_id, arr);
    }

    const players = [];

    for (const [playerId, rows] of byPlayer) {
      const sportsbetRow = rows.find((r) => r.bookmaker === "sportsbet");
      const pointsbetRow = rows.find((r) => r.bookmaker === "pointsbetau");
      if (!sportsbetRow && !pointsbetRow) continue; // no p available for this player

      const p = computeP(
        sportsbetRow ? { line: sportsbetRow.line, underPrice: sportsbetRow.under_price } : null,
        pointsbetRow ? { line: pointsbetRow.line, underPrice: pointsbetRow.under_price } : null
      );

      const { data: games } = await supabase
        .from("player_games")
        .select("disposals, time_on_ground_pct, match_date")
        .eq("player_id", playerId)
        .order("match_date", { ascending: false });

      if (!games || games.length === 0) continue;

      const projection = buildProjection(
        games.map((g) => ({
          disposals: g.disposals,
          timeOnGroundPct: g.time_on_ground_pct,
          matchDate: g.match_date,
        })),
        p
      );

      players.push({
        playerId,
        playerName: (rows[0] as unknown as { players: { full_name: string } }).players.full_name,
        projection,
        bookmakerOdds: rows.map((r) => ({
          bookmaker: r.bookmaker,
          line: r.line,
          overPrice: r.over_price,
          underPrice: r.under_price,
        })),
      });
    }

    // Order players by e (expected/median disposals), highest first, per spec.
    players.sort((a, b) => b.projection.e - a.projection.e);

    result.push({
      fixtureId: fixture.id,
      homeTeam: fixture.home_team,
      awayTeam: fixture.away_team,
      commenceTime: fixture.commence_time,
      players,
    });
  }

  const { data: lastSync } = await supabase
    .from("sync_log")
    .select("*")
    .eq("sync_type", "odds")
    .order("ran_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ games: result, lastOddsSync: lastSync?.ran_at ?? null });
}