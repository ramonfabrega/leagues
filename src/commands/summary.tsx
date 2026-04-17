import { z } from "zod";
import { resolvePlayer } from "../lib/settings";
import {
  getPlayerProgress,
  tierBreakdown,
  areaBreakdown,
} from "../lib/queries";
import { loadCatalog } from "../lib/catalog";
import { CommandBody } from "../components/Async";
import { SummaryView, type SummaryPayload } from "../components/Summary";
import { jsonOption, playerOption } from "../lib/cli-options";

export const description = "Task count, points, tier/area breakdown for a player";

export const options = z.object({
  player: playerOption,
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };

export default function Summary({ options }: Props) {
  return (
    <CommandBody<SummaryPayload>
      run={async () => {
        const rsn = await resolvePlayer(options.player);
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
      json={options.json}
      loadingLabel={`Fetching ${options.player ?? "default player"}`}
    >
      {(data) => <SummaryView {...data} />}
    </CommandBody>
  );
}
