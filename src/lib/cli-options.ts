import { option } from "pastel";
import { z } from "zod";

import { TIERS } from "./catalog";
import type { TaskFilter } from "./queries";
import { effectiveUnlockedRegions, loadSettings } from "./settings";

export const jsonOption = z
  .boolean()
  .default(false)
  .describe(option({ description: "Output JSON instead of pretty text", alias: "j" }));

export const playerOption = z
  .string()
  .optional()
  .describe(
    option({ description: "Player RSN (defaults to configured defaultPlayer)", alias: "p" })
  );

export const limitOption = z
  .number()
  .optional()
  .describe(option({ description: "Cap result count" }));

export const filterOptions = {
  skill: z
    .string()
    .optional()
    .describe(option({ description: "Only tasks requiring this skill" })),
  tier: z
    .enum(TIERS)
    .optional()
    .describe(option({ description: "Filter by tier" })),
  area: z
    .string()
    .optional()
    .describe(option({ description: "Filter by area (e.g. general, tirannwn, varlamore)" })),
  maxPoints: z
    .number()
    .optional()
    .describe(option({ description: "Only tasks worth <= N points" })),
  minPoints: z
    .number()
    .optional()
    .describe(option({ description: "Only tasks worth >= N points" })),
  minCompletion: z
    .number()
    .optional()
    .describe(option({ description: "Only tasks with >= N% wiki completion" })),
  maxCompletion: z
    .number()
    .optional()
    .describe(option({ description: "Only tasks with <= N% wiki completion" })),
  pactOnly: z
    .boolean()
    .default(false)
    .describe(option({ description: "Only pact-specific tasks" })),
  allRegions: z
    .boolean()
    .default(false)
    .describe(
      option({ description: "Ignore unlockedRegions filter and show tasks from all regions" })
    ),
};

type FilterInput = {
  skill?: string;
  tier?: (typeof TIERS)[number];
  area?: string;
  maxPoints?: number;
  minPoints?: number;
  minCompletion?: number;
  maxCompletion?: number;
  pactOnly?: boolean;
  allRegions?: boolean;
};

export function buildFilter(o: FilterInput): TaskFilter {
  const base: TaskFilter = {
    skill: o.skill,
    tier: o.tier,
    area: o.area,
    maxPoints: o.maxPoints,
    minPoints: o.minPoints,
    minCompletionPct: o.minCompletion,
    maxCompletionPct: o.maxCompletion,
    pactOnly: o.pactOnly,
  };
  if (o.allRegions || o.area) return base;
  const { unlockedRegions } = loadSettings();
  if (unlockedRegions.length === 0) return base;
  return { ...base, areas: [...effectiveUnlockedRegions(unlockedRegions), "general"] };
}
