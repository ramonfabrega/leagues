import { existsSync, readFileSync } from "node:fs";
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

export function loadCatalog(): Catalog {
  if (cached) return cached;

  if (!existsSync(CATALOG_PATH)) {
    throw new Error(`data/tasks.json not found. Run "leagues scrape" to generate it.`);
  }

  const raw = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
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
  await Bun.write(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
  cached = catalog;
  cachedById = null;
}

export function taskById(id: number | string): Task | undefined {
  const { tasks } = loadCatalog();
  if (!cachedById) cachedById = new Map(tasks.map((t) => [t.id, t]));
  return cachedById.get(Number(id));
}

export function findTasks(query: string): Task[] {
  const { tasks } = loadCatalog();
  const q = query.toLowerCase();
  return tasks.filter(
    (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  );
}
