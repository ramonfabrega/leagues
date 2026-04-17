import { Box, Text, useApp, useInput } from "ink";
import { useState } from "react";

import { REGIONS, type Region } from "../lib/catalog";
import { ALWAYS_UNLOCKED, setUnlockedRegions } from "../lib/settings";

type Mode = "editing" | "saving" | "saved" | "cancelled" | "error";

export function RegionsSelect({ initial }: { initial: Region[] }) {
  const { exit } = useApp();
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<Region>>(() => new Set(initial));
  const [mode, setMode] = useState<Mode>("editing");
  const [err, setErr] = useState<string | null>(null);

  useInput((input, key) => {
    if (mode !== "editing") return;
    if (key.upArrow || input === "k") setCursor((c) => (c - 1 + REGIONS.length) % REGIONS.length);
    else if (key.downArrow || input === "j") setCursor((c) => (c + 1) % REGIONS.length);
    else if (input === " ") {
      const r = REGIONS[cursor]!;
      if (ALWAYS_UNLOCKED.includes(r)) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(r)) next.delete(r);
        else next.add(r);
        return next;
      });
    } else if (key.return) {
      setMode("saving");
      setUnlockedRegions([...selected])
        .then(() => {
          setMode("saved");
          exit();
        })
        .catch((e: Error) => {
          setErr(e.message);
          setMode("error");
          process.exitCode = 1;
          exit(e);
        });
    } else if (key.escape || input === "q") {
      setMode("cancelled");
      exit();
    }
  });

  if (mode === "saving") return <Text color="gray">Saving…</Text>;
  if (mode === "saved") {
    const sorted = REGIONS.filter((r) => selected.has(r) || ALWAYS_UNLOCKED.includes(r));
    return (
      <Box flexDirection="column">
        <Text>
          <Text color="green">✓</Text> unlocked regions saved
        </Text>
        <Text color="gray"> [{sorted.join(", ")}]</Text>
      </Box>
    );
  }
  if (mode === "cancelled") return <Text color="gray">(cancelled — no changes saved)</Text>;
  if (mode === "error") return <Text color="red">Error: {err}</Text>;

  return (
    <Box flexDirection="column">
      <Text bold>Toggle unlocked regions</Text>
      <Text color="gray"> ↑/↓ move · space toggle · enter save · esc cancel</Text>
      <Box marginTop={1} flexDirection="column">
        {REGIONS.map((r, i) => {
          const isLocked = ALWAYS_UNLOCKED.includes(r);
          const isOn = selected.has(r) || isLocked;
          const isCursor = i === cursor;
          const mark = isLocked ? "[●]" : isOn ? "[x]" : "[ ]";
          const markColor = isLocked ? "gray" : isOn ? "green" : "gray";
          return (
            <Text key={r}>
              <Text color={isCursor ? "cyan" : undefined}>{isCursor ? "› " : "  "}</Text>
              <Text color={markColor}>{mark}</Text>{" "}
              <Text color={isCursor ? "cyan" : undefined} bold={isCursor}>
                {r}
              </Text>
              {isLocked ? <Text color="gray"> (always unlocked)</Text> : null}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}
