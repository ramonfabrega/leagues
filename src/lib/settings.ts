import path from "node:path";
import { unlink } from "node:fs/promises";
import { z } from "zod";

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
});
type LocalConfig = z.infer<typeof LocalConfigSchema>;

export type Settings = {
  league: string;
  wikiTasksUrl: string;
  players: string[];
  defaultPlayer: string;
  sources: { project: string; local: string | null };
  overrides: {
    defaultPlayer: string | null;
    extraPlayers: string[];
  };
};

let cached: Settings | null = null;

export async function loadSettings(): Promise<Settings> {
  if (cached) return cached;
  const [project, local] = await Promise.all([readProjectConfig(), readLocalConfig()]);
  cached = mergeSettings(project, local);
  return cached;
}

export async function resolvePlayer(input?: string): Promise<string> {
  const { players, defaultPlayer } = await loadSettings();
  if (!input) return defaultPlayer;
  return players.find((p) => p.toLowerCase() === input.toLowerCase()) ?? input;
}

export async function otherPlayers(player: string): Promise<string[]> {
  const { players } = await loadSettings();
  return players.filter((p) => p.toLowerCase() !== player.toLowerCase());
}

export async function setDefaultPlayer(rsn: string): Promise<Settings> {
  const [project, local] = await Promise.all([readProjectConfig(), readLocalConfig()]);
  const known = [...project.players, ...(local?.extraPlayers ?? [])];
  if (!known.some((p) => p.toLowerCase() === rsn.toLowerCase())) {
    throw new Error(
      `"${rsn}" isn't in the known player list [${known.join(", ")}]. Add them first: leagues config add-player "${rsn}"`
    );
  }
  return await writeLocal({ ...(local ?? {}), defaultPlayer: rsn });
}

export async function addExtraPlayer(rsn: string): Promise<Settings> {
  const [project, local] = await Promise.all([readProjectConfig(), readLocalConfig()]);
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
  const local = await readLocalConfig();
  const extra = local?.extraPlayers ?? [];
  const next = extra.filter((p) => p.toLowerCase() !== rsn.toLowerCase());
  if (next.length === extra.length) {
    throw new Error(`"${rsn}" is not in your local extraPlayers`);
  }
  return await writeLocal({ ...(local ?? {}), extraPlayers: next });
}

export async function resetLocalConfig(): Promise<{ settings: Settings; removed: boolean }> {
  const file = Bun.file(LOCAL_CONFIG_PATH);
  const existed = await file.exists();
  if (existed) await unlink(LOCAL_CONFIG_PATH);
  cached = null;
  return { settings: await loadSettings(), removed: existed };
}

// ─── Internal ──────────────────────────────────────────────────────

async function readProjectConfig(): Promise<ProjectConfig> {
  const file = Bun.file(PROJECT_CONFIG_PATH);
  if (!(await file.exists())) {
    throw new Error(`leagues.config.json not found at ${PROJECT_CONFIG_PATH}`);
  }
  const parsed = ProjectConfigSchema.safeParse(await file.json());
  if (!parsed.success) {
    throw new Error(`leagues.config.json is invalid:\n${z.prettifyError(parsed.error)}`);
  }
  if (!parsed.data.players.some((p) => p.toLowerCase() === parsed.data.defaultPlayer.toLowerCase())) {
    throw new Error(
      `leagues.config.json: defaultPlayer "${parsed.data.defaultPlayer}" is not in players list`
    );
  }
  return parsed.data;
}

async function readLocalConfig(): Promise<LocalConfig | null> {
  const file = Bun.file(LOCAL_CONFIG_PATH);
  if (!(await file.exists())) return null;
  const parsed = LocalConfigSchema.safeParse(await file.json());
  if (!parsed.success) {
    throw new Error(`leagues.local.json is invalid:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

async function writeLocal(local: LocalConfig): Promise<Settings> {
  await Bun.write(LOCAL_CONFIG_PATH, JSON.stringify(local, null, 2) + "\n");
  cached = null;
  return await loadSettings();
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
    sources: { project: PROJECT_CONFIG_PATH, local: local ? LOCAL_CONFIG_PATH : null },
    overrides: {
      defaultPlayer: local?.defaultPlayer ?? null,
      extraPlayers,
    },
  };
}
