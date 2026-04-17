import { z } from "zod";

import { Async } from "../components/Async";
import { SummaryView } from "../components/Summary";
import { loadCatalog } from "../lib/catalog";
import { jsonOption, playerOption } from "../lib/cli-options";
import { areaBreakdown, getPlayerProgress, tierBreakdown } from "../lib/queries";
import { resolvePlayer } from "../lib/settings";

export const description = "Task count, points, tier/area breakdown for a player";

export const options = z.object({
  player: playerOption,
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };

export default function Summary({ options }: Props) {
  return (
    <Async
      loader={async () => {
        const rsn = resolvePlayer(options.player);
        const [player, catalog] = await Promise.all([getPlayerProgress(rsn), loadCatalog()]);
        return {
          username: player.username,
          totalPoints: player.totalPoints,
          completedCount: player.completed.length,
          totalTaskCount: catalog.tasks.length,
          byTier: tierBreakdown(player.completed),
          totalByTier: tierBreakdown(catalog.tasks),
          byArea: areaBreakdown(player.completed),
          unknownTaskIds: player.unknownTaskIds,
          levels: player.levels,
        };
      }}
      render={SummaryView}
      json={options.json}
      loadingLabel={`Fetching ${options.player ?? "default player"}`}
    />
  );
}
