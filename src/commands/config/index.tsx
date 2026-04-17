import { z } from "zod";
import {
  loadSettings,
  loadLocalConfig,
  type Settings,
  type LocalConfig,
} from "../../lib/settings";
import { CommandBody } from "../../components/Async";
import { ConfigView } from "../../components/ConfigView";
import { jsonOption } from "../../lib/cli-options";

export const description = "Show the effective configuration (project + local merge)";

export const options = z.object({
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };

type Payload = { settings: Settings; local: LocalConfig | null };

export default function ConfigShow({ options }: Props) {
  return (
    <CommandBody<Payload>
      run={async () => ({
        settings: await loadSettings(),
        local: await loadLocalConfig(),
      })}
      json={options.json}
    >
      {(data) => <ConfigView settings={data.settings} local={data.local} />}
    </CommandBody>
  );
}
