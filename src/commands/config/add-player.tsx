import React from "react";
import { z } from "zod";
import { argument } from "pastel";
import { Text, Box } from "ink";
import {
  loadProjectConfig,
  loadLocalConfig,
  writeLocalConfig,
  LOCAL_CONFIG_PATH,
} from "../../lib/settings";
import { CommandBody } from "../../components/Async";

export const description = "Add a player to your personal extraPlayers list";

export const args = z.tuple([
  z.string().describe(argument({ name: "player", description: "Player RSN to add" })),
]);

type Props = { args: z.infer<typeof args> };

type Payload = { added: string; players: string[] };

export default function AddPlayer({ args }: Props) {
  const [player] = args;
  return (
    <CommandBody<Payload>
      run={async () => {
        const [project, local] = await Promise.all([loadProjectConfig(), loadLocalConfig()]);
        if (project.players.some((p) => p.toLowerCase() === player.toLowerCase())) {
          throw new Error(`"${player}" is already in leagues.config.json — no local override needed`);
        }
        const extra = local?.extraPlayers ?? [];
        if (extra.some((p) => p.toLowerCase() === player.toLowerCase())) {
          throw new Error(`"${player}" is already in your local extraPlayers`);
        }
        const next = { ...(local ?? {}), extraPlayers: [...extra, player] };
        await writeLocalConfig(next);
        return { added: player, players: [...project.players, ...next.extraPlayers!] };
      }}
    >
      {(data) => (
        <Box flexDirection="column">
          <Text>
            <Text color="green">✓</Text> added <Text bold color="yellow">{data.added}</Text>
          </Text>
          <Text color="gray">  players: [{data.players.join(", ")}]</Text>
          <Text color="gray">  wrote {LOCAL_CONFIG_PATH}</Text>
        </Box>
      )}
    </CommandBody>
  );
}
