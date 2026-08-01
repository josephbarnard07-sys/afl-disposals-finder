import { GameLog, ImpliedLine, PlayerProjection } from "./types";

/** Games with 40% or less time on ground are excluded everywhere, per spec. */
function eligibleGames(games: GameLog[]): GameLog[] {
  return games.filter(
    (g) => g.timeOnGroundPct === null || g.timeOnGroundPct > 40
  );
}

function average(nums: number[]): number {
  return nums.reduce((sum, x) => sum + x, 0) / nums.length;
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Determines n: the size of the recent-game window used for every later
 * calculation. games[] must already be sorted most-recent-first and
 * already have low-time-on-ground games removed.
 */
function computeWindowSize(games: GameLog[]): number {
  if (games.length === 0) return 0;

  const last10 = games.slice(0, Math.min(10, games.length));
  const baseline = average(last10.map((g) => g.disposals));
  const lowerBound = baseline * 0.9;
  const upperBound = baseline * 1.1;

  let n = 0;
  // Walk backwards in games of 7, checking the rolling 7-game average
  // starting at each point, most-recent-first.
  for (let start = 0; start + 7 <= games.length; start++) {
    const window7 = games.slice(start, start + 7);
    const rollingAvg = average(window7.map((g) => g.disposals));
    if (rollingAvg >= lowerBound && rollingAvg <= upperBound) {
      n = start + 7; // include everything up to and including this window
    } else {
      break; // once the rolling average leaves the +/-10% band, stop extending n
    }
  }

  // Fallback: if the player has fewer than 7 eligible games, or the very
  // first 7-game window already fails the band test, use all available
  // eligible games (capped sensibly) so the player still gets a projection.
  if (n === 0) {
    n = Math.min(games.length, 10);
  }

  return n;
}

/**
 * p: the disposal count at which the bookmaker's UNDER loses.
 * If Sportsbet and PointsBet have different lines, use the one with the
 * higher price (odds) on the under.
 */
export function computeP(
  sportsbet: { line: number; underPrice: number } | null,
  pointsbet: { line: number; underPrice: number } | null
): number {
  const candidates = [sportsbet, pointsbet].filter(Boolean) as {
    line: number;
    underPrice: number;
  }[];
  if (candidates.length === 0) throw new Error("No sportsbet/pointsbet line available");

  let chosen = candidates[0];
  if (candidates.length === 2 && candidates[0].line !== candidates[1].line) {
    chosen = candidates[0].underPrice >= candidates[1].underPrice
      ? candidates[0]
      : candidates[1];
  }
  // A "24.5 disposals" line means the under needs 24 or fewer to win, so
  // the under LOSES starting at 25 — one more than the line.
  return Math.floor(chosen.line) + 1;
}

export function buildProjection(
  rawGames: GameLog[],
  p: number
): PlayerProjection {
  const games = eligibleGames(rawGames).sort(
    (a, b) => (a.matchDate < b.matchDate ? 1 : -1) // most recent first
  );

  const n = computeWindowSize(games);
  const window = games.slice(0, n);
  const disposals = window.map((g) => g.disposals);
  const e = median(disposals);
  const a = p - e;

  const lines: ImpliedLine[] = [];

  for (let x = 0; x < p; x++) {
    const s = disposals.filter((d) => d > x).length;
    const k = disposals.filter((d) => d === x).length;
    const l = disposals.filter((d) => d === x + 1).length;
    const j = disposals.filter((d) => d === x - 1).length;
    const h = disposals.filter((d) => d === x - 2).length;

    const t = k + 0.5 * l - j + 0.5 * h;

    let y = 0;
    if (t < -0.1 * e) y = -1;
    else if (t > 0.1 * e) y = 1;

    const impliedOdds = (s + a + y) / n;

    lines.push({
      x,
      s,
      a,
      y,
      impliedOdds,
      hitRate: s / n,
      adjustedHitRate: impliedOdds,
    });
  }

  return { n, e, p, a, lines };
}