import { z } from "zod";
import { option } from "pastel";
import { TIERS } from "./catalog";
import type { TaskFilter } from "./queries";

export const jsonOption = z
  .boolean()
  .default(false)
  .describe(option({ description: "Output JSON instead of pretty text", alias: "j" }));

export const playerOption = z
  .string()
  .optional()
  .describe(option({ description: "Player RSN (defaults to configured defaultPlayer)", alias: "p" }));

export const limitOption = z
  .number()
  .optional()
  .describe(option({ description: "Cap result count" }));

export const filterOptions = {
  skill: z.string().optional().describe(option({ description: "Only tasks requiring this skill" })),
  tier: z.enum(TIERS).optional().describe(option({ description: "Filter by tier" })),
  area: z.string().optional().describe(option({ description: "Filter by area (e.g. general, tirannwn, varlamore)" })),
  maxPoints: z.number().optional().describe(option({ description: "Only tasks worth <= N points" })),
  minPoints: z.number().optional().describe(option({ description: "Only tasks worth >= N points" })),
  minCompletion: z.number().optional().describe(option({ description: "Only tasks with >= N% wiki completion" })),
  maxCompletion: z.number().optional().describe(option({ description: "Only tasks with <= N% wiki completion" })),
  pactOnly: z.boolean().default(false).describe(option({ description: "Only pact-specific tasks" })),
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
};

export function buildFilter(o: FilterInput): TaskFilter {
  return {
    skill: o.skill,
    tier: o.tier,
    area: o.area,
    maxPoints: o.maxPoints,
    minPoints: o.minPoints,
    minCompletionPct: o.minCompletion,
    maxCompletionPct: o.maxCompletion,
    pactOnly: o.pactOnly,
  };
}
