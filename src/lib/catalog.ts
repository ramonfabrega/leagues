import path from "node:path";

export type Tier = "easy" | "medium" | "hard" | "elite" | "master";

export type SkillRequirement = { skill: string; level: number };

export type Task = {
  id: number;
  name: string;
  description: string;
  points: number;
  tier: Tier;
  area: string;
  isPactTask: boolean;
  completionPct: number | null;
  requirements: {
    skills: SkillRequirement[];
    other: string | null;
  };
};

export type Catalog = {
  league: string;
  scrapedAt: string;
  source: string;
  tasks: Task[];
};

const CATALOG_PATH = path.join(import.meta.dir, "../../data/tasks.json");

let cached: Catalog | null = null;
let cachedById: Map<number, Task> | null = null;
let cachedByName: Map<string, Task> | null = null;

export async function loadCatalog(): Promise<Catalog> {
  if (cached) return cached;
  const file = Bun.file(CATALOG_PATH);
  if (!(await file.exists())) {
    throw new Error(
      `data/tasks.json not found. Run "bun cli scrape" to generate it.`
    );
  }
  cached = (await file.json()) as Catalog;
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
