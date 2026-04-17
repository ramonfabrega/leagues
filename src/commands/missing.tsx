import React from "react";
import { z } from "zod";
import { resolvePlayer } from "../../leagues.config";
import { getPlayerProgress, missingTasks, type TaskFilter } from "../lib/queries";
import type { Task } from "../lib/catalog";
import { CommandBody } from "../components/Async";
import { TaskList } from "../components/TaskList";
import { jsonOption, playerOption, limitOption, filterOptions } from "../lib/cli-options";

export const description = "Tasks the player has not completed";

export const options = z.object({
  player: playerOption,
  limit: limitOption,
  json: jsonOption,
  ...filterOptions,
});

type Props = { options: z.infer<typeof options> };

type Payload = { player: string; count: number; tasks: Task[] };

export default function Missing({ options }: Props) {
  const rsn = resolvePlayer(options.player);
  const filter: TaskFilter = {
    skill: options.skill,
    tier: options.tier,
    area: options.area,
    maxPoints: options.maxPoints,
    minPoints: options.minPoints,
    minCompletionPct: options.minCompletion,
    maxCompletionPct: options.maxCompletion,
    pactOnly: options.pactOnly,
  };
  return (
    <CommandBody<Payload>
      run={async () => {
        const player = await getPlayerProgress(rsn);
        const all = await missingTasks(player, filter);
        const tasks = options.limit ? all.slice(0, options.limit) : all;
        return { player: player.username, count: tasks.length, tasks };
      }}
      json={options.json}
      loadingLabel={`Fetching ${rsn}`}
    >
      {(data) => <TaskList label={`Missing for ${data.player}`} tasks={data.tasks} />}
    </CommandBody>
  );
}
