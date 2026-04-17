import React from "react";
import { Text, Box } from "ink";
import type { Task, Tier } from "../lib/catalog";

const TIER_ORDER: Tier[] = ["easy", "medium", "hard", "elite", "master"];

const TIER_COLOR: Record<Tier, string> = {
  easy: "green",
  medium: "cyan",
  hard: "yellow",
  elite: "magenta",
  master: "red",
};

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

export function TaskList({ label, tasks }: { label: string; tasks: Task[] }) {
  if (tasks.length === 0) {
    return <Text color="gray">{label}: none</Text>;
  }
  const grouped = new Map<Tier, Task[]>();
  for (const t of tasks) {
    if (!grouped.has(t.tier)) grouped.set(t.tier, []);
    grouped.get(t.tier)!.push(t);
  }
  return (
    <Box flexDirection="column">
      <Text bold>{label} ({tasks.length})</Text>
      {TIER_ORDER.map((tier) => {
        const group = grouped.get(tier);
        if (!group?.length) return null;
        return (
          <Box key={tier} flexDirection="column" marginTop={1}>
            <Text color={TIER_COLOR[tier]} bold>
              {tier} · {group[0]!.points}pts · {group.length} task{group.length === 1 ? "" : "s"}
            </Text>
            {group.map((t) => (
              <Text key={t.id}>
                  <Text color={completionColor(t.completionPct)}>{formatPct(t.completionPct)}</Text>
                  {"  "}
                  {t.name}
                  {formatReqs(t) ? (
                    <Text color="gray"> {formatReqs(t)}</Text>
                  ) : null}
              </Text>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
