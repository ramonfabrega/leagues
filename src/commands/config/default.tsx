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

export const description = "Set your personal default player (writes leagues.local.json)";

export const args = z.tuple([
  z.string().describe(argument({ name: "player", description: "Player RSN to use as default" })),
]);

type Props = { args: z.infer<typeof args> };

type Payload = { defaultPlayer: string; path: string };

export default function SetDefault({ args }: Props) {
  const [player] = args;
  return (
    <CommandBody<Payload>
      run={async () => {
        const [project, local] = await Promise.all([loadProjectConfig(), loadLocalConfig()]);
        const extra = local?.extraPlayers ?? [];
        const known = [...project.players, ...extra];
        if (!known.some((p) => p.toLowerCase() === player.toLowerCase())) {
          throw new Error(
            `"${player}" isn't in the known player list [${known.join(", ")}]. ` +
              `Add them first: leagues config add-player "${player}"`
          );
        }
        const next = { ...(local ?? {}), defaultPlayer: player };
        await writeLocalConfig(next);
        return { defaultPlayer: player, path: LOCAL_CONFIG_PATH };
      }}
    >
      {(data) => (
        <Box flexDirection="column">
          <Text>
            <Text color="green">✓</Text> default player set to <Text bold color="yellow">{data.defaultPlayer}</Text>
          </Text>
          <Text color="gray">  wrote {data.path}</Text>
        </Box>
      )}
    </CommandBody>
  );
}
