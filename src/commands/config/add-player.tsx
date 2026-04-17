import { Box, Text } from "ink";
import { argument } from "pastel";
import { z } from "zod";

import { Async } from "@/components/Async";
import { addExtraPlayer } from "@/lib/settings";

export const description = "Add a player to your personal extraPlayers list";

export const args = z.tuple([
  z.string().describe(argument({ name: "player", description: "Player RSN to add" })),
]);

type Props = { args: z.infer<typeof args> };

export default function AddPlayer({ args }: Props) {
  const [player] = args;

  return (
    <Async
      loader={() => addExtraPlayer(player)}
      render={(props) => (
        <Box flexDirection="column">
          <Text>
            <Text color="green">✓</Text> added{" "}
            <Text bold color="yellow">
              {player}
            </Text>
          </Text>
          <Text color="gray"> players: [{props.players.join(", ")}]</Text>
          <Text color="gray"> wrote {props.sources.local}</Text>
        </Box>
      )}
    />
  );
}
