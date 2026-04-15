import { TasksMap } from "./constants";

type Task = { name: string; points: number };

type PlayerTasks = {
  username: string;
  league_tasks: Task[];
};

type ComparedTasks = ReturnType<typeof compareTasks>;

let cache: ComparedTasks;

while (true) {
  await run();
  await Bun.sleep(10000);
}

async function run() {
  const rmn = await fetchCompletedTasks("A Cold One");
  const capo = await fetchCompletedTasks("Lost Fauxcus");

  const compared = compareTasks({ rmn, capo });

  if (!Bun.deepEquals(cache, compared)) {
    logNewTasks(compared);
    cache = compared;
    printTasks("A Cold One", compared.rmn);
    printTasks("Lost Fauxcus", compared.capo);
  }
}

function sortedByPoints(tasks: Task[]) {
  return [...tasks].sort((a, b) => a.points - b.points);
}

function formatTask(t: Task) {
  return `${t.name} (${t.points}pts)`;
}

function printTasks(label: string, tasks: Task[]) {
  if (tasks.length === 0) return;
  const sorted = sortedByPoints(tasks);
  const grouped = Map.groupBy(sorted, (t) => t.points);
  console.log(`\n${label} unique tasks (${tasks.length}):`);
  for (const [pts, group] of grouped) {
    console.log(`  ${pts}pts:`, group!.map((t) => t.name));
  }
}

function logNewTasks(compared: ComparedTasks) {
  if (!cache) return;

  const newForRmn = compared.rmn.filter(
    (t) => !cache.rmn.some((c) => c.name === t.name)
  );
  const nowCommonForRmn = cache.rmn.filter((t) =>
    compared.capo.some((c) => c.name === t.name)
  );

  if (newForRmn.length > 0) {
    console.log("New unique tasks for A Cold One:", sortedByPoints(newForRmn).map(formatTask));
  }
  if (nowCommonForRmn.length > 0) {
    console.log("Tasks now common (A Cold One):", sortedByPoints(nowCommonForRmn).map(formatTask));
  }

  const newForCapo = compared.capo.filter(
    (t) => !cache.capo.some((c) => c.name === t.name)
  );
  const nowCommonForCapo = cache.capo.filter((t) =>
    compared.rmn.some((c) => c.name === t.name)
  );

  if (newForCapo.length > 0) {
    console.log("New unique tasks for Lost Fauxcus:", sortedByPoints(newForCapo).map(formatTask));
  }
  if (nowCommonForCapo.length > 0) {
    console.log("Tasks now common (Lost Fauxcus):", sortedByPoints(nowCommonForCapo).map(formatTask));
  }
}

function compareTasks({ rmn, capo }: Record<"rmn" | "capo", PlayerTasks>) {
  const rmnNames = new Set(rmn.league_tasks.map((t) => t.name));
  const capoNames = new Set(capo.league_tasks.map((t) => t.name));

  const uniqueToRmn = rmn.league_tasks.filter((t) => !capoNames.has(t.name));
  const uniqueToCapo = capo.league_tasks.filter((t) => !rmnNames.has(t.name));

  return { rmn: uniqueToRmn, capo: uniqueToCapo };
}

async function fetchCompletedTasks(rsn: string): Promise<PlayerTasks> {
  const res = await fetch(
    `https://sync.runescape.wiki/runelite/player/${rsn}/DEMONIC_PACTS_LEAGUE`
  );

  const { username, league_tasks } = (await res.json()) as {
    username: string;
    league_tasks: string[];
  };

  const tasks: Task[] = league_tasks.map((task) => {
    const info = TasksMap.get(task.toString());
    return info ?? { name: task, points: 0 };
  });

  return { username, league_tasks: tasks };
}
