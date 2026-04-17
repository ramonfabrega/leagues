import { option } from "pastel";
import { z } from "zod";

import { Async } from "../components/Async";
import { LevelGapsView } from "../components/LevelGaps";
import { jsonOption } from "../lib/cli-options";
import { getPlayerProgress, levelGaps } from "../lib/queries";
import { loadSettings, resolvePlayer } from "../lib/settings";

export const description = "Level gaps between players (default: all configured players)";

export const options = z.object({
  players: z
    .array(z.string())
    .optional()
    .describe(option({ description: "Override the configured player list (repeatable)" })),
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };

export default function Levels({ options }: Props) {
  return (
    <Async
      loader={async () => {
        const rsns = options.players?.length
          ? await Promise.all(options.players.map(resolvePlayer))
          : (await loadSettings()).players;
        const progresses = await Promise.all(rsns.map(getPlayerProgress));
        return { players: rsns, diffs: levelGaps(progresses) };
      }}
      render={LevelGapsView}
      json={options.json}
    />
  );
}
