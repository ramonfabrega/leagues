import { z } from "zod";
import { resolvePlayer } from "../lib/settings";
import { getPlayerProgress, missingTasks } from "../lib/queries";
import type { Task } from "../lib/catalog";
import { CommandBody } from "../components/Async";
import { TaskList } from "../components/TaskList";
import { buildFilter, filterOptions, jsonOption, limitOption, playerOption } from "../lib/cli-options";

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
  return (
    <CommandBody<Payload>
      run={async () => {
        const player = await getPlayerProgress(await resolvePlayer(options.player));
        const all = await missingTasks(player, buildFilter(options));
        const tasks = options.limit ? all.slice(0, options.limit) : all;
        return { player: player.username, count: tasks.length, tasks };
      }}
      json={options.json}
    >
      {(data) => <TaskList label={`Missing for ${data.player}`} tasks={data.tasks} />}
    </CommandBody>
  );
}
