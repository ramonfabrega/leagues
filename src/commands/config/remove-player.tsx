import { Box, Text } from "ink";
import { argument } from "pastel";
import { z } from "zod";

import { Async } from "../../components/Async";
import { Pick } from "../../components/Pick";
import { loadSettings, removeExtraPlayer, type Settings } from "../../lib/settings";

export const description = "Remove a player from your personal extraPlayers list";

export const args = z
  .array(z.string())
  .optional()
  .describe(
    argument({ name: "player", description: "Player RSN to remove (omit for interactive picker)" })
  );

type Props = { args: z.infer<typeof args> };

export default function RemovePlayer({ args }: Props) {
  const player = (args ?? []).join(" ").trim();
  if (player) {
    return (
      <Async
        loader={() => removeExtraPlayer(player)}
        render={(settings) => <SuccessMessage removed={player} settings={settings} />}
      />
    );
  }
  return <InteractivePicker />;
}

function InteractivePicker() {
  const extras = loadSettings().overrides.extraPlayers;
  return (
    <Pick
      label="Select a player to remove from extraPlayers"
      items={extras}
      emptyMessage='(no extraPlayers to remove — add one with "leagues config add-player <rsn>")'
      onPick={async (value) => {
        const next = await removeExtraPlayer(value);
        return <SuccessMessage removed={value} settings={next} />;
      }}
    />
  );
}

function SuccessMessage({ removed, settings }: { removed: string; settings: Settings }) {
  return (
    <Box flexDirection="column">
      <Text>
        <Text color="magenta">✗</Text> removed <Text bold>{removed}</Text>
      </Text>
      <Text color="gray"> wrote {settings.sources.local}</Text>
    </Box>
  );
}
