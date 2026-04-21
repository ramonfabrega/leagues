import { z } from "zod";

import { Async } from "../components/Async";
import { TaskList } from "../components/TaskList";
import {
  buildFilter,
  filterOptions,
  jsonOption,
  limitOption,
  playerOption,
} from "../lib/cli-options";
import { getPlayerProgress, missingTasks } from "../lib/queries";
import { resolvePlayer } from "../lib/settings";

export const description = "Tasks the player has not completed";

export const options = z.object({
  player: playerOption,
  limit: limitOption,
  json: jsonOption,
  ...filterOptions,
});

type Props = { options: z.infer<typeof options> };

export default function Missing({ options }: Props) {
  return (
    <Async
      loader={async () => {
        const player = await getPlayerProgress(resolvePlayer(options.player));
        const all = missingTasks(player, buildFilter(options, player.levels));
        const tasks = options.limit ? all.slice(0, options.limit) : all;
        return { label: `Missing for ${player.username}`, tasks };
      }}
      render={TaskList}
      json={options.json}
    />
  );
}
