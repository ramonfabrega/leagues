import { argument, option } from "pastel";
import { z } from "zod";

import { CommandBody } from "../components/Async";
import { TaskList } from "../components/TaskList";
import type { Task } from "../lib/catalog";
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
  all: z
    .boolean()
    .default(false)
    .describe(
      option({
        description: "Include completed tasks and ignore unlockedRegions filter",
        alias: "a",
      })
    ),
  allRegions: z
    .boolean()
    .default(false)
    .describe(option({ description: "Ignore unlockedRegions filter" })),
  json: jsonOption,
});

type Props = {
  args: z.infer<typeof args>;
  options: z.infer<typeof options>;
};

type Payload = { query: string; player: string | null; count: number; tasks: Task[] };

export default function Search({ args, options }: Props) {
  const query = args.join(" ").trim();
  if (!query) throw new Error("Usage: leagues search <query>");
  return (
    <CommandBody<Payload>
      run={async () => {
        const player = options.all
          ? null
          : await getPlayerProgress(await resolvePlayer(options.player));
        const filter = await buildFilter({ allRegions: options.all || options.allRegions });
        const matches = await searchCatalog(query, { player: player ?? undefined, filter });
        const tasks = matches.slice(0, options.limit);
        return { query, player: player?.username ?? null, count: tasks.length, tasks };
      }}
      json={options.json}
    >
      {(data) => (
        <TaskList
          label={
            data.player
              ? `Search "${data.query}" — missing for ${data.player}`
              : `Search "${data.query}" — all tasks`
          }
          tasks={data.tasks}
        />
      )}
    </CommandBody>
  );
}
