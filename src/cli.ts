import { parseArgs } from "node:util";
import { PLAYERS, DEFAULT_PLAYER, resolvePlayer, otherPlayers } from "./lib/config";
import {
  getPlayerProgress,
  missingTasks,
  easiestMissing,
  uniqueTasks,
  tierBreakdown,
  areaBreakdown,
  levelGaps,
  matchesFilter,
  type TaskFilter,
} from "./lib/queries";
import { findTasks, loadCatalog, taskByName } from "./lib/catalog";
import { printTaskList, formatTaskLine } from "./lib/format";
import { compareOnce, watchCompare } from "./lib/watch";
import { scrapeAndWrite } from "./scrape";
import type { Tier } from "./lib/catalog";

const [, , sub, ...rest] = process.argv;

const commands: Record<string, (argv: string[]) => Promise<unknown>> = {
  scrape: cmdScrape,
  compare: cmdCompare,
  missing: cmdMissing,
  easiest: cmdEasiest,
  unique: cmdUnique,
  summary: cmdSummary,
  levels: cmdLevels,
  task: cmdTask,
  search: cmdSearch,
  help: cmdHelp,
};

try {
  const fn = sub ? commands[sub] : undefined;
  if (!fn) {
    if (sub) console.error(`Unknown command: ${sub}\n`);
    await cmdHelp([]);
    process.exit(sub ? 1 : 0);
  }
  await fn(rest);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

async function cmdHelp(_argv: string[] = []): Promise<void> {
  console.log(`bun cli <command> [options]

Commands:
  scrape                             Re-scrape wiki → data/tasks.json
  compare <p1> <p2> [...] [--watch]  Diff unique tasks between players (optional permarunning mode)
  missing [--player=X] [filters]     Tasks the player has not completed
  easiest [--player=X] [filters]     Missing tasks ranked by highest completion %
  unique --player=X [--vs=Y,Z]       Tasks the player has that others don't
  summary [--player=X]               Task count, points, tier/area breakdown
  levels [--players=A,B,...]         Level gaps between players
  task <name>                        Show details for a single task
  search <query>                     Full-text search over task name/description
  help                               Show this message

Filters (for missing/easiest):
  --skill=Fletching     Only tasks requiring this skill
  --tier=easy|medium|hard|elite|master
  --area=general|tirannwn|...
  --max-points=N        Only tasks worth <= N points
  --min-points=N
  --min-completion=N    Only tasks where >= N% of players completed
  --max-completion=N
  --pact-only           Only pact-specific tasks

Output:
  --json                Machine-readable JSON (default: pretty text)
  --limit=N             Cap result count (easiest defaults to 20)

Configured players: ${PLAYERS.join(", ")}
Default player: ${DEFAULT_PLAYER}`);
}

async function cmdScrape(): Promise<void> {
  const catalog = await scrapeAndWrite();
  console.log(
    `Scraped ${catalog.tasks.length} tasks from ${catalog.source} at ${catalog.scrapedAt}`
  );
}

async function cmdCompare(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      watch: { type: "boolean" },
      interval: { type: "string" },
    },
  });
  const players = positionals.map(resolvePlayer);
  if (players.length < 2) {
    const fallback = PLAYERS.slice(0, 2).map((p) => p);
    if (fallback.length < 2) throw new Error("compare requires two players");
    players.push(...fallback.slice(players.length));
  }
  if (values.watch) {
    const intervalMs = values.interval ? Number(values.interval) * 1000 : 10_000;
    await watchCompare(players, intervalMs);
  } else {
    await compareOnce(players);
  }
}

async function cmdMissing(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      player: { type: "string" },
      json: { type: "boolean" },
      limit: { type: "string" },
      ...filterOptionSpec(),
    },
  });
  const player = await getPlayerProgress(resolvePlayer(values.player));
  const filter = parseFilter(values);
  const tasks = await missingTasks(player, filter);
  const limited = values.limit ? tasks.slice(0, Number(values.limit)) : tasks;
  if (values.json) return emit({ player: player.username, count: limited.length, tasks: limited });
  printTaskList(`Missing for ${player.username}`, limited);
}

async function cmdEasiest(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      player: { type: "string" },
      json: { type: "boolean" },
      limit: { type: "string" },
      ...filterOptionSpec(),
    },
  });
  const player = await getPlayerProgress(resolvePlayer(values.player));
  const filter = parseFilter(values);
  const limit = values.limit ? Number(values.limit) : 20;
  const tasks = await easiestMissing(player, filter, limit);
  if (values.json) return emit({ player: player.username, count: tasks.length, tasks });
  printTaskList(`Easiest missing for ${player.username}`, tasks);
}

async function cmdUnique(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      player: { type: "string" },
      vs: { type: "string" },
      json: { type: "boolean" },
    },
  });
  const targetName = resolvePlayer(values.player);
  const vsNames = values.vs
    ? values.vs.split(",").map((s) => resolvePlayer(s.trim()))
    : otherPlayers(targetName);
  const [target, ...others] = await Promise.all(
    [targetName, ...vsNames].map((n) => getPlayerProgress(n))
  );
  const tasks = await uniqueTasks(target!, others);
  if (values.json) {
    return emit({ player: target!.username, vs: vsNames, count: tasks.length, tasks });
  }
  printTaskList(`${target!.username} unique vs [${vsNames.join(", ")}]`, tasks);
}

