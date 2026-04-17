import { z } from "zod";
import { argument } from "pastel";
import { Text, Box } from "ink";
import { removeExtraPlayer, type Settings } from "../../lib/settings";
import { CommandBody } from "../../components/Async";

export const description = "Remove a player from your personal extraPlayers list";

export const args = z.tuple([
  z.string().describe(argument({ name: "player", description: "Player RSN to remove" })),
]);

type Props = { args: z.infer<typeof args> };

export default function RemovePlayer({ args }: Props) {
  const [player] = args;
  return (
    <CommandBody<Settings>
      run={() => removeExtraPlayer(player)}
    >
      {(settings) => (
        <Box flexDirection="column">
          <Text>
            <Text color="magenta">✗</Text> removed <Text bold>{player}</Text>
          </Text>
          <Text color="gray">  wrote {settings.sources.local}</Text>
        </Box>
      )}
    </CommandBody>
  );
}
