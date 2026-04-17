import path from "node:path";
import { z } from "zod";

export const TIERS = ["easy", "medium", "hard", "elite", "master"] as const;

export const REGIONS = [
  "asgarnia",
  "desert",
  "fremennik",
  "kandarin",
  "karamja",
  "kourend",
  "morytania",
  "tirannwn",
  "varlamore",
  "wilderness",
] as const;
export type Region = (typeof REGIONS)[number];

const TaskSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  description: z.string(),
  points: z.number().int().nonnegative(),
  tier: z.enum(TIERS),
  area: z.string().min(1),
  isPactTask: z.boolean(),
  completionPct: z.number().nullable(),
  requirements: z.object({
    skills: z.array(z.object({ skill: z.string(), level: z.number().int().nonnegative() })),
    other: z.string().nullable(),
  }),
});

const CatalogSchema = z.object({
  league: z.string(),
  scrapedAt: z.string(),
  source: z.string(),
  tasks: z.array(TaskSchema),
});

export type Task = z.infer<typeof TaskSchema>;
export type Tier = z.infer<typeof TaskSchema>["tier"];
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
  const parsed = CatalogSchema.safeParse(await file.json());
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
