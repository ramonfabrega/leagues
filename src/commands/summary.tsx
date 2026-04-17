import React from "react";
import { z } from "zod";
import { resolvePlayer } from "../../leagues.config";
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
  const rsn = resolvePlayer(options.player);
  return (
    <CommandBody<SummaryPayload>
      run={async () => {
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
      loadingLabel={`Fetching ${rsn}`}
    >
      {(data) => <SummaryView {...data} />}
    </CommandBody>
  );
}
