import { z } from "zod";

import { RegionsSelect } from "../../components/RegionsSelect";
import { loadSettings } from "../../lib/settings";

export const description = "Toggle unlocked regions interactively (writes leagues.local.json)";

export const options = z.object({});

export default function Regions() {
  return <RegionsSelect initial={loadSettings().unlockedRegions} />;
}
