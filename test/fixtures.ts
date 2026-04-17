import type { PlayerProgress } from "../src/lib/queries";
import type { Task } from "../src/lib/catalog";

export function task(partial: Partial<Task> & Pick<Task, "id" | "name" | "tier" | "points">): Task {
  return {
    id: partial.id,
    name: partial.name,
    description: partial.description ?? "",
    points: partial.points,
    tier: partial.tier,
    area: partial.area ?? "general",
    isPactTask: partial.isPactTask ?? false,
    completionPct: partial.completionPct ?? null,
    requirements: partial.requirements ?? { skills: [], other: null },
  };
}

export function progress(partial: Partial<PlayerProgress> & Pick<PlayerProgress, "username">): PlayerProgress {
  const completed = partial.completed ?? [];
  return {
    username: partial.username,
    completed,
    completedTaskIds: partial.completedTaskIds ?? new Set(completed.map((t) => t.id)),
    unknownTaskIds: partial.unknownTaskIds ?? [],
    levels: partial.levels ?? {},
    totalPoints: partial.totalPoints ?? completed.reduce((s, t) => s + t.points, 0),
  };
}
