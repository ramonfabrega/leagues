# leagues

OSRS league progress tracker. Live player data from the RuneScape Wiki RuneLite sync endpoint, joined against a scraped catalog of every league task. Pastel + Ink for the CLI, Zod for validation, Bun for everything else.

## Setup

```bash
bun install
bun link          # makes the `leagues` command available everywhere
```

Edit `leagues.config.ts` to change the league or the player list.

## Usage

```bash
leagues                                             # prints help
leagues compare "R amon" "greenbay420"              # diff unique tasks (one-shot)
leagues compare "R amon" "greenbay420" --watch      # permarunning, 10s polling
leagues summary                                      # default player progress
leagues missing --skill Fletching                    # missing tasks requiring Fletching
leagues easiest --skill Fletching --limit 10         # sorted by highest wiki %
leagues levels                                       # level gaps across players
leagues task "Fletch 50 Willow longbow (u)"          # task details
leagues search fletch                                # free-text search
leagues scrape                                       # refresh data/tasks.json
```

Every query command supports `--json` for structured output.

## Layout

```
leagues.config.ts        # single user-facing config (league + players + helpers)
data/tasks.json          # scraped catalog (1,592 tasks, checked in)
src/
  cli.tsx                # pastel entry
  scrape.ts              # HTML → catalog
  commands/              # one .tsx per subcommand (zod options, ink render)
  components/            # ink views: TaskList, Summary, Compare, LevelGaps, TaskDetails
  lib/
    api.ts               # external HTTP + zod-validated responses
    catalog.ts           # data/tasks.json load/write + zod schemas
    queries.ts           # pure task-query functions (filter, rank, diff)
    cli-options.ts       # shared zod option fragments
test/                    # bun test suite + HTML fixture
.claude/skills/leagues/  # Claude Code skill pointing to this CLI
```

## Developing

```bash
bun test              # run unit + scrape fixture tests
bun typecheck         # tsc --noEmit
bun start --help      # run the CLI without linking
```

Zod lives only at system boundaries: `fetchPlayer` (network), `loadCatalog` (file I/O), `leagues.config.ts` (user input), and pastel's argv. Internal types are plain TypeScript.
