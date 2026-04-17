import React from "react";
import { z } from "zod";
import { option } from "pastel";
import { resolvePlayer } from "../../leagues.config";
import { getPlayerProgress, easiestMissing, type TaskFilter } from "../lib/queries";
import type { Task } from "../lib/catalog";
import { CommandBody } from "../components/Async";
import { TaskList } from "../components/TaskList";
import { jsonOption, playerOption, filterOptions } from "../lib/cli-options";

export const description = "Missing tasks ranked by highest wiki completion % (likely easiest)";

export const options = z.object({
  player: playerOption,
  limit: z
    .number()
    .default(20)
    .describe(option({ description: "Cap result count" })),
  json: jsonOption,
  ...filterOptions,
});

type Props = { options: z.infer<typeof options> };

type Payload = { player: string; count: number; tasks: Task[] };

export default function Easiest({ options }: Props) {
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
        const tasks = await easiestMissing(player, filter, options.limit);
        return { player: player.username, count: tasks.length, tasks };
      }}
      json={options.json}
      loadingLabel={`Fetching ${rsn}`}
    >
      {(data) => <TaskList label={`Easiest missing for ${data.player}`} tasks={data.tasks} />}
    </CommandBody>
  );
}
