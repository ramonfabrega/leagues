import { describe, test, expect } from "bun:test";
import {
  effectiveUnlockedRegions,
  mergeSettings,
  ProjectConfigSchema,
  LocalConfigSchema,
  ALWAYS_UNLOCKED,
  type ProjectConfig,
} from "../src/lib/settings";

const project: ProjectConfig = {
  league: "TEST_LEAGUE",
  wikiTasksUrl: "https://example.com/tasks",
  players: ["Alice", "Bob"],
  defaultPlayer: "Alice",
};

describe("mergeSettings", () => {
  test("no local → passes through project", () => {
    const s = mergeSettings(project, null);
    expect(s.defaultPlayer).toBe("Alice");
    expect(s.players).toEqual(["Alice", "Bob"]);
    expect(s.sources.local).toBeNull();
  });

  test("local defaultPlayer overrides project", () => {
    const s = mergeSettings(project, { defaultPlayer: "Bob" });
    expect(s.defaultPlayer).toBe("Bob");
  });

  test("local extraPlayers append to project players", () => {
    const s = mergeSettings(project, { extraPlayers: ["Carol"] });
    expect(s.players).toEqual(["Alice", "Bob", "Carol"]);
  });

  test("local extraPlayers dedupe case-insensitively", () => {
    const s = mergeSettings(project, { extraPlayers: ["alice", "Dave"] });
    expect(s.players).toEqual(["Alice", "Bob", "Dave"]);
  });

  test("local defaultPlayer must exist in merged players", () => {
    expect(() => mergeSettings(project, { defaultPlayer: "Ghost" })).toThrow(/not in the merged players/);
  });

  test("local defaultPlayer can point at an extraPlayer", () => {
    const s = mergeSettings(project, { defaultPlayer: "Carol", extraPlayers: ["Carol"] });
    expect(s.defaultPlayer).toBe("Carol");
    expect(s.players).toContain("Carol");
  });
});

describe("ProjectConfigSchema", () => {
  test("rejects empty players", () => {
    const r = ProjectConfigSchema.safeParse({ ...project, players: [] });
    expect(r.success).toBe(false);
  });

  test("rejects non-URL wikiTasksUrl", () => {
    const r = ProjectConfigSchema.safeParse({ ...project, wikiTasksUrl: "not a url" });
    expect(r.success).toBe(false);
  });
});

describe("effectiveUnlockedRegions", () => {
  test("always includes karamja even if missing", () => {
    expect(effectiveUnlockedRegions([])).toEqual(ALWAYS_UNLOCKED);
    expect(effectiveUnlockedRegions(["desert"])).toEqual(["desert", "karamja"]);
  });

  test("dedupes and returns in canonical REGIONS order", () => {
    const out = effectiveUnlockedRegions(["wilderness", "karamja", "asgarnia"]);
    expect(out).toEqual(["asgarnia", "karamja", "wilderness"]);
  });
});

describe("LocalConfigSchema unlockedRegions", () => {
  test("accepts known regions", () => {
    const r = LocalConfigSchema.safeParse({ unlockedRegions: ["karamja", "desert"] });
    expect(r.success).toBe(true);
  });

  test("rejects unknown region", () => {
    const r = LocalConfigSchema.safeParse({ unlockedRegions: ["atlantis"] });
    expect(r.success).toBe(false);
  });
});

describe("mergeSettings unlockedRegions", () => {
  test("no local → empty", () => {
    const s = mergeSettings(project, null);
    expect(s.unlockedRegions).toEqual([]);
    expect(s.overrides.unlockedRegions).toBeNull();
  });

  test("local sets unlockedRegions", () => {
    const s = mergeSettings(project, { unlockedRegions: ["karamja", "tirannwn"] });
    expect(s.unlockedRegions).toEqual(["karamja", "tirannwn"]);
    expect(s.overrides.unlockedRegions).toEqual(["karamja", "tirannwn"]);
  });
});

describe("LocalConfigSchema", () => {
  test("empty object is valid", () => {
    expect(LocalConfigSchema.parse({})).toEqual({});
  });

  test("rejects empty-string player", () => {
    const r = LocalConfigSchema.safeParse({ defaultPlayer: "" });
    expect(r.success).toBe(false);
  });

  test("rejects empty-string in extraPlayers", () => {
    const r = LocalConfigSchema.safeParse({ extraPlayers: ["valid", ""] });
    expect(r.success).toBe(false);
  });
});
