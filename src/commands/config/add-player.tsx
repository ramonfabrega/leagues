import { z } from "zod";
import { argument } from "pastel";
import { Text, Box } from "ink";
import { addExtraPlayer, type Settings } from "../../lib/settings";
import { CommandBody } from "../../components/Async";

export const description = "Add a player to your personal extraPlayers list";

export const args = z.tuple([
  z.string().describe(argument({ name: "player", description: "Player RSN to add" })),
]);

type Props = { args: z.infer<typeof args> };

export default function AddPlayer({ args }: Props) {
  const [player] = args;
  return (
    <CommandBody<Settings>
      run={() => addExtraPlayer(player)}
    >
      {(settings) => (
        <Box flexDirection="column">
          <Text>
            <Text color="green">✓</Text> added <Text bold color="yellow">{player}</Text>
          </Text>
          <Text color="gray">  players: [{settings.players.join(", ")}]</Text>
          <Text color="gray">  wrote {settings.sources.local}</Text>
        </Box>
      )}
    </CommandBody>
  );
}
