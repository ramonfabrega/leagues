import { fetchPlayer, type PlayerData } from "./api";
import { loadCatalog, taskById, type Task, type Tier } from "./catalog";

export type PlayerProgress = {
  username: string;
  completedTaskIds: Set<number>;
  completed: Task[];
  unknownTaskIds: string[];
  levels: Record<string, number>;
  totalPoints: number;
};

export type TaskFilter = {
  skill?: string;
  tier?: Tier;
  area?: string;
  maxPoints?: number;
  minPoints?: number;
  minCompletionPct?: number;
  maxCompletionPct?: number;
  pactOnly?: boolean;
};

export async function getPlayerProgress(rsn: string): Promise<PlayerProgress> {
  const raw = await fetchPlayer(rsn);
  return await buildProgress(raw);
}

async function buildProgress(raw: PlayerData): Promise<PlayerProgress> {
  const completedTaskIds = new Set<number>();
  const completed: Task[] = [];
  const unknownTaskIds: string[] = [];
  let totalPoints = 0;

  for (const idStr of raw.league_tasks) {
    const task = await taskById(idStr);
    if (!task) {
      unknownTaskIds.push(idStr);
      continue;
    }
    completedTaskIds.add(task.id);
    completed.push(task);
    totalPoints += task.points;
  }

  return {
    username: raw.username,
    completedTaskIds,
    completed,
    unknownTaskIds,
    levels: raw.levels,
    totalPoints,
  };
}

export function matchesFilter(task: Task, filter: TaskFilter): boolean {
  if (filter.tier && task.tier !== filter.tier) return false;
  if (filter.area && task.area.toLowerCase() !== filter.area.toLowerCase()) return false;
  if (filter.maxPoints !== undefined && task.points > filter.maxPoints) return false;
  if (filter.minPoints !== undefined && task.points < filter.minPoints) return false;
  if (filter.pactOnly && !task.isPactTask) return false;
  if (filter.minCompletionPct !== undefined) {
    if (task.completionPct === null) return false;
    if (task.completionPct < filter.minCompletionPct) return false;
  }
  if (filter.maxCompletionPct !== undefined) {
    if (task.completionPct === null) return false;
    if (task.completionPct > filter.maxCompletionPct) return false;
  }
  if (filter.skill) {
    const s = filter.skill.toLowerCase();
    const hasSkillReq = task.requirements.skills.some(
      (r) => r.skill.toLowerCase() === s
    );
    if (!hasSkillReq) return false;
  }
  return true;
}

export async function missingTasks(
  player: PlayerProgress,
  filter: TaskFilter = {}
): Promise<Task[]> {
  const { tasks } = await loadCatalog();
  return tasks.filter(
    (t) => !player.completedTaskIds.has(t.id) && matchesFilter(t, filter)
  );
}

export async function easiestMissing(
  player: PlayerProgress,
  filter: TaskFilter = {},
  limit = 20
): Promise<Task[]> {
  const missing = await missingTasks(player, filter);
  return missing
    .filter((t) => t.completionPct !== null)
    .sort((a, b) => (b.completionPct! - a.completionPct!))
    .slice(0, limit);
}

export async function uniqueTasks(
  target: PlayerProgress,
  others: PlayerProgress[]
): Promise<Task[]> {
  const otherIds = new Set<number>();
  for (const o of others) for (const id of o.completedTaskIds) otherIds.add(id);
  return target.completed.filter((t) => !otherIds.has(t.id));
}

export type TierBreakdown = Record<Tier, { count: number; points: number }>;

export function tierBreakdown(tasks: Task[]): TierBreakdown {
  const empty = { count: 0, points: 0 };
  const out: TierBreakdown = {
    easy: { ...empty },
    medium: { ...empty },
    hard: { ...empty },
    elite: { ...empty },
    master: { ...empty },
  };
  for (const t of tasks) {
    out[t.tier].count++;
    out[t.tier].points += t.points;
  }
  return out;
}

export function areaBreakdown(tasks: Task[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of tasks) out[t.area] = (out[t.area] ?? 0) + 1;
  return out;
}

export type LevelDiff = {
  skill: string;
  levels: Record<string, number>;
  low: number;
  high: number;
  diff: number;
};

const DEFAULT_LEVEL_THRESHOLDS = [
  { maxLow: 50, minDiff: 7 },
  { maxLow: 80, minDiff: 5 },
  { maxLow: Infinity, minDiff: 3 },
];

export function levelGaps(
  players: PlayerProgress[],
  thresholds = DEFAULT_LEVEL_THRESHOLDS
): LevelDiff[] {
  if (players.length < 2) return [];
  const skills = new Set<string>();
  for (const p of players) for (const s of Object.keys(p.levels)) skills.add(s);

  const out: LevelDiff[] = [];
  for (const skill of skills) {
    const levels: Record<string, number> = {};
    let low = Infinity;
    let high = -Infinity;
    let hasAll = true;
    for (const p of players) {
      const lvl = p.levels[skill];
      if (lvl === undefined) { hasAll = false; break; }
      levels[p.username] = lvl;
      if (lvl < low) low = lvl;
      if (lvl > high) high = lvl;
    }
    if (!hasAll) continue;
    const diff = high - low;
    const rule = thresholds.find((t) => low <= t.maxLow);
    if (!rule || diff < rule.minDiff) continue;
    out.push({ skill, levels, low, high, diff });
  }
  return out.sort((a, b) => b.diff - a.diff);
}
