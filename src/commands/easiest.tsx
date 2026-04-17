import { option } from "pastel";
import { z } from "zod";

import { Async } from "../components/Async";
import { TaskList } from "../components/TaskList";
import { buildFilter, filterOptions, jsonOption, playerOption } from "../lib/cli-options";
import { easiestMissing, getPlayerProgress } from "../lib/queries";
import { resolvePlayer } from "../lib/settings";

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

export default function Easiest({ options }: Props) {
  return (
    <Async
      loader={async () => {
        const player = await getPlayerProgress(await resolvePlayer(options.player));
        const tasks = await easiestMissing(player, await buildFilter(options), options.limit);
        const label = `Easiest missing for ${player.username}`;
        return { label, tasks };
      }}
      render={TaskList}
      json={options.json}
    />
  );
}
