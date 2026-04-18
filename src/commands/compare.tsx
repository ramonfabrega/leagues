import { argument, option } from "pastel";
import { z } from "zod";

import { CompareOnce, CompareWatch } from "../components/Compare";
import { jsonOption } from "../lib/cli-options";

export const description = "Diff unique tasks between two or more players";

export const args = z
  .array(
    z.string().describe(
      argument({
        name: "player",
        description: "Player RSN (2+ required; defaults to configured players if omitted)",
      })
    )
  )
  .default([]);

export const options = z.object({
  watch: z
    .boolean()
    .default(false)
    .describe(
      option({ description: "Poll continuously and highlight diffs on change", alias: "w" })
    ),
  interval: z
    .number()
    .default(10)
    .describe(option({ description: "Watch poll interval in seconds" })),
  compact: z
    .boolean()
    .default(false)
    .describe(option({ description: "Compact output: task names only, grouped by tier", alias: "c" })),
  json: jsonOption,
});

type Props = { args: z.infer<typeof args>; options: z.infer<typeof options> };

let altScreenEntered = false;
function enterAltScreen() {
  if (altScreenEntered || !process.stdout.isTTY) return;
  altScreenEntered = true;
  process.stdout.write("\x1b[?1049h\x1b[H");
  process.once("exit", () => {
    process.stdout.write("\x1b[?1049l");
  });
}

export default function Compare({ args, options }: Props) {
  if (options.watch) enterAltScreen();
  return options.watch ? (
    <CompareWatch args={args} intervalMs={options.interval * 1000} compact={options.compact} />
  ) : (
    <CompareOnce args={args} json={options.json} compact={options.compact} />
  );
}
