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
        const targetName = resolvePlayer(options.player);
        const vsNames = options.vs?.length
          ? options.vs.map((s) => resolvePlayer(s.trim()))
          : otherPlayers(targetName);
        const [target, others] = await Promise.all([
          getPlayerProgress(targetName),
          Promise.all(vsNames.map(getPlayerProgress)),
        ]);
        return {
          label: `${target.username} unique vs [${vsNames.join(", ")}]`,
          tasks: uniqueTasks(target, others),
        };
      }}
      render={TaskList}
      json={options.json}
    />
  );
}
