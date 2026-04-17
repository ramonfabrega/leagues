import React from "react";
import { Text, Box } from "ink";
import type { Task, Tier } from "../lib/catalog";

const TIER_COLOR: Record<Tier, string> = {
  easy: "green",
  medium: "cyan",
  hard: "yellow",
  elite: "magenta",
  master: "red",
};

export function TaskDetailsView({ task }: { task: Task }) {
  const pct = task.completionPct === null
    ? "N/A"
    : task.completionPct < 0.1
      ? "<0.1%"
      : `${task.completionPct.toFixed(1)}%`;
  return (
    <Box flexDirection="column">
      <Text bold>#{task.id}  {task.name}</Text>
      <Text color="gray">{task.description}</Text>
      <Box marginTop={1}>
        <Text>
          <Text color={TIER_COLOR[task.tier]} bold>{task.tier}</Text>
          {" · "}
          <Text color="yellow">{task.points} pts</Text>
          {" · "}
          <Text color="blue">{task.area}</Text>
          {task.isPactTask ? <Text color="magenta"> · pact</Text> : null}
          {" · "}
          <Text>completion {pct}</Text>
        </Text>
      </Box>
      {task.requirements.skills.length > 0 || task.requirements.other ? (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Requirements</Text>
          {task.requirements.skills.map((r) => (
            <Text key={r.skill}>  <Text color="cyan">{r.skill}</Text> {r.level}</Text>
          ))}
          {task.requirements.other ? (
            <Text>  <Text color="gray">{task.requirements.other}</Text></Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
