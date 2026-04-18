import { Box, Text } from "ink";

import { type Task, TIERS } from "../lib/catalog";
import { tierColor } from "./TierLabel";

function completionColor(pct: number | null): string {
  if (pct === null) return "gray";
  if (pct >= 50) return "green";
  if (pct >= 20) return "cyan";
  if (pct >= 5) return "yellow";
  return "red";
}

function formatPct(pct: number | null): string {
  if (pct === null) return "  N/A";
  if (pct < 0.1) return " <0.1%";
  return `${pct.toFixed(1).padStart(5)}%`;
}

function formatReqs(t: Task): string {
  const skills = t.requirements.skills.map((r) => `${r.skill} ${r.level}`).join(", ");
  const other = t.requirements.other ?? "";
  if (skills && other) return `[${skills} | ${other}]`;
  if (skills) return `[${skills}]`;
  if (other) return `[${other}]`;
  return "";
}

export function TaskList({
  label,
  tasks,
  showCount = true,
  compact = false,
}: {
  label: string;
  tasks: Task[];
  showCount?: boolean;
  compact?: boolean;
}) {
  if (tasks.length === 0) {
    return <Text color="gray">{label}: none</Text>;
  }
  const grouped = new Map<string, Task[]>();
  for (const t of tasks) {
    const list = grouped.get(t.tier);
    if (list) list.push(t);
    else grouped.set(t.tier, [t]);
  }
  return (
    <Box flexDirection="column">
      <Text bold underline>
        {label}
        {showCount ? ` (${tasks.length})` : ""}
      </Text>
      {TIERS.map((tier) => {
        const group = grouped.get(tier);
        if (!group?.length) return null;
        if (compact) {
          return (
            <Box key={tier} flexDirection="column" marginTop={1}>
              <Text color={tierColor(tier)} bold>
                {tier}:
              </Text>
              <Text>{group.map((t) => t.name).join(", ")}</Text>
            </Box>
          );
        }
        return (
          <Box key={tier} flexDirection="column" marginTop={1}>
            <Text color={tierColor(tier)} bold>
              {tier} · {group[0].points}pts · {group.length} task{group.length === 1 ? "" : "s"}
            </Text>
            {group.map((t) => {
              const reqs = formatReqs(t);
              return (
                <Text key={t.id}>
                  <Text color={completionColor(t.completionPct)}>{formatPct(t.completionPct)}</Text>
                  {"  "}
                  {t.name}
                  {reqs ? <Text color="gray"> {reqs}</Text> : null}
                </Text>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
