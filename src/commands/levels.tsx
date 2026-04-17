import { z } from "zod";
import { option } from "pastel";
import { loadSettings, resolvePlayer } from "../lib/settings";
import { getPlayerProgress, levelGaps, type LevelDiff } from "../lib/queries";
import { CommandBody } from "../components/Async";
import { LevelGapsView } from "../components/LevelGaps";
import { jsonOption } from "../lib/cli-options";

export const description = "Level gaps between players (default: all configured players)";

export const options = z.object({
  players: z
    .array(z.string())
    .optional()
    .describe(option({ description: "Override the configured player list (repeatable)" })),
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };
type Payload = { players: string[]; diffs: LevelDiff[] };

export default function Levels({ options }: Props) {
  return (
    <CommandBody<Payload>
      run={async () => {
        const rsns = options.players?.length
          ? await Promise.all(options.players.map(resolvePlayer))
          : (await loadSettings()).players;
        const progresses = await Promise.all(rsns.map(getPlayerProgress));
        return { players: rsns, diffs: levelGaps(progresses) };
      }}
      json={options.json}
    >
      {(data) => <LevelGapsView players={data.players} diffs={data.diffs} />}
    </CommandBody>
  );
}
