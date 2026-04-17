import { z } from "zod";
import { option } from "pastel";
import { loadSettings, resolvePlayer } from "../lib/settings";
import { easiestMissing, getPlayerProgress } from "../lib/queries";
import type { Task } from "../lib/catalog";
import { CommandBody } from "../components/Async";
import { TaskList } from "../components/TaskList";
import { buildFilter, filterOptions, jsonOption, playerOption } from "../lib/cli-options";

export const description = "Missing tasks ranked by highest wiki completion % (likely easiest)";

export const options = z.object({
  player: playerOption,
  limit: z.number().default(20).describe(option({ description: "Cap result count" })),
  json: jsonOption,
  ...filterOptions,
});

type Props = { options: z.infer<typeof options> };
type Payload = { player: string; count: number; tasks: Task[] };

export default function Easiest({ options }: Props) {
  return (
    <CommandBody<Payload>
      run={async () => {
        const settings = await loadSettings();
        const player = await getPlayerProgress(resolvePlayer(settings, options.player));
        const tasks = await easiestMissing(player, buildFilter(options), options.limit);
        return { player: player.username, count: tasks.length, tasks };
      }}
      json={options.json}
    >
      {(data) => <TaskList label={`Easiest missing for ${data.player}`} tasks={data.tasks} />}
    </CommandBody>
  );
}
