import path from "node:path";
import { Box, Text } from "ink";
import { z } from "zod";

import { Async } from "../components/Async";

const ROOT = path.join(import.meta.dir, "../..");

export const description = "Remove the global `leagues` binary (runs bun unlink from the repo)";

export const options = z.object({});

function UninstallResult({ stdout }: { stdout: string }) {
  return (
    <Box flexDirection="column">
      <Text>
        <Text color="green">✓</Text> <Text bold>leagues</Text> unlinked
      </Text>
      {stdout ? <Text color="gray">{stdout}</Text> : null}
      <Text color="gray">Safe to delete the repo folder now.</Text>
    </Box>
  );
}

export default function Uninstall() {
  return (
    <Async
      loadingLabel="Unlinking"
      loader={async () => {
        const proc = Bun.spawn(["bun", "unlink"], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
        const [stdout, stderr] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
        ]);
        const code = await proc.exited;
        if (code !== 0) throw new Error(`bun unlink failed (exit ${code}):\n${stderr || stdout}`);
        return { stdout: stdout.trim() };
      }}
      render={UninstallResult}
    />
  );
}
