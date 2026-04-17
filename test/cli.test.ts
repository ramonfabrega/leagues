import { describe, test, expect } from "bun:test";
import path from "node:path";

const CLI = path.join(import.meta.dir, "../src/cli.tsx");

const FIXTURE_DIR = path.join(import.meta.dir, "fixtures/players");

async function runCli(args: string[], env: Record<string, string> = {}) {
  const proc = Bun.spawn(["bun", CLI, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, CI: "1", ...env },
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { stdout, stderr, exitCode };
}

// Smoke tests: exercise the pastel + ink + CommandBody pipeline end-to-end on
// commands that don't touch the network. These catch render/lifecycle regressions
// that unit tests on pure logic miss (e.g. nested <CommandBody> exiting early).
describe("cli integration", () => {
  test("leagues task --json emits a parseable task object", async () => {
    const { stdout, exitCode } = await runCli(["task", "--json", "Catch a Herring"]);
    expect(exitCode).toBe(0);
    expect(stdout.length).toBeGreaterThan(0);
    const obj = JSON.parse(stdout);
    expect(obj.match?.name).toBe("Catch a Herring");
    expect(obj.match?.tier).toBe("easy");
  });

  test("leagues search --json returns matches", async () => {
    const { stdout, exitCode } = await runCli(["search", "--json", "Willow longbow"]);
    expect(exitCode).toBe(0);
    const obj = JSON.parse(stdout);
    expect(obj.count).toBeGreaterThan(0);
    expect(obj.tasks[0].name).toMatch(/Willow longbow/i);
  });

  test("leagues config --json dumps merged settings", async () => {
    const { stdout, exitCode } = await runCli(["config", "--json"]);
    expect(exitCode).toBe(0);
    const obj = JSON.parse(stdout);
    expect(obj.league).toBeTruthy();
    expect(Array.isArray(obj.players)).toBe(true);
    expect(obj.defaultPlayer).toBeTruthy();
  });

  test("leagues --help exits 0 and lists commands", async () => {
    const { stdout, exitCode } = await runCli(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("compare");
    expect(stdout).toContain("summary");
    expect(stdout).toContain("scrape");
  });

  // Fixture-backed tests: LEAGUES_FIXTURE_DIR makes fetchPlayer read from
  // test/fixtures/players/<rsn>.json instead of the wiki sync endpoint.
  // These catch regressions in network-touching commands like compare/summary
  // without needing real HTTP.
  test("leagues compare --json renders through the full pipeline", async () => {
    const { stdout, exitCode } = await runCli(
      ["compare", "--json", "R amon", "greenbay420"],
      { LEAGUES_FIXTURE_DIR: FIXTURE_DIR }
    );
    expect(exitCode).toBe(0);
    const obj = JSON.parse(stdout);
    expect(obj.players).toEqual(["R amon", "greenbay420"]);
    expect(obj.snapshot).toBeDefined();
    expect(Array.isArray(obj.snapshot.unique["R amon"])).toBe(true);
    expect(Array.isArray(obj.snapshot.unique["greenbay420"])).toBe(true);
  });

  test("leagues summary --json reports totals", async () => {
    const { stdout, exitCode } = await runCli(
      ["summary", "--json", "--player", "R amon"],
      { LEAGUES_FIXTURE_DIR: FIXTURE_DIR }
    );
    expect(exitCode).toBe(0);
    const obj = JSON.parse(stdout);
    expect(obj.username).toBe("R amon");
    expect(obj.completedCount).toBeGreaterThan(0);
    expect(obj.totalPoints).toBeGreaterThan(0);
  });

  test("leagues levels --json computes gaps", async () => {
    const { stdout, exitCode } = await runCli(["levels", "--json"], {
      LEAGUES_FIXTURE_DIR: FIXTURE_DIR,
    });
    expect(exitCode).toBe(0);
    const obj = JSON.parse(stdout);
    expect(Array.isArray(obj.diffs)).toBe(true);
    expect(obj.players).toEqual(["R amon", "greenbay420"]);
  });
});
