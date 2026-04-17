# leagues

Tracks Old School RuneScape league progress across configured players. Pulls live progress from the RuneScape Wiki's RuneLite sync endpoint and joins it against a scraped catalog of every league task.

## Setup

```bash
bun install
bun cli scrape        # generate data/tasks.json (checked in, but refresh anytime)
```

Edit `leagues.config.ts` to change the league or the player list.

## Usage

Single entrypoint: `bun cli <subcommand>`. Run `bun cli help` for the full reference.

Common flows:

```bash
bun cli compare "R amon" "greenbay420"              # diff unique tasks once
bun cli compare "R amon" "greenbay420" --watch      # permarunning, 10s polling
bun cli summary                                      # default player progress summary
bun cli missing --skill=Fletching                    # missing tasks requiring Fletching
bun cli easiest --skill=Fletching --limit=10         # sorted by highest wiki completion %
bun cli levels                                       # level gaps across configured players
bun cli task "Fletch 50 Willow longbow (u)"          # task details
bun cli search fletch                                # free-text search
bun cli scrape                                       # refresh catalog from the wiki
```

All query commands support `--json` for structured output.

## Layout

```
leagues.config.ts        # league + player list
data/tasks.json          # scraped task catalog (1,592 entries)
src/
  cli.ts                 # argv dispatcher
  scrape.ts              # wiki → data/tasks.json
  lib/
    api.ts               # fetchPlayer (wiki RuneLite sync endpoint)
    catalog.ts           # load data/tasks.json, task lookups
    config.ts            # reads leagues.config.ts
    queries.ts           # pure query functions (missing, easiest, unique, etc.)
    format.ts            # pretty-printing
    watch.ts             # compare daemon
.claude/skills/leagues/  # Claude Code skill (how to answer questions via CLI)
```
