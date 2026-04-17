import React from "react";
import { z } from "zod";
import { option, argument } from "pastel";
import { loadSettings, resolvePlayer } from "../lib/settings";
import { CompareOnce, CompareWatch } from "../components/Compare";
import { jsonOption } from "../lib/cli-options";
import { CommandBody } from "../components/Async";

export const description = "Diff unique tasks between two or more players";

export const args = z
  .array(
    z.string().describe(
      argument({ name: "player", description: "Player RSN (2+ required; defaults to configured players if omitted)" })
    )
  )
  .default([]);

export const options = z.object({
  watch: z
    .boolean()
    .default(false)
    .describe(option({ description: "Poll continuously and highlight diffs on change", alias: "w" })),
  interval: z
    .number()
    .default(10)
    .describe(option({ description: "Watch poll interval in seconds" })),
  json: jsonOption,
});

type Props = {
  args: z.infer<typeof args>;
  options: z.infer<typeof options>;
};

export default function Compare({ args, options }: Props) {
  return (
    <CommandBody<{ players: string[] }>
      run={async () => {
        const settings = await loadSettings();
        const players = args.length >= 2
          ? args.map((a) => resolvePlayer(settings, a))
          : [...settings.players];
        if (players.length < 2) {
          throw new Error("compare needs at least 2 players (pass them as args or configure them via leagues config)");
        }
        return { players };
      }}
    >
      {(data) =>
        options.watch ? (
          <CompareWatch players={data.players} intervalMs={options.interval * 1000} />
        ) : (
          <CompareOnce players={data.players} json={options.json} />
        )
      }
    </CommandBody>
  );
}
