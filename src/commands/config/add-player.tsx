import { Box, Text } from "ink";
import { argument } from "pastel";
import { z } from "zod";

import { CommandBody } from "../../components/Async";
import { addExtraPlayer, type Settings } from "../../lib/settings";

export const description = "Add a player to your personal extraPlayers list";

export const args = z.tuple([
  z.string().describe(argument({ name: "player", description: "Player RSN to add" })),
]);

type Props = { args: z.infer<typeof args> };

export default function AddPlayer({ args }: Props) {
  const [player] = args;
  return (
    <CommandBody<Settings> run={() => addExtraPlayer(player)}>
      {(settings) => (
        <Box flexDirection="column">
          <Text>
            <Text color="green">✓</Text> added{" "}
            <Text bold color="yellow">
              {player}
            </Text>
          </Text>
          <Text color="gray"> players: [{settings.players.join(", ")}]</Text>
          <Text color="gray"> wrote {settings.sources.local}</Text>
        </Box>
      )}
    </CommandBody>
  );
}
