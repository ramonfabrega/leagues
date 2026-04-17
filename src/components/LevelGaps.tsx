import { Box, Text } from "ink";

import type { LevelDiff } from "../lib/queries";

export function LevelGapsView({ players, diffs }: { players: string[]; diffs: LevelDiff[] }) {
  if (diffs.length === 0) {
    return <Text color="green">No notable level gaps between [{players.join(", ")}].</Text>;
  }
  const nameWidth = Math.max(...players.map((p) => p.length));
  return (
    <Box flexDirection="column">
      <Text bold>Level gaps (low → high)</Text>
      {diffs.map((d) => (
        <Box key={d.skill} flexDirection="column" marginTop={1}>
          <Text>
            <Text color="cyan" bold>
              {d.skill.padEnd(14)}
            </Text>
            <Text color="yellow">Δ{d.diff}</Text>
          </Text>
          {Object.entries(d.levels).map(([name, lvl]) => (
            <Text key={name}>
              <Text color="gray"> {name.padEnd(nameWidth)}</Text>
              {"  "}
              {lvl}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}
