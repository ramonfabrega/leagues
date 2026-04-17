import path from "node:path";
import { z } from "zod";

export const TIERS = ["easy", "medium", "hard", "elite", "master"] as const;
export const TierSchema = z.enum(TIERS);
export type Tier = z.infer<typeof TierSchema>;

export const SkillRequirementSchema = z.object({
  skill: z.string(),
  level: z.number().int().nonnegative(),
});
export type SkillRequirement = z.infer<typeof SkillRequirementSchema>;

export const TaskSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  description: z.string(),
  points: z.number().int().nonnegative(),
  tier: TierSchema,
  area: z.string().min(1),
  isPactTask: z.boolean(),
  completionPct: z.number().nullable(),
  requirements: z.object({
    skills: z.array(SkillRequirementSchema),
    other: z.string().nullable(),
  }),
});
export type Task = z.infer<typeof TaskSchema>;

export const CatalogSchema = z.object({
  league: z.string(),
  scrapedAt: z.string(),
  source: z.string(),
  tasks: z.array(TaskSchema),
});
export type Catalog = z.infer<typeof CatalogSchema>;

const CATALOG_PATH = path.join(import.meta.dir, "../../data/tasks.json");

let cached: Catalog | null = null;
let cachedById: Map<number, Task> | null = null;
let cachedByName: Map<string, Task> | null = null;

export async function loadCatalog(): Promise<Catalog> {
  if (cached) return cached;
  const file = Bun.file(CATALOG_PATH);
  if (!(await file.exists())) {
    throw new Error(`data/tasks.json not found. Run "leagues scrape" to generate it.`);
  }
  const raw = await file.json();
  const parsed = CatalogSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `data/tasks.json is malformed — re-run "leagues scrape":\n${z.prettifyError(parsed.error)}`
    );
  }
  cached = parsed.data;
  return cached;
}

export async function writeCatalog(catalog: Catalog): Promise<void> {
  await Bun.write(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n");
  cached = catalog;
  cachedById = null;
  cachedByName = null;
}

export async function taskById(id: number | string): Promise<Task | undefined> {
  const { tasks } = await loadCatalog();
  if (!cachedById) cachedById = new Map(tasks.map((t) => [t.id, t]));
  return cachedById.get(Number(id));
}

export async function taskByName(name: string): Promise<Task | undefined> {
  const { tasks } = await loadCatalog();
  if (!cachedByName) {
    cachedByName = new Map(tasks.map((t) => [t.name.toLowerCase(), t]));
  }
  return cachedByName.get(name.toLowerCase());
}

export async function findTasks(query: string): Promise<Task[]> {
  const { tasks } = await loadCatalog();
  const q = query.toLowerCase();
  return tasks.filter(
    (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  );
}

export const CATALOG_FILE_PATH = CATALOG_PATH;
