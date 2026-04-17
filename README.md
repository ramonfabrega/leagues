# leagues

OSRS league progress tracker. Live player data from the RuneScape Wiki RuneLite sync endpoint, joined against a scraped catalog of every league task. Pastel + Ink for the CLI, Zod for validation, Bun for everything else.

## First run

```bash
bun install
```

`postinstall` runs `bun link` automatically, which adds the `leagues` command to `~/.bun/bin` (on your PATH if you use bun). If you'd rather not install globally, remove the `postinstall` line in `package.json` and run via `bun start` instead.

## Per-user config

Two files:

- **`leagues.config.json`** — committed project defaults (league, wiki URL, known players, default player).
- **`leagues.local.json`** — gitignored per-user overrides. Don't edit by hand — manage it via the `leagues config` subcommand.

Typical flow after cloning:

```bash
leagues config default "Your RSN"          # sets your default player (creates local file)
leagues config add-player "SomeoneElse"    # add a friend who isn't in the project list
leagues config                             # show effective merged config
leagues config reset                       # wipe leagues.local.json
```

`defaultPlayer` in local overrides project. `extraPlayers` from local append to project players.

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
leagues.config.json      # committed project defaults (schema-validated on load)
leagues.local.json       # gitignored per-user overrides (managed via `leagues config`)
data/tasks.json          # scraped catalog (~1,600 tasks, checked in)
src/
  cli.tsx                # pastel entry
  scrape.ts              # HTML → catalog
  commands/              # one .tsx per subcommand (zod options + ink render)
    config/              # subcommands: default, add-player, remove-player, reset
  components/            # ink views
  lib/
    api.ts               # external HTTP + zod-validated responses
    catalog.ts           # data/tasks.json load/write + zod schemas
    settings.ts          # config loaders (zod) + merge + helpers
    queries.ts           # pure task-query functions (filter, rank, diff)
    cli-options.ts       # shared zod option fragments
test/                    # bun test suite
.claude/skills/leagues/  # Claude Code skill pointing to this CLI
```

## Developing

```bash
bun test              # 40 tests (queries, scrape, api, settings)
bun typecheck         # tsc --noEmit
bun start --help      # run the CLI without linking
```

Zod lives only at system boundaries: `fetchPlayer` (network), `loadCatalog` (file I/O), `loadProjectConfig` / `loadLocalConfig` (file I/O), and pastel's argv (user input). Internal types are plain TypeScript — tests and `tsc` enforce invariants there.
