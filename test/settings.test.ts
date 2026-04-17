import { describe, test, expect } from "bun:test";
import {
  mergeSettings,
  ProjectConfigSchema,
  LocalConfigSchema,
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
