import { z } from "zod";
import { loadSettings, type Settings } from "../../lib/settings";
import { CommandBody } from "../../components/Async";
import { ConfigView } from "../../components/ConfigView";
import { jsonOption } from "../../lib/cli-options";

export const description = "Show the effective configuration (project + local merge)";

export const options = z.object({
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };

export default function ConfigShow({ options }: Props) {
  return (
    <CommandBody<Settings>
      run={() => loadSettings()}
      json={options.json}
    >
      {(settings) => <ConfigView settings={settings} />}
    </CommandBody>
  );
}
