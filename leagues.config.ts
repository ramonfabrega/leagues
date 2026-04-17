import { z } from "zod";

// ─── Edit this block ───────────────────────────────────────────────
const raw = {
  league: "DEMONIC_PACTS_LEAGUE",
  wikiTasksUrl: "https://oldschool.runescape.wiki/w/Demonic_Pacts_League/Tasks",
  players: ["R amon", "greenbay420"],
  defaultPlayer: "R amon",
};
// ───────────────────────────────────────────────────────────────────

const ConfigSchema = z
  .object({
    league: z.string().min(1),
    wikiTasksUrl: z.url(),
    players: z.array(z.string().min(1)).min(1),
    defaultPlayer: z.string().min(1),
  })
  .refine(
    (c) => c.players.some((p) => p.toLowerCase() === c.defaultPlayer.toLowerCase()),
    { message: "defaultPlayer must appear in players list" }
  );

const parsed = ConfigSchema.safeParse(raw);
if (!parsed.success) {
  throw new Error(`leagues.config.ts is invalid:\n${z.prettifyError(parsed.error)}`);
}

export const LEAGUE = parsed.data.league;
export const WIKI_TASKS_URL = parsed.data.wikiTasksUrl;
export const PLAYERS: readonly string[] = parsed.data.players;
export const DEFAULT_PLAYER = parsed.data.defaultPlayer;

export function resolvePlayer(input?: string): string {
  if (!input) return DEFAULT_PLAYER;
  const match = PLAYERS.find((p) => p.toLowerCase() === input.toLowerCase());
  return match ?? input;
}

export function otherPlayers(player: string): string[] {
  return PLAYERS.filter((p) => p.toLowerCase() !== player.toLowerCase());
}
