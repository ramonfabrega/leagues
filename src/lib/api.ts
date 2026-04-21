import path from "node:path";
import { z } from "zod";

import { loadSettings } from "./settings";

const USER_AGENT = "leagues-cli/1.0";

export const PlayerDataSchema = z.object({
  username: z.string(),
  league_tasks: z.array(z.union([z.string(), z.number()])).transform((arr) => arr.map(String)),
  levels: z.record(z.string(), z.number()),
});

export type PlayerData = z.infer<typeof PlayerDataSchema>;

export async function fetchPlayer(rsn: string): Promise<PlayerData> {
  const { league } = loadSettings();
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
  const { league, wikiTasksUrl } = loadSettings();
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
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:149.0) Gecko/20100101 Firefox/149.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Alt-Used": "sync.runescape.wiki",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "If-None-Match": 'W/"74dd-Oy+Dwbed+aAIJUQOTKf3+YOpZkE"',
      Priority: "u=0, i",
    },
    method: "GET",
    mode: "cors",
  });

  if (!res.ok) throw new Error(`fetchPlayer(${rsn}) → ${res.status} ${res.statusText}`);
  return await res.json();
}
