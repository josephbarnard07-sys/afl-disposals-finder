export function impliedToDecimal(impliedOdds: number): number | null {
  if (impliedOdds <= 0) return null;
  return 1 / impliedOdds;
}

/**
 * Your colour rule:
 * - green if (implied - 1) / (actual - 1) = 1.5
 * - red if actual > implied
 * - otherwise neutral
 */
export function legColor(impliedDecimal: number | null, actualDecimal: number | null) {
  if (impliedDecimal === null || actualDecimal === null) return "neutral";
  if (actualDecimal > impliedDecimal) return "red";
  const ratio = (impliedDecimal - 1) / (actualDecimal - 1);
  if (Math.abs(ratio - 1.5) < 0.01) return "green"; // small tolerance for floating point
  return "neutral";
}

export function pickBookmakerPrice(
  bookmakerOdds: { bookmaker: string; overPrice: number | null; underPrice: number | null }[],
  side: "over" | "under",
  mode: { type: "single"; bookmaker: string } | { type: "best"; among?: string[] }
): number | null {
  const relevant =
    mode.type === "single"
      ? bookmakerOdds.filter((b) => b.bookmaker === mode.bookmaker)
      : bookmakerOdds.filter((b) => !mode.among || mode.among.includes(b.bookmaker));

  const prices = relevant
    .map((b) => (side === "over" ? b.overPrice : b.underPrice))
    .filter((p): p is number => p !== null);

  if (prices.length === 0) return null;
  return mode.type === "best" ? Math.max(...prices) : prices[0];
}