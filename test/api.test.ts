import { describe, test, expect } from "bun:test";
import { PlayerDataSchema } from "../src/lib/api";

describe("PlayerDataSchema", () => {
  test("accepts task IDs as strings", () => {
    const parsed = PlayerDataSchema.parse({
      username: "R amon",
      league_tasks: ["1", "2", "3"],
      levels: { Attack: 80 },
    });
    expect(parsed.league_tasks).toEqual(["1", "2", "3"]);
  });

  test("coerces task IDs from numbers to strings", () => {
    const parsed = PlayerDataSchema.parse({
      username: "R amon",
      league_tasks: [1, 2, 3],
      levels: { Attack: 80 },
    });
    expect(parsed.league_tasks).toEqual(["1", "2", "3"]);
  });

  test("handles mixed string/number task IDs", () => {
    const parsed = PlayerDataSchema.parse({
      username: "x",
      league_tasks: ["5", 6, "7"],
      levels: {},
    });
    expect(parsed.league_tasks).toEqual(["5", "6", "7"]);
  });

  test("rejects missing username", () => {
    const r = PlayerDataSchema.safeParse({ league_tasks: [], levels: {} });
    expect(r.success).toBe(false);
  });

  test("rejects non-numeric levels", () => {
    const r = PlayerDataSchema.safeParse({
      username: "x",
      league_tasks: [],
      levels: { Attack: "80" },
    });
    expect(r.success).toBe(false);
  });
});
