import { useEffect, useRef, useState } from "react";
import { Text, Box, Static } from "ink";
import { loadSettings, resolvePlayer } from "../lib/settings";
import { getPlayerProgress, uniqueTasks, type PlayerProgress } from "../lib/queries";
import type { Task } from "../lib/catalog";
import { TaskList } from "./TaskList";
import { CommandBody } from "./Async";

type Snapshot = {
  unique: Record<string, Task[]>;
  totalPoints: Record<string, number>;
  at: string;
};

async function resolvePlayers(args: string[]): Promise<string[]> {
  const settings = await loadSettings();
  const players = args.length >= 2
    ? args.map((a) => resolvePlayer(settings, a))
    : [...settings.players];
  if (players.length < 2) {
    throw new Error("compare needs at least 2 players (pass them as args or configure them via leagues config)");
  }
  return players;
}

async function buildSnapshot(players: string[]): Promise<Snapshot> {
  const progresses = await Promise.all(players.map((r) => getPlayerProgress(r)));
  const byName = new Map<string, PlayerProgress>(progresses.map((p, i) => [players[i]!, p]));
  const unique: Record<string, Task[]> = {};
  const totalPoints: Record<string, number> = {};
  for (const name of players) {
    const target = byName.get(name)!;
    const others = players.filter((n) => n !== name).map((n) => byName.get(n)!);
    unique[name] = uniqueTasks(target, others);
    totalPoints[name] = target.totalPoints;
  }
  return { unique, totalPoints, at: new Date().toISOString() };
}

function diffIds(prev: Task[], next: Task[]): { added: Task[]; removed: Task[] } {
  const prevIds = new Set(prev.map((t) => t.id));
  const nextIds = new Set(next.map((t) => t.id));
  return {
    added: next.filter((t) => !prevIds.has(t.id)),
    removed: prev.filter((t) => !nextIds.has(t.id)),
  };
}

type OncePayload = { players: string[]; snapshot: Snapshot };

export function CompareOnce({ args, json }: { args: string[]; json?: boolean }) {
  return (
    <CommandBody<OncePayload>
      run={async () => {
        const players = await resolvePlayers(args);
        const snapshot = await buildSnapshot(players);
        return { players, snapshot };
      }}
      json={json}
      loadingLabel="Fetching players"
    >
      {({ players, snapshot }) => (
        <Box flexDirection="column">
          {players.map((p) => (
            <Box key={p} marginTop={1}>
              <TaskList label={p} tasks={snapshot.unique[p] ?? []} showCount={false} />
            </Box>
          ))}
        </Box>
      )}
    </CommandBody>
  );
}

type Change = { player: string; added: Task[]; removed: Task[] };

type LogEntryBody =
  | { kind: "initial"; players: string[]; snapshot: Snapshot }
  | { kind: "change"; at: string; changes: Change[] }
  | { kind: "error"; at: string; message: string };

type LogEntry = LogEntryBody & { id: string };

const BAR_REFRESH_MS = 250;

