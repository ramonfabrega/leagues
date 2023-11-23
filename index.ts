import { TasksMap } from "./constants";

type TasksResponse = {
  username: string;
  league_tasks: string[];
};

let cache: ReturnType<typeof compareTasks>;

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

  if (!Bun.deepEquals(cache, compared)) {
    if (cache) {
      // Log new tasks for rmn
      const newTasksForRmn = compared.rmn.filter(
        (task) => !cache.rmn.includes(task)
      );
      if (newTasksForRmn.length > 0) {
        console.log("New tasks for rmn:", newTasksForRmn);
      }

      // Log new tasks for capo
      const newTasksForCapo = compared.capo.filter(
        (task) => !cache.capo.includes(task)
      );
      if (newTasksForCapo.length > 0) {
        console.log("New tasks for capo:", newTasksForCapo);
      }
    }
    // log the difference between cache and compared
    cache = compared;
    console.log(compared);
  }
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
