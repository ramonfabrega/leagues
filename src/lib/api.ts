import { z } from "zod";

const USER_AGENT = "leagues-cli/1.0";

export const PlayerDataSchema = z.object({
  username: z.string(),
  league_tasks: z
    .array(z.union([z.string(), z.number()]))
    .transform((arr) => arr.map(String)),
  levels: z.record(z.string(), z.number()),
});

export type PlayerData = z.infer<typeof PlayerDataSchema>;

export async function fetchPlayer(rsn: string, league: string): Promise<PlayerData> {
  const url = `https://sync.runescape.wiki/runelite/player/${encodeURIComponent(rsn)}/${league}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`fetchPlayer(${rsn}) → ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const parsed = PlayerDataSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `fetchPlayer(${rsn}): unexpected response shape\n${z.prettifyError(parsed.error)}`
    );
  }
  return parsed.data;
}

export async function fetchWikiTasksHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  return await res.text();
}
