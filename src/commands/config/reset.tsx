import { z } from "zod";
import { Text } from "ink";
import { deleteLocalConfig, LOCAL_CONFIG_PATH } from "../../lib/settings";
import { CommandBody } from "../../components/Async";

export const description = "Delete leagues.local.json and fall back to project defaults";

export const options = z.object({});

export default function Reset() {
  return (
    <CommandBody<{ removed: boolean }>
      run={async () => ({ removed: await deleteLocalConfig() })}
    >
      {(data) =>
        data.removed ? (
          <Text>
            <Text color="magenta">✗</Text> removed {LOCAL_CONFIG_PATH}
          </Text>
        ) : (
          <Text color="gray">(no leagues.local.json to remove)</Text>
        )
      }
    </CommandBody>
  );
}
