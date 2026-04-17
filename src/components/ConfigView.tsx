import { Text, Box } from "ink";
import type { Settings } from "../lib/settings";

export function ConfigView({ settings }: { settings: Settings }) {
  const { overrides } = settings;
  const hasLocal = settings.sources.local !== null;
  const hasAnyOverride = overrides.defaultPlayer !== null || overrides.extraPlayers.length > 0;
  return (
    <Box flexDirection="column">
      <Text bold>Effective configuration</Text>
      <Text><Text color="gray">  league:         </Text>{settings.league}</Text>
      <Text><Text color="gray">  wikiTasksUrl:   </Text>{settings.wikiTasksUrl}</Text>
      <Text>
        <Text color="gray">  defaultPlayer:  </Text>
        <Text bold color="yellow">{settings.defaultPlayer}</Text>
        {overrides.defaultPlayer ? <Text color="gray"> (from local override)</Text> : null}
      </Text>
      <Text><Text color="gray">  players:        </Text>[{settings.players.join(", ")}]</Text>
      <Text>
        <Text color="gray">  unlockedRegions:</Text>
        {settings.unlockedRegions.length > 0
          ? ` [${settings.unlockedRegions.join(", ")}]`
          : <Text color="gray"> (none — run "leagues config regions")</Text>}
      </Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Sources</Text>
        <Text><Text color="gray">  project: </Text>{settings.sources.project}</Text>
        <Text>
          <Text color="gray">  local:   </Text>
          {settings.sources.local ?? (
            <Text color="gray">(not set — run "leagues config default &lt;player&gt;" to create)</Text>
          )}
        </Text>
      </Box>

      {hasLocal ? (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Local overrides</Text>
          {overrides.defaultPlayer ? (
            <Text><Text color="gray">  defaultPlayer: </Text>{overrides.defaultPlayer}</Text>
          ) : null}
          {overrides.extraPlayers.length > 0 ? (
            <Text><Text color="gray">  extraPlayers:  </Text>[{overrides.extraPlayers.join(", ")}]</Text>
          ) : null}
          {!hasAnyOverride ? <Text color="gray">  (empty)</Text> : null}
        </Box>
      ) : null}
    </Box>
  );
}
