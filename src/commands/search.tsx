import { argument, option } from "pastel";
import { z } from "zod";

import { Async } from "../components/Async";
import { TaskList } from "../components/TaskList";
import { buildFilter, jsonOption, playerOption } from "../lib/cli-options";
import { getPlayerProgress, searchCatalog } from "../lib/queries";
import { resolvePlayer } from "../lib/settings";

export const description = "Full-text search over task name + description";

export const args = z.array(
  z.string().describe(argument({ name: "query", description: "Search substring" }))
);

export const options = z.object({
  limit: z
    .number()
    .default(50)
    .describe(option({ description: "Cap result count" })),
  player: playerOption,
  completed: z
    .boolean()
    .default(false)
    .describe(option({ description: "Include completed tasks (default: excluded)", alias: "c" })),
  allRegions: z
    .boolean()
    .default(false)
    .describe(option({ description: "Ignore unlockedRegions filter" })),
  withinLevels: z
    .boolean()
    .default(false)
    .describe(
      option({ description: "Only tasks whose skill requirements are all met by the player" })
    ),
  json: jsonOption,
});

type Props = {
  args: z.infer<typeof args>;
  options: z.infer<typeof options>;
};

export default function Search({ args, options }: Props) {
  const query = args.join(" ").trim();
  if (!query) throw new Error("Usage: leagues search <query>");
  return (
    <Async
      loader={async () => {
        const needsPlayer = !options.completed || options.withinLevels;
        const player = needsPlayer ? await getPlayerProgress(resolvePlayer(options.player)) : null;
        const filter = buildFilter(
          { allRegions: options.allRegions, withinLevels: options.withinLevels },
          player?.levels
        );
        const matches = searchCatalog(query, {
          player: options.completed ? undefined : (player ?? undefined),
          filter,
        });
        const tasks = matches.slice(0, options.limit);
        const qualifier = options.completed
          ? player
            ? ` — all tasks (${player.username} levels)`
            : " — all tasks"
          : ` — missing for ${player?.username ?? "default"}`;
        return { label: `Search "${query}"${qualifier}`, tasks };
      }}
      render={TaskList}
      json={options.json}
    />
  );
}
