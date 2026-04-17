import { Text, Box } from "ink";
import type { Task } from "../lib/catalog";
import { TierLabel } from "./TierLabel";

function formatPct(pct: number | null): string {
  if (pct === null) return "N/A";
  if (pct < 0.1) return "<0.1%";
  return `${pct.toFixed(1)}%`;
}

export function TaskDetailsView({ task }: { task: Task }) {
  const reqs = task.requirements;
  const hasReqs = reqs.skills.length > 0 || reqs.other;
  return (
    <Box flexDirection="column">
      <Text bold>#{task.id}  {task.name}</Text>
      <Text color="gray">{task.description}</Text>
      <Box marginTop={1}>
        <Text>
          <TierLabel tier={task.tier} bold />
          {" · "}
          <Text color="yellow">{task.points} pts</Text>
          {" · "}
          <Text color="blue">{task.area}</Text>
          {task.isPactTask ? <Text color="magenta"> · pact</Text> : null}
          {" · completion "}{formatPct(task.completionPct)}
        </Text>
      </Box>
      {hasReqs ? (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Requirements</Text>
          {reqs.skills.map((r) => (
            <Text key={r.skill}>  <Text color="cyan">{r.skill}</Text> {r.level}</Text>
          ))}
          {reqs.other ? <Text color="gray">  {reqs.other}</Text> : null}
        </Box>
      ) : null}
    </Box>
  );
}
