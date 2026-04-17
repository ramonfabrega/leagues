import { useState, type ReactNode } from "react";
import { Text, Box, useApp, useInput } from "ink";

type Mode =
  | { kind: "picking" }
  | { kind: "saving" }
  | { kind: "done"; ok: ReactNode }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

export function Pick<T extends string>({
  label,
  instruction,
  items,
  initial,
  emptyMessage,
  onPick,
}: {
  label: string;
  instruction?: string;
  items: T[];
  initial?: T;
  emptyMessage?: string;
  onPick: (value: T) => Promise<ReactNode>;
}) {
  const { exit } = useApp();
  const startIdx = Math.max(0, initial ? items.indexOf(initial) : 0);
  const [cursor, setCursor] = useState(startIdx);
  const [mode, setMode] = useState<Mode>({ kind: "picking" });

  useInput((input, key) => {
    if (mode.kind !== "picking" || items.length === 0) return;
    if (key.upArrow || input === "k") setCursor((c) => (c - 1 + items.length) % items.length);
    else if (key.downArrow || input === "j") setCursor((c) => (c + 1) % items.length);
    else if (key.return) {
      const value = items[cursor]!;
      setMode({ kind: "saving" });
      onPick(value)
        .then((ok) => {
          setMode({ kind: "done", ok });
          exit();
        })
        .catch((e: Error) => {
          setMode({ kind: "error", message: e.message });
          process.exitCode = 1;
          exit(e);
        });
    } else if (key.escape || input === "q") {
      setMode({ kind: "cancelled" });
      exit();
    }
  });

  if (items.length === 0) {
    return <Text color="gray">{emptyMessage ?? "(nothing to pick)"}</Text>;
  }
  if (mode.kind === "saving") return <Text color="gray">Saving…</Text>;
  if (mode.kind === "done") return <>{mode.ok}</>;
  if (mode.kind === "cancelled") return <Text color="gray">(cancelled)</Text>;
  if (mode.kind === "error") return <Text color="red">Error: {mode.message}</Text>;

  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      <Text color="gray">  {instruction ?? "↑/↓ move · enter confirm · esc cancel"}</Text>
      <Box marginTop={1} flexDirection="column">
        {items.map((item, i) => {
          const isCursor = i === cursor;
          return (
            <Text key={item}>
              <Text color={isCursor ? "cyan" : undefined}>{isCursor ? "› " : "  "}</Text>
              <Text color={isCursor ? "cyan" : undefined} bold={isCursor}>{item}</Text>
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}
