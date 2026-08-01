const BASE = "https://api.the-odds-api.com/v4";
const SPORT = "aussierules_afl";

export interface OddsEvent {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
}

export interface PlayerOutcome {
  name: "Over" | "Under";
  description: string; // player's full name
  point: number;       // the disposal line
  price: number;       // decimal odds
}

export interface BookmakerOdds {
  key: string;         // e.g. "sportsbet"
  last_update: string;
  markets: { key: string; outcomes: PlayerOutcome[] }[];
}

/** All AFL events currently listed by bookmakers (used to build the fixture list). */
export async function fetchUpcomingEvents(): Promise<OddsEvent[]> {
  const url = `${BASE}/sports/${SPORT}/events?apiKey=${process.env.ODDS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`events fetch failed: ${res.status}`);
  return res.json();
}

/** Player disposal odds for one specific game, across every AU bookmaker. */
export async function fetchDisposalOdds(
  eventId: string
): Promise<BookmakerOdds[]> {
  const url =
    `${BASE}/sports/${SPORT}/events/${eventId}/odds` +
    `?apiKey=${process.env.ODDS_API_KEY}` +
    `&regions=au&markets=player_disposals&oddsFormat=decimal`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`odds fetch failed for ${eventId}: ${res.status}`);
  const json = await res.json();
  return json.bookmakers ?? [];
}