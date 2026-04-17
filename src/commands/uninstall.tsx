import React from "react";
import { z } from "zod";
import { Text, Box } from "ink";
import path from "node:path";
import { CommandBody } from "../components/Async";

const ROOT = path.join(import.meta.dir, "../..");

export const description = "Remove the global `leagues` binary (runs bun unlink from the repo)";

export const options = z.object({});

type Payload = { stdout: string; stderr: string };

export default function Uninstall() {
  return (
    <CommandBody<Payload>
      loadingLabel="Unlinking"
      run={async () => {
        const proc = Bun.spawn(["bun", "unlink"], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
        const [stdout, stderr] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
        ]);
        const code = await proc.exited;
        if (code !== 0) throw new Error(`bun unlink failed (exit ${code}):\n${stderr || stdout}`);
        return { stdout: stdout.trim(), stderr: stderr.trim() };
      }}
    >
      {(data) => (
        <Box flexDirection="column">
          <Text>
            <Text color="green">✓</Text> <Text bold>leagues</Text> unlinked
          </Text>
          {data.stdout ? <Text color="gray">{data.stdout}</Text> : null}
          <Text color="gray">Safe to delete the repo folder now.</Text>
        </Box>
      )}
    </CommandBody>
  );
}
