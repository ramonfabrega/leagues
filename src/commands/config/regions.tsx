import { z } from "zod";
import { useState, useEffect } from "react";
import { Text } from "ink";
import { loadSettings } from "../../lib/settings";
import { RegionsSelect } from "../../components/RegionsSelect";
import type { Region } from "../../lib/catalog";

export const description = "Toggle unlocked regions interactively (writes leagues.config.json)";

export const options = z.object({});

export default function Regions() {
  const [initial, setInitial] = useState<Region[] | null>(null);
  const [err, setErr] = useState<Error | null>(null);

  useEffect(() => {
    loadSettings()
      .then((s) => setInitial(s.unlockedRegions))
      .catch((e: Error) => setErr(e));
  }, []);

  if (err) return <Text color="red">Error: {err.message}</Text>;
  if (!initial) return <Text color="gray">Loading…</Text>;
  return <RegionsSelect initial={initial} />;
}
