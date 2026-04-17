import React from "react";
import { Text, Box } from "ink";
import type { Settings, LocalConfig } from "../lib/settings";

export function ConfigView({
  settings,
  local,
}: {
  settings: Settings;
  local: LocalConfig | null;
}) {
  return (
    <Box flexDirection="column">
      <Text bold>Effective configuration</Text>
      <Text><Text color="gray">  league:         </Text>{settings.league}</Text>
      <Text><Text color="gray">  wikiTasksUrl:   </Text>{settings.wikiTasksUrl}</Text>
      <Text>
        <Text color="gray">  defaultPlayer:  </Text>
        <Text bold color="yellow">{settings.defaultPlayer}</Text>
        {local?.defaultPlayer ? <Text color="gray"> (from local override)</Text> : null}
      </Text>
      <Text><Text color="gray">  players:        </Text>[{settings.players.join(", ")}]</Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Sources</Text>
        <Text><Text color="gray">  project: </Text>{settings.sources.project}</Text>
        <Text>
          <Text color="gray">  local:   </Text>
          {settings.sources.local ? (
            settings.sources.local
          ) : (
            <Text color="gray">(not set — run "leagues config default &lt;player&gt;" to create)</Text>
          )}
        </Text>
      </Box>

      {local ? (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Local overrides</Text>
          {local.defaultPlayer ? (
            <Text><Text color="gray">  defaultPlayer: </Text>{local.defaultPlayer}</Text>
          ) : null}
          {local.extraPlayers?.length ? (
            <Text><Text color="gray">  extraPlayers:  </Text>[{local.extraPlayers.join(", ")}]</Text>
          ) : null}
          {!local.defaultPlayer && !local.extraPlayers?.length ? (
            <Text color="gray">  (empty)</Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
