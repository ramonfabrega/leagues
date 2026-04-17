---
name: leagues
description: Query Old School RuneScape League (Demonic Pacts) progress — tasks completed, missing, easiest, compared between players; player levels and skill gaps; catalog task details. Use when the user asks about their league progress, a friend's progress, what tasks to do next, skill requirements, or completion percentages.
---

# Leagues

Tracks OSRS league progress for the user and configured friends. Backed by a scraped catalog of every league task (`data/tasks.json`) and the RuneScape Wiki's live player-sync endpoint.

**Configured players:** project defaults live in `leagues.config.json`; per-user overrides in `leagues.local.json` (gitignored, managed via `leagues config`). When the user says "me" or doesn't name a player, use the effective `defaultPlayer` (check with `leagues config --json`).

## Use the `leagues` command

The CLI is installed globally via `bun link` and works from any directory. Always use `--json` when you need to parse the output to answer a specific question — skip it only if you're showing the user human-formatted text.

```
leagues compare <p1> <p2> [...] [--watch]       # diff unique tasks (optional permarunning mode)
leagues missing [--player X] [filters]          # uncompleted tasks
leagues easiest [--player X] [filters]          # missing tasks sorted by highest completion %
leagues unique [--player X] [--vs A --vs B]     # tasks this player has that others don't
leagues summary [--player X]                    # counts, points, tier/area breakdown
leagues levels [--players A --players B]        # skill level gaps
leagues search "<substring>" [--all] [--all-regions]  # task name + description search (default: excludes completed + filters by unlocked regions)
leagues scrape                                  # refresh data/tasks.json from the wiki
leagues config [subcommand]                     # view/edit per-user defaults (see below)
```

### Config subcommands (edit leagues.local.json)

```
leagues config                          # show effective merged config
leagues config default [<player>]       # set per-user default player (omit arg for interactive picker)
leagues config add-player <player>      # add to per-user extraPlayers
leagues config remove-player [<player>] # remove from extraPlayers (omit arg for interactive picker)
leagues config regions                  # interactive multi-select of unlocked regions
leagues config reset                    # delete leagues.local.json
```

Use `leagues config --json` to read the effective config programmatically (useful for figuring out who "me" is).

### Filter flags (for `missing` and `easiest`)

- `--skill Fletching` — tasks requiring a specific wiki skill level
- `--tier easy|medium|hard|elite|master`
- `--area general|tirannwn|varlamore|...`
- `--max-points N` / `--min-points N`
- `--min-completion N` / `--max-completion N` (percent; e.g. `--min-completion 50`)
- `--pact-only` — only league-specific "pact" tasks
- `--within-levels` — only tasks where the player meets every skill requirement
- `--all-regions` — ignore the configured unlockedRegions filter
- `--limit N` — cap rows (easiest defaults to 20)
- `--json` — machine-readable output

## Question → command cheatsheet

| User asks | Run |
|---|---|
| "what fletching tasks am I missing?" | `leagues missing --skill Fletching --json` |
| "easiest fletching tasks I haven't done" | `leagues easiest --skill Fletching --json` |
| "what's the easiest task I can do right now?" | `leagues easiest --within-levels --limit 10 --json` |
| "how many points do I have?" | `leagues summary --json` |
| "what tasks do I have that greenbay doesn't?" | `leagues unique --player "R amon" --vs greenbay420 --json` |
| "compare me and greenbay" | `leagues compare "R amon" "greenbay420"` |
| "what 30pt tasks am I missing?" | `leagues missing --min-points 30 --max-points 30 --json` |
| "what tirannwn tasks am I missing?" | `leagues missing --area tirannwn --json` |
| "what's the completion % for X?" | `leagues search "X" --all --json` |
| "who's ahead on fletching?" | `leagues levels --json` |

## Filtering semantics

- `--skill X` filters to tasks whose **explicit wiki requirement** lists skill X. It does NOT use semantic matching — "Catch a Herring" is a Fishing task with no explicit Fishing level requirement, so it won't appear under `--skill Fishing`.
- `--within-levels` uses the player's current skill levels from the RuneLite sync endpoint; a task with reqs `[Fletching 40]` is kept only if the player has Fletching ≥ 40.
- `completionPct` is the share of all league players who completed that task. Higher % means easier / more commonly done. `null` means the wiki didn't report a %.
- Tier → points mapping: easy 10, medium 30, hard 80, elite 200, master 400.

## Semantic / thematic queries (recipe)

The CLI does **deterministic** filtering (explicit skill reqs, tiers, points, regions, levels). Thematic classification ("which tasks are Slayer-themed?", "Fishing tasks I can do?") is **your job** — the catalog is small (~1,600 tasks), `data/tasks.json` is local, and ad-hoc regex gives you honest, auditable results per question. Don't ask the user to productionize a `--theme` flag preemptively; the LLM-in-the-loop shape is the intended one.

**Recipe — "tasks themed around X that I can do right now"**:

1. Baseline via CLI (deterministic — region/level/completed filters applied):
   ```bash
   leagues summary --json                    # levels, completed count, points
   leagues missing --within-levels --json    # missing ∩ region-allowed ∩ level-met
   ```
2. Add explicit-skill tasks (CLI does this cleanly):
   ```bash
   leagues missing --skill Slayer --within-levels --json
   ```
3. Add semantic matches via raw catalog read — tune the regex per question:
   ```bash
   jq '.tasks[] | select((.name + " " + .description) | test("slayer|black mask|slayer helm"; "i")) | {id, name, tier, completionPct, requirements}' data/tasks.json
   ```
4. Intersect the semantic set with the level-met missing IDs from step 1. Dedupe, rank by `completionPct` desc, answer.

If the user asks the same thematic question repeatedly across sessions, flag it — a `--theme <skill>` flag may be worth adding to the catalog as an `inferredSkills` field at scrape time. Until then, keyword regex stays in the prompt, not the code.

## When to re-scrape

`data/tasks.json` is generated by scraping the wiki tasks page. Re-scrape when:
- The user mentions the league just updated / new tasks dropped.
- Completion %s feel stale and the user cares about "easiest right now".
- You get `⚠ unknown task ids` warnings in `summary` output.

```
leagues scrape
```

## Catalog shape

```ts
type Task = {
  id: number;
  name: string;
  description: string;
  points: number;                 // 10 / 30 / 80 / 200 / 400
  tier: "easy" | "medium" | "hard" | "elite" | "master";
  area: string;                   // "general" | "tirannwn" | "varlamore" | ...
  isPactTask: boolean;
  completionPct: number | null;   // 0.05 represents the wiki's "<0.1%"
  requirements: {
    skills: { skill: string; level: number }[];
    other: string | null;         // non-skill reqs like "Completion of Vale Totems"
  };
};
```
