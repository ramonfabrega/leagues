import React from "react";
import { z } from "zod";
import { argument } from "pastel";
import { Text, Box } from "ink";
import {
  loadLocalConfig,
  writeLocalConfig,
  LOCAL_CONFIG_PATH,
} from "../../lib/settings";
import { CommandBody } from "../../components/Async";

export const description = "Remove a player from your personal extraPlayers list";

export const args = z.tuple([
  z.string().describe(argument({ name: "player", description: "Player RSN to remove" })),
]);

type Props = { args: z.infer<typeof args> };

type Payload = { removed: string };

export default function RemovePlayer({ args }: Props) {
  const [player] = args;
  return (
    <CommandBody<Payload>
      run={async () => {
        const local = await loadLocalConfig();
        const extra = local?.extraPlayers ?? [];
        const next = extra.filter((p) => p.toLowerCase() !== player.toLowerCase());
        if (next.length === extra.length) {
          throw new Error(`"${player}" is not in your local extraPlayers`);
        }
        await writeLocalConfig({ ...(local ?? {}), extraPlayers: next });
        return { removed: player };
      }}
    >
      {(data) => (
        <Box flexDirection="column">
          <Text>
            <Text color="magenta">✗</Text> removed <Text bold>{data.removed}</Text>
          </Text>
          <Text color="gray">  wrote {LOCAL_CONFIG_PATH}</Text>
        </Box>
      )}
    </CommandBody>
  );
}
