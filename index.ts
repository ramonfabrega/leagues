import { TasksMap } from "./constants";

type TasksResponse = {
  username: string;
  league_tasks: Array<number | string>;
};

(async () => {
  while (true) {
    await run();
    await sleep(10000);
  }
})();

async function run() {
  const rmn = await fetchCompletedTasks("rmn69");
  const capo = await fetchCompletedTasks("elcapo42069");

  const compared = compareTasks({ rmn, capo });

  console.log(compared);
}

function compareTasks({ rmn, capo }: Record<"rmn" | "capo", TasksResponse>) {
  // Find tasks that are unique to rmn
  const uniqueToRmn = rmn.league_tasks.filter(
    (task) => !capo.league_tasks.includes(task)
  );

  // Find tasks that are unique to capo
  const uniqueToCapo = capo.league_tasks.filter(
    (task) => !rmn.league_tasks.includes(task)
  );

  return { rmn: uniqueToRmn, capo: uniqueToCapo };
}

async function fetchCompletedTasks(rsn: string) {
  const res = await fetch(
    `https://sync.runescape.wiki/runelite/player/${rsn}/TRAILBLAZER_RELOADED_LEAGUE`
  );

  const { username, league_tasks } = (await res.json()) as TasksResponse;

  const tasks = league_tasks.map(
    (task) => TasksMap.get(task.toString()) || task
  );

  return { username, league_tasks: tasks };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
