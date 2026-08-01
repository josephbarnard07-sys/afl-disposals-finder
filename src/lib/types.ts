export interface GameLog {
  disposals: number;
  timeOnGroundPct: number | null;
  matchDate: string;
}

export interface ImpliedLine {
  x: number;          // disposal threshold
  s: number;
  a: number;
  y: number;
  impliedOdds: number; // i
  hitRate: number;      // s / n
  adjustedHitRate: number; // (s + a + y) / n, same as impliedOdds but kept as a named field for the UI
}

export interface PlayerProjection {
  n: number;
  e: number;   // median across the window
  p: number;   // the bookmaker's break-even point
  a: number;   // p - e
  lines: ImpliedLine[];
}