import { LEAGUE } from "./config";

export type PlayerData = {
  username: string;
  league_tasks: string[];
  levels: Record<string, number>;
};

export async function fetchPlayer(rsn: string): Promise<PlayerData> {
  const url = `https://sync.runescape.wiki/runelite/player/${encodeURIComponent(rsn)}/${LEAGUE}`;
  const res = await fetch(url, { headers: { "User-Agent": "RuneLite" } });
  if (!res.ok) {
    throw new Error(`fetchPlayer(${rsn}) failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as PlayerData;
}
