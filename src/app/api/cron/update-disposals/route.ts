import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { fetchAflTablesPlayerGames } from "@/lib/aflTablesData";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const rows = await fetchAflTablesPlayerGames([2024, 2025, 2026]);

    for (const row of rows) {
      const { data: playerRow, error: playerErr } = await supabase
        .from("players")
        .upsert({ full_name: row.Player, team: row.Team }, { onConflict: "full_name" })
        .select("id")
        .single();

      if (playerErr || !playerRow) continue;

      await supabase.from("player_games").upsert(
        {
          player_id: playerRow.id,
          season: row.Season,
          round: row.Round,
          match_date: row.Date,
          team: row.Team,
          opponent: row.Opponent,
          disposals: row.Disposals,
          time_on_ground_pct: row["Time.On.Ground.Percentage"] ?? row["%Played"] ?? null,
        },
        { onConflict: "player_id,season,round,match_date" }
      );
    }

    await supabase.from("sync_log").insert({
      sync_type: "disposals",
      success: true,
      detail: `${rows.length} rows processed`,
    });

    return NextResponse.json({ ok: true, rows: rows.length });
  } catch (err) {
    await supabase.from("sync_log").insert({
      sync_type: "disposals",
      success: false,
      detail: String(err),
    });
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}