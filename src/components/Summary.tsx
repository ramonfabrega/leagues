import React from "react";
import { Text, Box } from "ink";
import type { Tier } from "../lib/catalog";
import type { TierBreakdown } from "../lib/queries";

const TIER_ORDER: Tier[] = ["easy", "medium", "hard", "elite", "master"];
const TIER_COLOR: Record<Tier, string> = {
  easy: "green",
  medium: "cyan",
  hard: "yellow",
  elite: "magenta",
  master: "red",
};

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
        {p.username}  ·  <Text color="yellow">{p.totalPoints.toLocaleString()} pts</Text>  ·  {p.completedCount} / {p.totalTaskCount} tasks
      </Text>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>By tier</Text>
        {TIER_ORDER.map((tier) => {
          const done = p.byTier[tier];
          const total = p.totalByTier[tier];
          const pct = total.count === 0 ? 0 : (done.count / total.count) * 100;
          return (
            <Text key={tier}>
              <Text color={TIER_COLOR[tier]}>  {tier.padEnd(7)}</Text>
              {String(done.count).padStart(3)} / {String(total.count).padEnd(4)}
              ({pct.toFixed(0).padStart(3)}%)
              <Text color="gray">   {done.points.toLocaleString()} / {total.points.toLocaleString()} pts</Text>
            </Text>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>By area</Text>
        {Object.entries(p.byArea)
          .sort((a, b) => b[1] - a[1])
          .map(([area, count]) => (
            <Text key={area}>  {area.padEnd(12)} <Text color="cyan">{count}</Text></Text>
          ))}
      </Box>

      {p.unknownTaskIds.length > 0 ? (
        <Box marginTop={1}>
          <Text color="yellow">
            ⚠ {p.unknownTaskIds.length} unknown task id{p.unknownTaskIds.length === 1 ? "" : "s"} — run "leagues scrape" to refresh
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
