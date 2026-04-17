import { z } from "zod";
import { option } from "pastel";
import { Text, Box } from "ink";
import path from "node:path";
import { CommandBody } from "../components/Async";

const ROOT = path.join(import.meta.dir, "../..");

export const description = "Pull the latest repo + reinstall dependencies";

export const options = z.object({
  scrape: z
    .boolean()
    .default(false)
    .describe(option({ description: "Also re-run `leagues scrape` after updating" })),
});

type Step = { name: string; stdout: string; stderr: string; exitCode: number };
type Payload = { steps: Step[] };

async function run(cmd: string[]): Promise<Step> {
  const proc = Bun.spawn(cmd, { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { name: cmd.join(" "), stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

type Props = { options: z.infer<typeof options> };

export default function Update({ options }: Props) {
  return (
    <CommandBody<Payload>
      loadingLabel="Updating"
      run={async () => {
        const steps: Step[] = [];
        for (const cmd of [["git", "pull"], ["bun", "install"]]) {
          const step = await run(cmd);
          steps.push(step);
          if (step.exitCode !== 0) {
            throw new Error(
              `\`${step.name}\` failed (exit ${step.exitCode})\n${step.stderr || step.stdout}`
            );
          }
        }
        if (options.scrape) {
          steps.push(await run(["bun", "src/cli.tsx", "scrape"]));
        }
        return { steps };
      }}
    >
      {(data) => (
        <Box flexDirection="column">
          {data.steps.map((s) => (
            <Box key={s.name} flexDirection="column" marginBottom={1}>
              <Text>
                <Text color="green">✓</Text> <Text bold>{s.name}</Text>
              </Text>
              {s.stdout ? <Text color="gray">{s.stdout}</Text> : null}
            </Box>
          ))}
          <Text color="gray">Done. Run `leagues --help` if new commands appeared.</Text>
        </Box>
      )}
    </CommandBody>
  );
}
