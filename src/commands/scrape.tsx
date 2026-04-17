import { Box, Text } from "ink";
import { z } from "zod";

import { CommandBody } from "../components/Async";
import { jsonOption } from "../lib/cli-options";
import { scrapeAndWrite } from "../scrape";

export const description = "Re-scrape the wiki tasks page into data/tasks.json";

export const options = z.object({
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };

type Payload = { league: string; source: string; scrapedAt: string; taskCount: number };

export default function Scrape({ options }: Props) {
  return (
    <CommandBody<Payload>
      run={async () => {
        const catalog = await scrapeAndWrite();
        return {
          league: catalog.league,
          source: catalog.source,
          scrapedAt: catalog.scrapedAt,
          taskCount: catalog.tasks.length,
        };
      }}
      json={options.json}
      loadingLabel="Scraping wiki"
    >
      {(data) => (
        <Box flexDirection="column">
          <Text>
            <Text color="green">✓</Text> scraped <Text bold>{data.taskCount}</Text> tasks
          </Text>
          <Text color="gray"> league: {data.league}</Text>
          <Text color="gray"> at: {data.scrapedAt}</Text>
          <Text color="gray"> from: {data.source}</Text>
        </Box>
      )}
    </CommandBody>
  );
}
