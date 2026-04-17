import path from "node:path";
import { z } from "zod";
import { loadSettings } from "./settings";

const USER_AGENT = "leagues-cli/1.0";

export const PlayerDataSchema = z.object({
  username: z.string(),
  league_tasks: z
    .array(z.union([z.string(), z.number()]))
    .transform((arr) => arr.map(String)),
  levels: z.record(z.string(), z.number()),
});

export type PlayerData = z.infer<typeof PlayerDataSchema>;

export async function fetchPlayer(rsn: string): Promise<PlayerData> {
  const { league } = await loadSettings();
  const json = await fetchPlayerRaw(rsn, league);
  const parsed = PlayerDataSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `fetchPlayer(${rsn}): unexpected response shape\n${z.prettifyError(parsed.error)}`
    );
  }
  return parsed.data;
}

export async function fetchTasksPage(): Promise<{ html: string; league: string; source: string }> {
  const { league, wikiTasksUrl } = await loadSettings();
  const res = await fetch(wikiTasksUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`GET ${wikiTasksUrl} → ${res.status} ${res.statusText}`);
  return { html: await res.text(), league, source: wikiTasksUrl };
}

// ─── Internal ──────────────────────────────────────────────────────

async function fetchPlayerRaw(rsn: string, league: string): Promise<unknown> {
  const fixtureDir = process.env.LEAGUES_FIXTURE_DIR;
  if (fixtureDir) {
    return await Bun.file(path.join(fixtureDir, `${rsn}.json`)).json();
  }
  const url = `https://sync.runescape.wiki/runelite/player/${encodeURIComponent(rsn)}/${league}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`fetchPlayer(${rsn}) → ${res.status} ${res.statusText}`);
  return await res.json();
}
