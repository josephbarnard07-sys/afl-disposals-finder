import { parquetRead } from "hyparquet";

const RELEASES_API =
  "https://api.github.com/repos/jimmyday12/fitzroy_data/releases/tags/data";

interface RawRow {
  Season: number;
  Round: string;
  Date: string;
  Player: string;
  Team: string;
  Opponent: string;
  Disposals: number;
  "Time.On.Ground.Percentage"?: number;
  "%Played"?: number;
}

/**
 * Downloads the current player-stats release asset from fitzroy_data and
 * returns every game played in the given seasons.
 */
export async function fetchAflTablesPlayerGames(
  seasons: number[]
): Promise<RawRow[]> {
  const releaseRes = await fetch(RELEASES_API, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!releaseRes.ok) {
    throw new Error(`GitHub releases lookup failed: ${releaseRes.status}`);
  }
  const release = await releaseRes.json();

  // Find the asset that looks like the player stats file, whatever its
  // exact current filename is (.parquet preferred).
  const asset = release.assets.find((a: { name: string }) =>
    /player.?stats/i.test(a.name) && a.name.endsWith(".parquet")
  );
  if (!asset) {
    throw new Error(
      "Could not find a player-stats parquet asset in the latest fitzroy_data release — check " +
        "https://github.com/jimmyday12/fitzroy_data/releases for the current filename and update the regex above."
    );
  }

  const fileRes = await fetch(asset.browser_download_url);
  const buffer = await fileRes.arrayBuffer();

  const rows: RawRow[] = [];
  await parquetRead({
    file: buffer,
    onComplete: (data) => rows.push(...(data as RawRow[])),
  });

  return rows.filter((r) => seasons.includes(r.Season));
}