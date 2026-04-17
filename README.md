# leagues

OSRS league progress tracker. Live player data from the RuneScape Wiki RuneLite sync endpoint, joined against a scraped catalog of every league task. Pastel + Ink for the CLI, Zod at system boundaries, Bun for everything else.

## First run

```bash
bun install
```

The `postinstall` hook runs `bun link`, which drops a `leagues` executable into `~/.bun/bin` (on your PATH if bun's installed normally), so you can run `leagues <cmd>` anywhere.

If you'd rather not install globally, remove the `postinstall` line from `package.json` and run via `bun start` instead.

## Per-user config

Two files:

- **`leagues.config.json`** — committed project defaults (league, wiki URL, known players, default player).
- **`leagues.local.json`** — gitignored per-user overrides. Don't edit by hand — manage it via `leagues config`.

After cloning, your friend typically runs:

```bash
leagues config default "their RSN"       # sets their default player
leagues config add-player "someoneElse"  # optional: add someone not in the committed list
leagues config regions                   # interactive toggle for unlocked regions (writes config.json)
leagues config                           # show effective merged config
leagues config reset                     # wipe leagues.local.json
```

`local.defaultPlayer` overrides project. `local.extraPlayers` append to project's `players`.

## Usage

```bash
leagues                                             # prints help
leagues compare "R amon" "greenbay420"              # diff unique tasks (one-shot)
leagues compare "R amon" "greenbay420" --watch      # permarunning, 10s polling
leagues summary                                      # default player progress
leagues missing --skill Fletching                    # missing tasks (respects unlockedRegions)
leagues missing --all-regions                        # ignore unlockedRegions filter
leagues easiest --skill Fletching --limit 10         # sorted by highest wiki %
leagues levels                                       # level gaps across players
leagues task "Fletch 50 Willow longbow (u)"          # task details
leagues search fletch                                # free-text search (excludes completed)
leagues search fletch --all                          # include completed + all regions
leagues config regions                               # interactive multi-select unlock editor
leagues scrape                                       # refresh data/tasks.json
leagues update [--scrape]                            # git pull + bun install (+ scrape)
leagues uninstall                                    # bun unlink (removes the global binary)
```

Every query command supports `--json` for structured output.

## Keeping up to date

```bash
leagues update           # git pull + bun install
leagues update --scrape  # also refresh data/tasks.json
```

The `leagues` binary is a symlink pointing at the repo folder, so once `git pull` finishes, future invocations use the latest code — no re-link needed. You only need `bun install` again if dependencies changed, which `leagues update` runs for you anyway.

## Uninstalling

```bash
leagues uninstall
```

Works from anywhere — resolves the repo via its own install path, then runs `bun unlink`. After that, the `leagues` command is gone and you can safely delete the repo.

## Layout

```
leagues.config.json      # committed project defaults (zod-validated on load)
leagues.local.json       # gitignored per-user overrides (managed via `leagues config`)
data/tasks.json          # scraped catalog (~1,600 tasks, checked in)
src/
  cli.tsx                # pastel entry (#!/usr/bin/env bun)
  scrape.ts              # HTML → catalog
  commands/              # one .tsx per subcommand
    config/              # subcommands: default, add-player, remove-player, reset
  components/            # ink views
  lib/
    api.ts               # external HTTP + zod-validated responses
    catalog.ts           # data/tasks.json load/write + zod schema
    settings.ts          # config loaders (zod) + merge
    queries.ts           # pure task-query functions
    cli-options.ts       # shared zod option fragments
test/                    # bun test suite + HTML fixture
.claude/skills/leagues/  # Claude Code skill
```

## Developing

```bash
bun test              # 40 tests (queries, scrape, api, settings)
bun typecheck         # tsc --noEmit
bun start --help      # run without linking
```

Zod lives only at system boundaries:
- `fetchPlayer` (network response),
- `loadCatalog` / `loadProjectConfig` / `loadLocalConfig` (file reads),
- pastel's argv (user input).

Internal types are plain TypeScript. Tests + `tsc --strict` enforce invariants inside the app.
