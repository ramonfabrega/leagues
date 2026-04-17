import { z } from "zod";
import { argument } from "pastel";
import { Text, Box } from "ink";
import { setDefaultPlayer, type Settings } from "../../lib/settings";
import { CommandBody } from "../../components/Async";

export const description = "Set your personal default player (writes leagues.local.json)";

export const args = z.tuple([
  z.string().describe(argument({ name: "player", description: "Player RSN to use as default" })),
]);

type Props = { args: z.infer<typeof args> };

export default function SetDefault({ args }: Props) {
  const [player] = args;
  return (
    <CommandBody<Settings>
      run={() => setDefaultPlayer(player)}
    >
      {(settings) => (
        <Box flexDirection="column">
          <Text>
            <Text color="green">✓</Text> default player set to <Text bold color="yellow">{settings.defaultPlayer}</Text>
          </Text>
          <Text color="gray">  wrote {settings.sources.local}</Text>
        </Box>
      )}
    </CommandBody>
  );
}
