import { JSDOM } from "jsdom";
import { LEAGUE, WIKI_TASKS_URL } from "./lib/config";
import {
  writeCatalog,
  CATALOG_FILE_PATH,
  type Catalog,
  type Task,
  type Tier,
} from "./lib/catalog";

const VALID_TIERS: readonly Tier[] = ["easy", "medium", "hard", "elite", "master"];

export async function scrape(): Promise<Catalog> {
  const html = await fetchHtml(WIKI_TASKS_URL);
  const dom = new JSDOM(html);
  const rows = dom.window.document.querySelectorAll<HTMLTableRowElement>(
    "tr[data-taskid]"
  );

  const tasks: Task[] = [];
  rows.forEach((row) => {
    const task = parseRow(row);
    if (task) tasks.push(task);
  });

  tasks.sort((a, b) => a.id - b.id);

  return {
    league: LEAGUE,
    scrapedAt: new Date().toISOString(),
    source: WIKI_TASKS_URL,
    tasks,
  };
}

export async function scrapeAndWrite(): Promise<Catalog> {
  const catalog = await scrape();
  await writeCatalog(catalog);
  return catalog;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "leagues-scraper/1.0" } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return await res.text();
}

function parseRow(row: HTMLTableRowElement): Task | null {
  const id = Number(row.getAttribute("data-taskid"));
  if (!Number.isFinite(id)) return null;

  const tier = row.getAttribute("data-league-tier") as Tier | null;
  if (!tier || !VALID_TIERS.includes(tier)) return null;

  const points = Number(row.getAttribute("data-league-points") ?? "0");
  const area = row.getAttribute("data-league-area-for-filtering") ?? "unknown";
  const isPactTask = row.getAttribute("data-pact-task") === "yes";

  const tds = row.querySelectorAll("td");
  // Column order: [0] area icon, [1] name, [2] description, [3] requirements, [4] points badge, [5] completion %
  const name = tds[1]?.textContent?.trim() ?? "";
  if (!name) return null;
  const description = tds[2]?.textContent?.trim() ?? "";
  const requirements = parseRequirements(tds[3] ?? null);
  const completionPct = parseCompletion(tds[5] ?? null);

  return {
    id,
    name,
    description,
    points,
    tier,
    area,
    isPactTask,
    completionPct,
    requirements,
  };
}

function parseRequirements(cell: Element | null): Task["requirements"] {
  if (!cell) return { skills: [], other: null };
  // Skill reqs have both data-skill AND data-level. Level-less scp spans (e.g. miniquest badges) are decorative.
  const skills = Array.from(cell.querySelectorAll("span.scp[data-skill][data-level]")).map((el) => ({
    skill: el.getAttribute("data-skill") ?? "",
    level: Number(el.getAttribute("data-level")),
  }));

  // Extract non-skill text (e.g. "1,064 CA points", "Completion of Vale Totems") by removing ALL scp spans.
  const clone = cell.cloneNode(true) as Element;
  clone.querySelectorAll("span.scp").forEach((el) => el.remove());
  const rawOther = clone.textContent?.replace(/\s+/g, " ").replace(/^[,\s]+|[,\s]+$/g, "").trim() ?? "";
  const other = rawOther && rawOther !== "N/A" ? rawOther : null;

  return { skills, other };
}

function parseCompletion(cell: Element | null): number | null {
  if (!cell) return null;
  const text = cell.textContent?.trim() ?? "";
  if (!text || /n\/a/i.test(text)) return null;
  const lt = text.match(/^<\s*([\d.]+)\s*%/);
  if (lt) return Number(lt[1]) / 2; // "<0.1%" → 0.05 (midpoint-ish for sortability)
  const m = text.match(/([\d.]+)\s*%/);
  return m ? Number(m[1]) : null;
}

if (import.meta.main) {
  const catalog = await scrapeAndWrite();
  console.log(
    `Wrote ${catalog.tasks.length} tasks to ${CATALOG_FILE_PATH} (league=${catalog.league})`
  );
}
