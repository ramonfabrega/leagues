import { z } from "zod";
import { option } from "pastel";
import { otherPlayers, resolvePlayer } from "../lib/settings";
import { getPlayerProgress, uniqueTasks } from "../lib/queries";
import type { Task } from "../lib/catalog";
import { CommandBody } from "../components/Async";
import { TaskList } from "../components/TaskList";
import { jsonOption, playerOption } from "../lib/cli-options";

export const description = "Tasks the player has that others don't";

export const options = z.object({
  player: playerOption,
  vs: z
    .array(z.string())
    .optional()
    .describe(option({ description: "Players to compare against (repeatable; defaults to all other configured players)" })),
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };

type Payload = { player: string; vs: string[]; count: number; tasks: Task[] };

export default function UniqueCmd({ options }: Props) {
  return (
    <CommandBody<Payload>
      run={async () => {
        const targetName = await resolvePlayer(options.player);
        const vsNames = options.vs?.length
          ? await Promise.all(options.vs.map((s) => resolvePlayer(s.trim())))
          : await otherPlayers(targetName);
        const [target, ...others] = await Promise.all(
          [targetName, ...vsNames].map(getPlayerProgress)
        );
        const tasks = uniqueTasks(target!, others);
        return { player: target!.username, vs: vsNames, count: tasks.length, tasks };
      }}
      json={options.json}
    >
      {(data) => (
        <TaskList
          label={`${data.player} unique vs [${data.vs.join(", ")}]`}
          tasks={data.tasks}
        />
      )}
    </CommandBody>
  );
}
