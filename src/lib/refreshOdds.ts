import { supabase } from "./supabaseClient";
import { fetchUpcomingEvents, fetchDisposalOdds } from "./oddsApi";

export async function refreshOdds() {
  const events = await fetchUpcomingEvents();

  for (const event of events) {
    const { data: fixtureRow } = await supabase
      .from("fixtures")
      .upsert(
        {
          odds_api_event_id: event.id,
          home_team: event.home_team,
          away_team: event.away_team,
          commence_time: event.commence_time,
        },
        { onConflict: "odds_api_event_id" }
      )
      .select("id")
      .single();

    if (!fixtureRow) continue;

    const bookmakers = await fetchDisposalOdds(event.id);

    for (const bm of bookmakers) {
      const market = bm.markets.find((m) => m.key === "player_disposals");
      if (!market) continue;

      // Group outcomes by player so we can pair Over + Under together.
      const byPlayer = new Map<string, { over?: PlayerOutcome_; under?: PlayerOutcome_ }>();
      type PlayerOutcome_ = { name: string; description: string; point: number; price: number };

      for (const o of market.outcomes as PlayerOutcome_[]) {
        const entry = byPlayer.get(o.description) ?? {};
        if (o.name === "Over") entry.over = o;
        if (o.name === "Under") entry.under = o;
        byPlayer.set(o.description, entry);
      }

      for (const [playerName, pair] of byPlayer) {
        const line = pair.over?.point ?? pair.under?.point;
        if (line === undefined) continue;

        const { data: playerRow } = await supabase
          .from("players")
          .upsert({ full_name: playerName }, { onConflict: "full_name" })
          .select("id")
          .single();
        if (!playerRow) continue;

        await supabase.from("disposal_odds").upsert(
          {
            fixture_id: fixtureRow.id,
            player_id: playerRow.id,
            bookmaker: bm.key,
            line,
            over_price: pair.over?.price ?? null,
            under_price: pair.under?.price ?? null,
            last_updated: bm.last_update,
          },
          { onConflict: "fixture_id,player_id,bookmaker" }
        );
      }
    }
  }

  await supabase.from("sync_log").insert({
    sync_type: "odds",
    success: true,
    detail: `${events.length} fixtures processed`,
  });

  return { fixtures: events.length };
}