async function cmdSummary(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: { player: { type: "string" }, json: { type: "boolean" } },
  });
  const player = await getPlayerProgress(resolvePlayer(values.player));
  const { tasks: all } = await loadCatalog();
  const byTier = tierBreakdown(player.completed);
  const totalByTier = tierBreakdown(all);
  const byArea = areaBreakdown(player.completed);

  if (values.json) {
    return emit({
      player: player.username,
      totalPoints: player.totalPoints,
      completedCount: player.completed.length,
      totalTaskCount: all.length,
      byTier,
      totalByTier,
      byArea,
      levels: player.levels,
    });
  }
  console.log(`Summary for ${player.username}`);
  console.log(`  Total points: ${player.totalPoints}`);
  console.log(`  Tasks: ${player.completed.length} / ${all.length}`);
  console.log(`  By tier:`);
  for (const tier of ["easy", "medium", "hard", "elite", "master"] as Tier[]) {
    const done = byTier[tier];
    const total = totalByTier[tier];
    console.log(`    ${tier.padEnd(6)} ${done.count} / ${total.count}  (${done.points} / ${total.points} pts)`);
  }
  console.log(`  By area:`);
  for (const [area, count] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${area.padEnd(12)} ${count}`);
  }
  if (player.unknownTaskIds.length > 0) {
    console.log(`  Unknown task IDs (catalog may be stale): ${player.unknownTaskIds.length}`);
  }
}

async function cmdLevels(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: { players: { type: "string" }, json: { type: "boolean" } },
  });
  const rsns = values.players
    ? values.players.split(",").map((s) => resolvePlayer(s.trim()))
    : [...PLAYERS];
  const progresses = await Promise.all(rsns.map((r) => getPlayerProgress(r)));
  const diffs = levelGaps(progresses);
  if (values.json) return emit({ players: rsns, diffs });
  if (diffs.length === 0) {
    console.log(`No notable level gaps between [${rsns.join(", ")}]`);
    return;
  }
  console.log(`Level gaps (low→high, threshold rules applied):`);
  for (const d of diffs) {
    const pairs = Object.entries(d.levels)
      .map(([name, lvl]) => `${name}=${lvl}`)
      .join(", ");
    console.log(`  ${d.skill.padEnd(14)} Δ${d.diff}  ${pairs}`);
  }
}

async function cmdTask(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { json: { type: "boolean" } },
  });
  const name = positionals.join(" ").trim();
  if (!name) throw new Error("Usage: bun cli task <name>");
  const task = await taskByName(name);
  if (!task) {
    const matches = await findTasks(name);
    if (matches.length === 0) throw new Error(`No task matching "${name}"`);
    if (values.json) return emit({ matches });
    console.log(`No exact match. ${matches.length} suggestions:`);
    for (const t of matches.slice(0, 10)) console.log(formatTaskLine(t));
    return;
  }
  if (values.json) return emit(task);
  console.log(JSON.stringify(task, null, 2));
}

async function cmdSearch(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { json: { type: "boolean" }, limit: { type: "string" } },
  });
  const q = positionals.join(" ").trim();
  if (!q) throw new Error("Usage: bun cli search <query>");
  const matches = await findTasks(q);
  const limit = values.limit ? Number(values.limit) : 50;
  const limited = matches.slice(0, limit);
  if (values.json) return emit({ query: q, count: limited.length, tasks: limited });
  printTaskList(`Search results for "${q}"`, limited);
}

function filterOptionSpec() {
  return {
    skill: { type: "string" as const },
    tier: { type: "string" as const },
    area: { type: "string" as const },
    "max-points": { type: "string" as const },
    "min-points": { type: "string" as const },
    "min-completion": { type: "string" as const },
    "max-completion": { type: "string" as const },
    "pact-only": { type: "boolean" as const },
  };
}

function parseFilter(values: Record<string, string | boolean | undefined>): TaskFilter {
  const filter: TaskFilter = {};
  if (typeof values.skill === "string") filter.skill = values.skill;
  if (typeof values.tier === "string") filter.tier = values.tier as Tier;
  if (typeof values.area === "string") filter.area = values.area;
  if (typeof values["max-points"] === "string") filter.maxPoints = Number(values["max-points"]);
  if (typeof values["min-points"] === "string") filter.minPoints = Number(values["min-points"]);
  if (typeof values["min-completion"] === "string") filter.minCompletionPct = Number(values["min-completion"]);
  if (typeof values["max-completion"] === "string") filter.maxCompletionPct = Number(values["max-completion"]);
  if (values["pact-only"]) filter.pactOnly = true;
  return filter;
}

function emit(data: unknown): void {
  console.log(JSON.stringify(data, replacer, 2));
}

function replacer(_: string, value: unknown): unknown {
  if (value instanceof Set) return Array.from(value);
  return value;
}

// silence unused import warning for matchesFilter (re-exported through queries)
void matchesFilter;
