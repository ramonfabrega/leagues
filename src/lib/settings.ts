import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

import { REGIONS, type Region } from "./catalog";

const ROOT = path.join(import.meta.dir, "../..");
const PROJECT_CONFIG_PATH = path.join(ROOT, "leagues.config.json");
const LOCAL_CONFIG_PATH = path.join(ROOT, "leagues.local.json");

export const ProjectConfigSchema = z.object({
  league: z.string().min(1),
  wikiTasksUrl: z.url(),
  players: z.array(z.string().min(1)).min(1),
  defaultPlayer: z.string().min(1),
});
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export const LocalConfigSchema = z.object({
  defaultPlayer: z.string().min(1).optional(),
  extraPlayers: z.array(z.string().min(1)).optional(),
  unlockedRegions: z.array(z.enum(REGIONS)).optional(),
});
type LocalConfig = z.infer<typeof LocalConfigSchema>;

export type Settings = {
  league: string;
  wikiTasksUrl: string;
  players: string[];
  defaultPlayer: string;
  unlockedRegions: Region[];
  sources: { project: string; local: string | null };
  overrides: {
    defaultPlayer: string | null;
    extraPlayers: string[];
    unlockedRegions: Region[] | null;
  };
};

let cached: Settings | null = null;

export function loadSettings(): Settings {
  if (cached) return cached;
  cached = mergeSettings(readProjectConfig(), readLocalConfig());
  return cached;
}

export function resolvePlayer(input?: string): string {
  const { players, defaultPlayer } = loadSettings();
  if (!input) return defaultPlayer;
  return players.find((p) => p.toLowerCase() === input.toLowerCase()) ?? input;
}

export function otherPlayers(player: string): string[] {
  const { players } = loadSettings();
  return players.filter((p) => p.toLowerCase() !== player.toLowerCase());
}

export async function setDefaultPlayer(rsn: string): Promise<Settings> {
  const project = readProjectConfig();
  const local = readLocalConfig();
  const known = [...project.players, ...(local?.extraPlayers ?? [])];
  if (!known.some((p) => p.toLowerCase() === rsn.toLowerCase())) {
    throw new Error(
      `"${rsn}" isn't in the known player list [${known.join(", ")}]. Add them first: leagues config add-player "${rsn}"`
    );
  }
  return await writeLocal({ ...(local ?? {}), defaultPlayer: rsn });
}

export async function addExtraPlayer(rsn: string): Promise<Settings> {
  const project = readProjectConfig();
  const local = readLocalConfig();
  if (project.players.some((p) => p.toLowerCase() === rsn.toLowerCase())) {
    throw new Error(`"${rsn}" is already in leagues.config.json — no local override needed`);
  }
  const extra = local?.extraPlayers ?? [];
  if (extra.some((p) => p.toLowerCase() === rsn.toLowerCase())) {
    throw new Error(`"${rsn}" is already in your local extraPlayers`);
  }
  return await writeLocal({ ...(local ?? {}), extraPlayers: [...extra, rsn] });
}

export async function removeExtraPlayer(rsn: string): Promise<Settings> {
  const local = readLocalConfig();
  const extra = local?.extraPlayers ?? [];
  const next = extra.filter((p) => p.toLowerCase() !== rsn.toLowerCase());
  if (next.length === extra.length) {
    throw new Error(`"${rsn}" is not in your local extraPlayers`);
  }
  return await writeLocal({ ...(local ?? {}), extraPlayers: next });
}

export const ALWAYS_UNLOCKED: Region[] = ["karamja"];

export async function setUnlockedRegions(regions: Region[]): Promise<Settings> {
  const local = readLocalConfig();
  const sorted = REGIONS.filter((r) => regions.includes(r) || ALWAYS_UNLOCKED.includes(r));
  return await writeLocal({ ...(local ?? {}), unlockedRegions: sorted });
}

export function effectiveUnlockedRegions(regions: Region[]): Region[] {
  const set = new Set<Region>(regions);
  for (const r of ALWAYS_UNLOCKED) set.add(r);
  return REGIONS.filter((r) => set.has(r));
}

export function resetLocalConfig(): { settings: Settings; removed: boolean } {
  const existed = existsSync(LOCAL_CONFIG_PATH);
  if (existed) unlinkSync(LOCAL_CONFIG_PATH);
  cached = null;
  return { settings: loadSettings(), removed: existed };
}

// ─── Internal ──────────────────────────────────────────────────────

function readProjectConfig(): ProjectConfig {
  if (!existsSync(PROJECT_CONFIG_PATH)) {
    throw new Error(`leagues.config.json not found at ${PROJECT_CONFIG_PATH}`);
  }
  const raw: unknown = JSON.parse(readFileSync(PROJECT_CONFIG_PATH, "utf8"));
  const parsed = ProjectConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`leagues.config.json is invalid:\n${z.prettifyError(parsed.error)}`);
  }
  if (
    !parsed.data.players.some((p) => p.toLowerCase() === parsed.data.defaultPlayer.toLowerCase())
  ) {
    throw new Error(
      `leagues.config.json: defaultPlayer "${parsed.data.defaultPlayer}" is not in players list`
    );
  }
  return parsed.data;
}

function readLocalConfig(): LocalConfig | null {
  if (!existsSync(LOCAL_CONFIG_PATH)) return null;
  const raw: unknown = JSON.parse(readFileSync(LOCAL_CONFIG_PATH, "utf8"));
  const parsed = LocalConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`leagues.local.json is invalid:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

async function writeLocal(local: LocalConfig): Promise<Settings> {
  await Bun.write(LOCAL_CONFIG_PATH, `${JSON.stringify(local, null, 2)}\n`);
  cached = null;
  return loadSettings();
}

export function mergeSettings(project: ProjectConfig, local: LocalConfig | null): Settings {
  const extraPlayers = local?.extraPlayers ?? [];
  const players = [...project.players];
  for (const p of extraPlayers) {
    if (!players.some((x) => x.toLowerCase() === p.toLowerCase())) players.push(p);
  }
  const defaultPlayer = local?.defaultPlayer ?? project.defaultPlayer;
  if (!players.some((p) => p.toLowerCase() === defaultPlayer.toLowerCase())) {
    throw new Error(
      `Effective defaultPlayer "${defaultPlayer}" is not in the merged players list [${players.join(", ")}]. ` +
        `Run "leagues config add-player ${defaultPlayer}" or "leagues config default <someone on the list>".`
    );
  }
  return {
    league: project.league,
    wikiTasksUrl: project.wikiTasksUrl,
    players,
    defaultPlayer,
    unlockedRegions: local?.unlockedRegions ?? [],
    sources: { project: PROJECT_CONFIG_PATH, local: local ? LOCAL_CONFIG_PATH : null },
    overrides: {
      defaultPlayer: local?.defaultPlayer ?? null,
      extraPlayers,
      unlockedRegions: local?.unlockedRegions ?? null,
    },
  };
}
