import { LEAGUE } from "./constants";

export type PlayerData = {
  username: string;
  league_tasks: string[];
  levels: Record<string, number>;
};

export async function fetchPlayer(rsn: string): Promise<PlayerData> {
  const res = await fetch(
    `https://sync.runescape.wiki/runelite/player/${encodeURIComponent(rsn)}/${LEAGUE}`,
    { headers: { "User-Agent": "RuneLite" } }
  );
  return (await res.json()) as PlayerData;
}
