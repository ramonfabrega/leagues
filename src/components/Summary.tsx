import { Box, Text } from "ink";

import { TIERS } from "../lib/catalog";
import type { TierBreakdown } from "../lib/queries";
import { tierColor } from "./TierLabel";

export type SummaryPayload = {
  username: string;
  totalPoints: number;
  completedCount: number;
  totalTaskCount: number;
  byTier: TierBreakdown;
  totalByTier: TierBreakdown;
  byArea: Record<string, number>;
  unknownTaskIds: string[];
  levels: Record<string, number>;
};

export function SummaryView(p: SummaryPayload) {
  return (
    <Box flexDirection="column">
      <Text bold>
        {p.username} · <Text color="yellow">{p.totalPoints.toLocaleString()} pts</Text> ·{" "}
        {p.completedCount} / {p.totalTaskCount} tasks
      </Text>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>By tier</Text>
        {TIERS.map((tier) => {
          const done = p.byTier[tier];
          const total = p.totalByTier[tier];
          const pct = total.count === 0 ? 0 : (done.count / total.count) * 100;
          return (
            <Text key={tier}>
              <Text color={tierColor(tier)}> {tier.padEnd(7)}</Text>
              {String(done.count).padStart(3)} / {String(total.count).padEnd(4)}(
              {pct.toFixed(0).padStart(3)}%)
              <Text color="gray">
                {" "}
                {done.points.toLocaleString()} / {total.points.toLocaleString()} pts
              </Text>
            </Text>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>By area</Text>
        {Object.entries(p.byArea)
          .sort((a, b) => b[1] - a[1])
          .map(([area, count]) => (
            <Text key={area}>
              {" "}
              {area.padEnd(12)} <Text color="cyan">{count}</Text>
            </Text>
          ))}
      </Box>

      {p.unknownTaskIds.length > 0 ? (
        <Box marginTop={1}>
          <Text color="yellow">
            ⚠ {p.unknownTaskIds.length} unknown task id{p.unknownTaskIds.length === 1 ? "" : "s"} —
            run "leagues scrape" to refresh
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
