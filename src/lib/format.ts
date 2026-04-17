import type { Task } from "./catalog";

export function formatTaskLine(t: Task): string {
  const pct = t.completionPct === null ? "N/A" : `${t.completionPct.toFixed(1)}%`;
  const reqs = t.requirements.skills.map((r) => `${r.skill} ${r.level}`).join(", ");
  const other = t.requirements.other ? ` | ${t.requirements.other}` : "";
  const reqStr = reqs || other ? ` [${reqs}${other}]` : "";
  return `  ${t.points.toString().padStart(3)}pts  ${pct.padStart(6)}  ${t.name}${reqStr}`;
}

export function groupByTier<T extends { tier: string }>(tasks: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const t of tasks) (out[t.tier] ??= []).push(t);
  return out;
}

export function printTaskList(label: string, tasks: Task[]): void {
  if (tasks.length === 0) {
    console.log(`${label}: none`);
    return;
  }
  console.log(`\n${label} (${tasks.length}):`);
  const grouped = groupByTier(tasks);
  const tierOrder = ["easy", "medium", "hard", "elite", "master"];
  for (const tier of tierOrder) {
    const group = grouped[tier];
    if (!group?.length) continue;
    console.log(`  [${tier}]`);
    for (const t of group) console.log(formatTaskLine(t));
  }
}
