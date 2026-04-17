import React, { useEffect, useRef, useState } from "react";
import { Text, Box } from "ink";
import type { Task } from "../lib/catalog";
import { getPlayerProgress, uniqueTasks, type PlayerProgress } from "../lib/queries";
import { TaskList } from "./TaskList";
import { CommandBody, Loading } from "./Async";

export type Snapshot = { unique: Record<string, Task[]>; at: string };

export async function buildSnapshot(players: string[]): Promise<Snapshot> {
  const progresses = await Promise.all(players.map((r) => getPlayerProgress(r)));
  const byName = new Map<string, PlayerProgress>(
    progresses.map((p, i) => [players[i]!, p])
  );
  const unique: Record<string, Task[]> = {};
  for (const name of players) {
    const target = byName.get(name)!;
    const others = players.filter((n) => n !== name).map((n) => byName.get(n)!);
    unique[name] = uniqueTasks(target, others);
  }
  return { unique, at: new Date().toISOString() };
}

function diffIds(prev: Task[], next: Task[]): { added: Task[]; removed: Task[] } {
  const prevIds = new Set(prev.map((t) => t.id));
  const nextIds = new Set(next.map((t) => t.id));
  return {
    added: next.filter((t) => !prevIds.has(t.id)),
    removed: prev.filter((t) => !nextIds.has(t.id)),
  };
}

export function CompareOnce({ players, json }: { players: string[]; json?: boolean }) {
  return (
    <CommandBody<{ players: string[] } & Snapshot>
      run={async () => ({ players, ...(await buildSnapshot(players)) })}
      json={json}
      loadingLabel={`Fetching ${players.join(", ")}`}
    >
      {(data) => (
        <Box flexDirection="column">
          {players.map((p) => (
            <Box key={p} marginTop={1}>
              <TaskList
                label={`${p} unique vs [${players.filter((x) => x !== p).join(", ")}]`}
                tasks={data.unique[p] ?? []}
              />
            </Box>
          ))}
        </Box>
      )}
    </CommandBody>
  );
}

export function CompareWatch({
  players,
  intervalMs,
}: {
  players: string[];
  intervalMs: number;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [lastChanges, setLastChanges] = useState<
    { player: string; added: Task[]; removed: Task[] }[]
  >([]);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const prevRef = useRef<Snapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const next = await buildSnapshot(players);
        if (cancelled) return;
        const prev = prevRef.current;
        if (prev) {
          const changes: { player: string; added: Task[]; removed: Task[] }[] = [];
          for (const p of players) {
            const d = diffIds(prev.unique[p] ?? [], next.unique[p] ?? []);
            if (d.added.length || d.removed.length) {
              changes.push({ player: p, ...d });
            }
          }
          if (changes.length > 0) setLastChanges(changes);
        }
        prevRef.current = next;
        setSnapshot(next);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    void poll();
    const handle = setInterval(() => {
      setTick((t) => t + 1);
      void poll();
    }, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box flexDirection="column">
      <Text color="gray">
        watching [{players.join(", ")}] · every {Math.round(intervalMs / 1000)}s · tick {tick}
        {error ? <Text color="red">  (last poll failed: {error.message})</Text> : null}
      </Text>

      {lastChanges.length > 0 ? (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="yellow">Latest changes</Text>
          {lastChanges.map((c) => (
            <Box key={c.player} flexDirection="column" marginTop={1}>
              {c.added.length > 0 ? (
                <Box flexDirection="column">
                  <Text color="green">+ new unique for {c.player}</Text>
                  {c.added.map((t) => (
                    <Text key={t.id}>  {t.points}pts  {t.name}</Text>
                  ))}
                </Box>
              ) : null}
              {c.removed.length > 0 ? (
                <Box flexDirection="column">
                  <Text color="magenta">~ now common for {c.player}</Text>
                  {c.removed.map((t) => (
                    <Text key={t.id}>  {t.points}pts  {t.name}</Text>
                  ))}
                </Box>
              ) : null}
            </Box>
          ))}
        </Box>
      ) : null}

      {snapshot ? (
        <Box flexDirection="column" marginTop={1}>
          {players.map((p) => (
            <Box key={p} marginTop={1}>
              <TaskList label={`${p} unique`} tasks={snapshot.unique[p] ?? []} />
            </Box>
          ))}
        </Box>
      ) : (
        <Loading label="initial fetch" />
      )}
    </Box>
  );
}
