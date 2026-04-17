import config from "../../leagues.config";

export const LEAGUE = config.league;
export const WIKI_TASKS_URL = config.wikiTasksUrl;
export const PLAYERS: readonly string[] = config.players;
export const DEFAULT_PLAYER = config.defaultPlayer;

export function resolvePlayer(input?: string): string {
  if (!input) return DEFAULT_PLAYER;
  const match = PLAYERS.find((p) => p.toLowerCase() === input.toLowerCase());
  return match ?? input;
}

export function otherPlayers(player: string): string[] {
  return PLAYERS.filter((p) => p.toLowerCase() !== player.toLowerCase());
}
