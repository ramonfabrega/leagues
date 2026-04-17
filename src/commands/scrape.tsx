import { Box, Text } from "ink";
import { z } from "zod";

import { Async } from "../components/Async";
import { jsonOption } from "../lib/cli-options";
import { scrapeAndWrite } from "../scrape";

export const description = "Re-scrape the wiki tasks page into data/tasks.json";

export const options = z.object({
  json: jsonOption,
});

type Props = { options: z.infer<typeof options> };

function ScrapeResult({
  league,
  source,
  scrapedAt,
  taskCount,
}: {
  league: string;
  source: string;
  scrapedAt: string;
  taskCount: number;
}) {
  return (
    <Box flexDirection="column">
      <Text>
        <Text color="green">✓</Text> scraped <Text bold>{taskCount}</Text> tasks
      </Text>
      <Text color="gray"> league: {league}</Text>
      <Text color="gray"> at: {scrapedAt}</Text>
      <Text color="gray"> from: {source}</Text>
    </Box>
  );
}

export default function Scrape({ options }: Props) {
  return (
    <Async
      loader={async () => {
        const catalog = await scrapeAndWrite();
        return {
          league: catalog.league,
          source: catalog.source,
          scrapedAt: catalog.scrapedAt,
          taskCount: catalog.tasks.length,
        };
      }}
      render={ScrapeResult}
      json={options.json}
      loadingLabel="Scraping wiki"
    />
  );
}
