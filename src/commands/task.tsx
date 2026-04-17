import { z } from "zod";
import { argument } from "pastel";
import { taskByName, findTasks, type Task } from "../lib/catalog";
import { CommandBody } from "../components/Async";
import { TaskDetailsView } from "../components/TaskDetails";
import { TaskList } from "../components/TaskList";
import { jsonOption } from "../lib/cli-options";

export const description = "Show details for a single task (exact or fuzzy name)";

export const args = z.array(
  z.string().describe(argument({ name: "name", description: "Task name or search fragment" }))
);

export const options = z.object({
  json: jsonOption,
});

type Props = {
  args: z.infer<typeof args>;
  options: z.infer<typeof options>;
};

type Payload = { match: Task | null; suggestions: Task[]; query: string };

export default function TaskCmd({ args, options }: Props) {
  const query = args.join(" ").trim();
  if (!query) throw new Error("Usage: leagues task <name>");
  return (
    <CommandBody<Payload>
      run={async () => {
        const exact = await taskByName(query);
        if (exact) return { match: exact, suggestions: [], query };
        const suggestions = await findTasks(query);
        return { match: null, suggestions, query };
      }}
      json={options.json}
    >
      {(data) =>
        data.match ? (
          <TaskDetailsView task={data.match} />
        ) : (
          <TaskList
            label={`No exact match for "${data.query}" — ${data.suggestions.length} suggestions`}
            tasks={data.suggestions.slice(0, 20)}
          />
        )
      }
    </CommandBody>
  );
}