function renderBar(pct: number, width: number): string {
  const filled = Math.max(0, Math.min(width, Math.floor(pct * width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function timeOf(iso: string): string {
  return iso.slice(11, 19); // "HH:MM:SS"
}

type PlayerStat = { name: string; points: number; count: number };

function statsFrom(players: string[], snapshot: Snapshot | null): PlayerStat[] {
  return players.map((name) => ({
    name,
    points: snapshot?.totalPoints[name] ?? 0,
    count: snapshot?.unique[name]?.length ?? 0,
  }));
}

function LiveBlock({ pct, tick, stats }: { pct: number; tick: number; stats: PlayerStat[] }) {
  const nameW = Math.max(...stats.map((s) => s.name.length));
  const pointsStrs = stats.map((s) => s.points.toLocaleString());
  const countStrs = stats.map((s) => String(s.count));
  const pointsW = Math.max(...pointsStrs.map((s) => s.length));
  const countW = Math.max(...countStrs.map((s) => s.length));
  // Row shape: "{name} 2· 2{points} points 2· 2{count} unique" — constant padding totals 24.
  const rowW = nameW + pointsW + countW + 24;
  const tickStr = String(tick);
  const tickW = Math.max(3, tickStr.length);
  const barW = Math.max(10, rowW - tickW - 1);
  return (
    <Box flexDirection="column">
      <Text color="gray">
        <Text color="cyan">{renderBar(pct, barW)}</Text> {tickStr.padStart(tickW)}
      </Text>
      {stats.map((s, i) => (
        <Text key={s.name} color="gray">
          {s.name.padEnd(nameW)}  •  {pointsStrs[i]!.padStart(pointsW)} points  •  {countStrs[i]!.padStart(countW)} unique
        </Text>
      ))}
    </Box>
  );
}

function LogEntryView({ entry }: { entry: LogEntry }) {
  if (entry.kind === "initial") {
    return (
      <Box flexDirection="column">
        <Text color="gray">━━ initial snapshot at {timeOf(entry.snapshot.at)} ━━</Text>
        {entry.players.map((p) => (
          <Box key={p} marginTop={1}>
            <TaskList label={p} tasks={entry.snapshot.unique[p] ?? []} showCount={false} />
          </Box>
        ))}
      </Box>
    );
  }
  if (entry.kind === "change") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="yellow">━━ changes at {timeOf(entry.at)} ━━</Text>
        {entry.changes.map((c) => (
          <Box key={c.player} flexDirection="column" marginTop={1}>
            {c.added.length > 0 ? (
              <Box flexDirection="column">
                <Text color="green">+ new unique for {c.player}</Text>
                {c.added.map((t) => <Text key={t.id}>  {t.points}pts  {t.name}</Text>)}
              </Box>
            ) : null}
            {c.removed.length > 0 ? (
              <Box flexDirection="column">
                <Text color="magenta">~ now common for {c.player}</Text>
                {c.removed.map((t) => <Text key={t.id}>  {t.points}pts  {t.name}</Text>)}
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
    );
  }
  return (
    <Text color="red">✗ {timeOf(entry.at)} {entry.message}</Text>
  );
}

export function CompareWatch({ args, intervalMs }: { args: string[]; intervalMs: number }) {
  const [players, setPlayers] = useState<string[] | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [fatal, setFatal] = useState<Error | null>(null);
  const [lastPollAt, setLastPollAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [tick, setTick] = useState(0);
  const prevRef = useRef<Snapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollHandle: ReturnType<typeof setInterval> | null = null;

    const append = (entry: LogEntryBody) => {
      setLog((prev) => [...prev, { ...entry, id: `${Date.now()}-${prev.length}` }]);
    };

    const poll = async (ps: string[]) => {
      if (cancelled) return;
      try {
        const next = await buildSnapshot(ps);
        if (cancelled) return;
        const prev = prevRef.current;
        if (!prev) {
          append({ kind: "initial", players: ps, snapshot: next });
        } else {
          const changes: Change[] = [];
          for (const p of ps) {
            const d = diffIds(prev.unique[p] ?? [], next.unique[p] ?? []);
            if (d.added.length || d.removed.length) changes.push({ player: p, ...d });
          }
          if (changes.length > 0) append({ kind: "change", at: next.at, changes });
        }
        prevRef.current = next;
        setSnapshot(next);
        setTick((t) => t + 1);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!cancelled) append({ kind: "error", at: new Date().toISOString(), message });
      } finally {
        if (!cancelled) setLastPollAt(Date.now());
      }
    };

    const barHandle = setInterval(() => setNow(Date.now()), BAR_REFRESH_MS);

    (async () => {
      try {
        const ps = await resolvePlayers(args);
        if (cancelled) return;
        setPlayers(ps);
        await poll(ps);
        pollHandle = setInterval(() => void poll(ps), intervalMs);
      } catch (err) {
        if (!cancelled) setFatal(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    return () => {
      cancelled = true;
      if (pollHandle) clearInterval(pollHandle);
      clearInterval(barHandle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fatal) return <Text color="red">Error: {fatal.message}</Text>;
  if (!players) return <Text color="gray">loading settings…</Text>;

  const pct = Math.min(1, Math.max(0, now - lastPollAt) / intervalMs);

  return (
    <>
      <Static items={log}>{(entry) => <LogEntryView key={entry.id} entry={entry} />}</Static>
      <Box marginTop={1}>
        <LiveBlock pct={pct} tick={tick} stats={statsFrom(players, snapshot)} />
      </Box>
    </>
  );
}
