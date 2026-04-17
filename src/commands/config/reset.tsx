import { Text } from "ink";
import { z } from "zod";

import { Async } from "../../components/Async";
import { resetLocalConfig } from "../../lib/settings";

export const description = "Delete leagues.local.json and fall back to project defaults";

export const options = z.object({});

function ResetResult({ removed }: { removed: boolean }) {
  return removed ? (
    <Text>
      <Text color="magenta">✗</Text> removed leagues.local.json
    </Text>
  ) : (
    <Text color="gray">(no leagues.local.json to remove)</Text>
  );
}

export default function Reset() {
  return (
    <Async
      loader={async () => ({ removed: (await resetLocalConfig()).removed })}
      render={ResetResult}
    />
  );
}
