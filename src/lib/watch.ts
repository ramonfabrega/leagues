import { getPlayerProgress, uniqueTasks, type PlayerProgress } from "./queries";
import type { Task } from "./catalog";
import { formatTaskLine } from "./format";

type Snapshot = {
  players: string[];
  unique: Record<string, Task[]>;
};

export async function watchCompare(
  rsns: string[],
  intervalMs = 10_000
): Promise<void> {
  if (rsns.length < 2) throw new Error("compare --watch requires at least 2 players");

  let prev: Snapshot | null = null;
  while (true) {
    try {
      const snapshot = await buildSnapshot(rsns);
      if (!prev || !sameSnapshot(prev, snapshot)) {
        logChanges(prev, snapshot);
        printSnapshot(snapshot);
        prev = snapshot;
      }
    } catch (err) {
      console.error("[watch] error:", err instanceof Error ? err.message : err);
    }
    await Bun.sleep(intervalMs);
  }
}

export async function compareOnce(rsns: string[]): Promise<Snapshot> {
  const snapshot = await buildSnapshot(rsns);
  printSnapshot(snapshot);
  return snapshot;
}

async function buildSnapshot(rsns: string[]): Promise<Snapshot> {
  const progresses = await Promise.all(rsns.map((r) => getPlayerProgress(r)));
  const byName = new Map<string, PlayerProgress>(
    progresses.map((p, i) => [rsns[i]!, p])
  );
  const unique: Record<string, Task[]> = {};
  for (const name of rsns) {
    const target = byName.get(name)!;
    const others = rsns.filter((n) => n !== name).map((n) => byName.get(n)!);
    unique[name] = await uniqueTasks(target, others);
  }
  return { players: rsns, unique };
}

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  if (a.players.join("|") !== b.players.join("|")) return false;
  for (const p of a.players) {
    const aIds = (a.unique[p] ?? []).map((t) => t.id).sort();
    const bIds = (b.unique[p] ?? []).map((t) => t.id).sort();
    if (aIds.length !== bIds.length) return false;
    for (let i = 0; i < aIds.length; i++) if (aIds[i] !== bIds[i]) return false;
  }
  return true;
}

function logChanges(prev: Snapshot | null, next: Snapshot): void {
  if (!prev) return;
  for (const p of next.players) {
    const prevIds = new Set((prev.unique[p] ?? []).map((t) => t.id));
    const nextIds = new Set((next.unique[p] ?? []).map((t) => t.id));
    const newlyUnique = (next.unique[p] ?? []).filter((t) => !prevIds.has(t.id));
    const nowCommon = (prev.unique[p] ?? []).filter((t) => !nextIds.has(t.id));
    if (newlyUnique.length > 0) {
      console.log(`\nNew unique tasks for ${p}:`);
      for (const t of newlyUnique.sort((a, b) => a.points - b.points)) {
        console.log(formatTaskLine(t));
      }
    }
    if (nowCommon.length > 0) {
      console.log(`\nTasks now common (${p}):`);
      for (const t of nowCommon.sort((a, b) => a.points - b.points)) {
        console.log(formatTaskLine(t));
      }
    }
  }
}

function printSnapshot(s: Snapshot): void {
  for (const p of s.players) {
    const tasks = s.unique[p] ?? [];
    if (tasks.length === 0) continue;
    console.log(`\n${p} unique tasks (${tasks.length}):`);
    const byPoints = new Map<number, Task[]>();
    for (const t of tasks.sort((a, b) => a.points - b.points)) {
      if (!byPoints.has(t.points)) byPoints.set(t.points, []);
      byPoints.get(t.points)!.push(t);
    }
    for (const [pts, group] of byPoints) {
      console.log(`  ${pts}pts:`, group.map((t) => t.name));
    }
  }
}
