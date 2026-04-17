import { option } from "pastel";
import { z } from "zod";

import { Async } from "../components/Async";
import { TaskList } from "../components/TaskList";
import { jsonOption, playerOption } from "../lib/cli-options";
import { getPlayerProgress, uniqueTasks } from "../lib/queries";
import { otherPlayers, resolvePlayer } from "../lib/settings";

export const description = "Tasks the player has that others don't";

export const options = z.object({
  player: playerOption,
  vs: z
    .array(z.string())
    .optional()
    .describe(
      option({
        description:
          "Players to compare against (repeatable; defaults to all other configured players)",
      })
    ),
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };

export default function UniqueCmd({ options }: Props) {
  return (
    <Async
      loader={async () => {
        const targetName = await resolvePlayer(options.player);
        const vsNames = options.vs?.length
          ? await Promise.all(options.vs.map((s) => resolvePlayer(s.trim())))
          : await otherPlayers(targetName);
        const [target, ...others] = await Promise.all(
          [targetName, ...vsNames].map(getPlayerProgress)
        );
        const tasks = uniqueTasks(target!, others);
        return {
          label: `${target!.username} unique vs [${vsNames.join(", ")}]`,
          tasks,
        };
      }}
      render={TaskList}
      json={options.json}
    />
  );
}
