import { z } from "zod";

import { Json } from "../../components/Async";
import { ConfigView } from "../../components/ConfigView";
import { jsonOption } from "../../lib/cli-options";
import { loadSettings } from "../../lib/settings";

export const description = "Show the effective configuration (project + local merge)";

export const options = z.object({
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };

export default function ConfigShow({ options }: Props) {
  const settings = loadSettings();
  return (
    <Json json={options.json} data={settings}>
      <ConfigView settings={settings} />
    </Json>
  );
}
