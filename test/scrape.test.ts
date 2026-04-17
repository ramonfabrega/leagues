import { describe, test, expect } from "bun:test";
import { parseTasksHtml } from "../src/scrape";
import path from "node:path";

const fixture = await Bun.file(
  path.join(import.meta.dir, "fixtures/tasks.html")
).text();
const tasks = parseTasksHtml(fixture);

describe("parseTasksHtml", () => {
  test("parses every row on the wiki tasks page", () => {
    expect(tasks.length).toBeGreaterThan(1500);
  });

  test("tier distribution matches all 5 expected values", () => {
    const tiers = new Set(tasks.map((t) => t.tier));
    expect([...tiers].sort()).toEqual(["easy", "elite", "hard", "master", "medium"]);
  });

  test("sorted by id ascending", () => {
    for (let i = 1; i < tasks.length; i++) {
      expect(tasks[i]!.id).toBeGreaterThan(tasks[i - 1]!.id);
    }
  });

  test("parses a simple task (no requirements)", () => {
    const t = tasks.find((t) => t.name === "Bury 6 bones");
    expect(t).toBeDefined();
    expect(t!.tier).toBe("easy");
    expect(t!.points).toBe(10);
    expect(t!.area).toBe("general");
    expect(t!.requirements.skills).toEqual([]);
    expect(t!.requirements.other).toBeNull();
  });

  test("parses multi-skill requirements", () => {
    const scythe = tasks.find((t) => t.name === "Equip a Scythe of Vitur");
    expect(scythe).toBeDefined();
    expect(scythe!.requirements.skills).toEqual([
      { skill: "Attack", level: 80 },
      { skill: "Strength", level: 90 },
    ]);
  });

  test("captures non-skill requirement text", () => {
    const ca = tasks.find((t) => t.name === "Combat Achievements Elite Tier");
    expect(ca?.requirements.other).toContain("Combat Achievement points");
  });

  test("ignores level-less scp spans (miniquest badges) and keeps their text as other", () => {
    const greenman = tasks.find((t) => t.name === "Equip a Greenman mask");
    expect(greenman).toBeDefined();
    expect(greenman!.requirements.skills).toEqual([{ skill: "Fletching", level: 20 }]);
    expect(greenman!.requirements.other).toMatch(/Vale Totems/);
  });

  test("parses <0.1% completion as 0.05", () => {
    const rare = tasks.find((t) => t.completionPct === 0.05);
    expect(rare).toBeDefined();
  });

  test("marks pact tasks", () => {
    const pactCount = tasks.filter((t) => t.isPactTask).length;
    expect(pactCount).toBeGreaterThan(0);
  });
});
