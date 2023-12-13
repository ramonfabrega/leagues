import { TasksMap } from "./constants";

type TasksResponse = {
  username: string;
  league_tasks: string[];
};

type ComparedTasks = ReturnType<typeof compareTasks>;

let cache: ComparedTasks;

while (true) {
  await run();
  await Bun.sleep(10000);
}

async function run() {
  const rmn = await fetchCompletedTasks("rmn420");
  const capo = await fetchCompletedTasks("elcapo69420");

  const compared = compareTasks({ rmn, capo });

  if (!Bun.deepEquals(cache, compared)) {
    logNewTasks(compared);
    cache = compared;
    console.log(compared);
  }
}

function logNewTasks(compared: ComparedTasks) {
  if (cache) {
    const newTasksForRmn = compared.rmn.filter(
      (task) => !cache.rmn.includes(task)
    );
    const nowCommonTasksForRmn = cache.rmn.filter((task) =>
      compared.capo.includes(task)
    );

    if (newTasksForRmn.length > 0) {
      console.log("New tasks for rmn:", newTasksForRmn);
    }
    if (nowCommonTasksForRmn.length > 0) {
      console.log("Tasks now common for rmn:", nowCommonTasksForRmn);
    }

    const newTasksForCapo = compared.capo.filter(
      (task) => !cache.capo.includes(task)
    );
    const nowCommonTasksForCapo = cache.capo.filter((task) =>
      compared.rmn.includes(task)
    );

    if (newTasksForCapo.length > 0) {
      console.log("New tasks for capo:", newTasksForCapo);
    }
    if (nowCommonTasksForCapo.length > 0) {
      console.log("Tasks now common for capo:", nowCommonTasksForCapo);
    }
  }
}

function compareTasks({ rmn, capo }: Record<"rmn" | "capo", TasksResponse>) {
  const uniqueToRmn = rmn.league_tasks.filter(
    (task) => !capo.league_tasks.includes(task)
  );

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
