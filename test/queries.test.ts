import { describe, expect, test } from "bun:test";

import {
  areaBreakdown,
  filterMissing,
  levelGaps,
  matchesFilter,
  pickEasiest,
  tierBreakdown,
  uniqueTasks,
} from "../src/lib/queries";
import { progress, task } from "./fixtures";

const catalog = [
  task({ id: 1, name: "Catch a Herring", tier: "easy", points: 10, completionPct: 60 }),
  task({
    id: 2,
    name: "Fletch 50 Willow longbow (u)",
    tier: "medium",
    points: 30,
    completionPct: 58.7,
    requirements: { skills: [{ skill: "Fletching", level: 40 }], other: null },
  }),
  task({
    id: 3,
    name: "Fletch 50 Yew longbow (u)",
    tier: "hard",
    points: 80,
    completionPct: 14.9,
    requirements: { skills: [{ skill: "Fletching", level: 70 }], other: null },
  }),
  task({
    id: 4,
    name: "Mine 50 Iron Ore",
    tier: "medium",
    points: 30,
    area: "tirannwn",
    completionPct: 74.8,
    requirements: { skills: [{ skill: "Mining", level: 15 }], other: null },
  }),
  task({
    id: 5,
    name: "Moon Chest",
    tier: "elite",
    points: 200,
    isPactTask: true,
    completionPct: null,
  }),
];

describe("matchesFilter", () => {
  test("tier filter", () => {
    expect(matchesFilter(catalog[1], { tier: "medium" })).toBe(true);
    expect(matchesFilter(catalog[1], { tier: "easy" })).toBe(false);
  });

  test("skill filter (case-insensitive)", () => {
    expect(matchesFilter(catalog[1], { skill: "FLETCHING" })).toBe(true);
    expect(matchesFilter(catalog[0], { skill: "Fletching" })).toBe(false);
  });

  test("points range", () => {
    expect(matchesFilter(catalog[1], { maxPoints: 50 })).toBe(true);
    expect(matchesFilter(catalog[2], { maxPoints: 50 })).toBe(false);
    expect(matchesFilter(catalog[2], { minPoints: 50 })).toBe(true);
  });

  test("completion % range excludes null completionPct", () => {
    expect(matchesFilter(catalog[4], { minCompletionPct: 0 })).toBe(false);
  });

  test("pactOnly", () => {
    expect(matchesFilter(catalog[4], { pactOnly: true })).toBe(true);
    expect(matchesFilter(catalog[0], { pactOnly: true })).toBe(false);
  });

  test("area is case-insensitive", () => {
    expect(matchesFilter(catalog[3], { area: "Tirannwn" })).toBe(true);
    expect(matchesFilter(catalog[3], { area: "general" })).toBe(false);
  });

  test("areas set matches any (case-insensitive)", () => {
    expect(matchesFilter(catalog[3], { areas: ["general", "Tirannwn"] })).toBe(true);
    expect(matchesFilter(catalog[3], { areas: ["general", "kourend"] })).toBe(false);
    expect(matchesFilter(catalog[0], { areas: ["general"] })).toBe(true);
  });

  test("empty areas array is treated as no filter", () => {
    expect(matchesFilter(catalog[3], { areas: [] })).toBe(true);
  });

  test("withinLevels keeps tasks whose skill reqs are all met", () => {
    // catalog[1] needs Fletching 40; catalog[3] needs Mining 15
    expect(matchesFilter(catalog[1], { withinLevels: { Fletching: 50 } })).toBe(true);
    expect(matchesFilter(catalog[1], { withinLevels: { Fletching: 20 } })).toBe(false);
    expect(matchesFilter(catalog[3], { withinLevels: { Mining: 15 } })).toBe(true);
    expect(matchesFilter(catalog[3], { withinLevels: {} })).toBe(false);
    // catalog[0] has no skill reqs — always passes
    expect(matchesFilter(catalog[0], { withinLevels: {} })).toBe(true);
  });
});

describe("filterMissing", () => {
  test("excludes completed tasks", () => {
    const player = progress({ username: "rmn", completed: [catalog[0], catalog[1]] });
    const missing = filterMissing(catalog, player);
    expect(missing.map((t) => t.id)).toEqual([3, 4, 5]);
  });

  test("combines with filters", () => {
    const player = progress({ username: "rmn", completed: [] });
    const missing = filterMissing(catalog, player, { skill: "Fletching" });
    expect(missing.map((t) => t.id)).toEqual([2, 3]);
  });
});

describe("pickEasiest", () => {
  test("sorts by completionPct descending, excludes null, respects limit", () => {
    const player = progress({ username: "rmn", completed: [] });
    const easiest = pickEasiest(catalog, player, {}, 3);
    expect(easiest.map((t) => t.id)).toEqual([4, 1, 2]); // 74.8, 60, 58.7
  });
});

describe("uniqueTasks", () => {
  test("N-way unique set", () => {
    const a = progress({ username: "a", completed: [catalog[0], catalog[1], catalog[2]] });
    const b = progress({ username: "b", completed: [catalog[1], catalog[3]] });
    const c = progress({ username: "c", completed: [catalog[2]] });
    expect(uniqueTasks(a, [b, c]).map((t) => t.id)).toEqual([1]);
  });
});

describe("tierBreakdown / areaBreakdown", () => {
  test("tiers", () => {
    const b = tierBreakdown(catalog);
    expect(b.easy).toEqual({ count: 1, points: 10 });
    expect(b.medium).toEqual({ count: 2, points: 60 });
    expect(b.hard).toEqual({ count: 1, points: 80 });
    expect(b.elite).toEqual({ count: 1, points: 200 });
    expect(b.master).toEqual({ count: 0, points: 0 });
  });

  test("areas", () => {
    expect(areaBreakdown(catalog)).toEqual({ general: 4, tirannwn: 1 });
  });
});

describe("levelGaps", () => {
  test("returns empty when fewer than 2 players", () => {
    expect(levelGaps([progress({ username: "a", levels: { Attack: 10 } })])).toEqual([]);
  });

  test("applies threshold rules and sorts by diff desc", () => {
    const a = progress({
      username: "a",
      levels: { Attack: 80, Mining: 30, Fletching: 99, Thieving: 60 },
    });
    const b = progress({
      username: "b",
      levels: { Attack: 85, Mining: 40, Fletching: 95, Thieving: 67 },
    });
    // Attack: low=80, diff=5 → maxLow<=80 rule needs diff>=5 → passes
    // Mining: low=30, diff=10 → maxLow<=50 rule needs diff>=7 → passes
    // Fletching: low=95, diff=4 → maxLow=Inf rule needs diff>=3 → passes
    // Thieving: low=60, diff=7 → maxLow<=80 rule needs diff>=5 → passes
    const diffs = levelGaps([a, b]);
    expect(diffs.map((d) => d.skill)).toEqual(["Mining", "Thieving", "Attack", "Fletching"]);
  });

  test("skips skills missing from one player", () => {
    const a = progress({ username: "a", levels: { Attack: 90 } });
    const b = progress({ username: "b", levels: { Defence: 30 } });
    expect(levelGaps([a, b])).toEqual([]);
  });
});
