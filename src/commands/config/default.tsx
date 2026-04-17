import { z } from "zod";
import { useEffect, useState } from "react";
import { argument } from "pastel";
import { Text, Box } from "ink";
import { loadSettings, setDefaultPlayer, type Settings } from "../../lib/settings";
import { CommandBody } from "../../components/Async";
import { Pick } from "../../components/Pick";

export const description = "Set your personal default player (writes leagues.local.json)";

export const args = z
  .array(z.string())
  .optional()
  .describe(argument({ name: "player", description: "Player RSN (omit for interactive picker)" }));

type Props = { args: z.infer<typeof args> };

export default function SetDefault({ args }: Props) {
  const player = (args ?? []).join(" ").trim();
  if (player) {
    return (
      <CommandBody<Settings>
        run={() => setDefaultPlayer(player)}
      >
        {(settings) => <SuccessMessage settings={settings} />}
      </CommandBody>
    );
  }
  return <InteractivePicker />;
}

function InteractivePicker() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [err, setErr] = useState<Error | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings).catch(setErr);
  }, []);

  if (err) return <Text color="red">Error: {err.message}</Text>;
  if (!settings) return <Text color="gray">Loading…</Text>;
  return (
    <Pick
      label="Select default player"
      items={settings.players}
      initial={settings.defaultPlayer}
      onPick={async (value) => {
        const next = await setDefaultPlayer(value);
        return <SuccessMessage settings={next} />;
      }}
    />
  );
}

function SuccessMessage({ settings }: { settings: Settings }) {
  return (
    <Box flexDirection="column">
      <Text>
        <Text color="green">✓</Text> default player set to <Text bold color="yellow">{settings.defaultPlayer}</Text>
      </Text>
      <Text color="gray">  wrote {settings.sources.local}</Text>
    </Box>
  );
}
