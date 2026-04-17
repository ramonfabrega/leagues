import { Text } from "ink";
import { z } from "zod";

import { useExit } from "../../components/Async";
import { resetLocalConfig } from "../../lib/settings";

export const description = "Delete leagues.local.json and fall back to project defaults";

export const options = z.object({});

export default function Reset() {
  const { removed } = resetLocalConfig();
  useExit();
  return removed ? (
    <Text>
      <Text color="magenta">✗</Text> removed leagues.local.json
    </Text>
  ) : (
    <Text color="gray">(no leagues.local.json to remove)</Text>
  );
}
