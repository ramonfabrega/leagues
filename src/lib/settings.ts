import path from "node:path";
import { unlink } from "node:fs/promises";
import { z } from "zod";

const ROOT = path.join(import.meta.dir, "../..");
const PROJECT_CONFIG_PATH = path.join(ROOT, "leagues.config.json");
export const LOCAL_CONFIG_PATH = path.join(ROOT, "leagues.local.json");

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
export type LocalConfig = z.infer<typeof LocalConfigSchema>;

export type Settings = {
  league: string;
  wikiTasksUrl: string;
  players: string[];
  defaultPlayer: string;
  sources: { project: string; local: string | null };
};

export async function loadProjectConfig(): Promise<ProjectConfig> {
  const file = Bun.file(PROJECT_CONFIG_PATH);
  if (!(await file.exists())) {
    throw new Error(`leagues.config.json not found at ${PROJECT_CONFIG_PATH}`);
  }
  const raw = await file.json();
  const parsed = ProjectConfigSchema.safeParse(raw);
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

export async function loadLocalConfig(): Promise<LocalConfig | null> {
  const file = Bun.file(LOCAL_CONFIG_PATH);
  if (!(await file.exists())) return null;
  const raw = await file.json();
  const parsed = LocalConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`leagues.local.json is invalid:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export async function writeLocalConfig(local: LocalConfig): Promise<void> {
  await Bun.write(LOCAL_CONFIG_PATH, JSON.stringify(local, null, 2) + "\n");
  cached = null;
}

export async function deleteLocalConfig(): Promise<boolean> {
  const file = Bun.file(LOCAL_CONFIG_PATH);
  if (!(await file.exists())) return false;
  await unlink(LOCAL_CONFIG_PATH);
  cached = null;
  return true;
}

export function mergeSettings(project: ProjectConfig, local: LocalConfig | null): Settings {
  const extra = local?.extraPlayers ?? [];
  const players = [...project.players];
  for (const p of extra) {
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
  };
}

let cached: Settings | null = null;

export async function loadSettings(): Promise<Settings> {
  if (cached) return cached;
  const [project, local] = await Promise.all([loadProjectConfig(), loadLocalConfig()]);
  cached = mergeSettings(project, local);
  return cached;
}

export function resolvePlayer(settings: Settings, input?: string): string {
  if (!input) return settings.defaultPlayer;
  const match = settings.players.find((p) => p.toLowerCase() === input.toLowerCase());
  return match ?? input;
}

export function otherPlayers(settings: Settings, player: string): string[] {
  return settings.players.filter((p) => p.toLowerCase() !== player.toLowerCase());
}
