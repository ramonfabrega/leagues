import React from "react";
import { z } from "zod";
import { option, argument } from "pastel";
import { findTasks, type Task } from "../lib/catalog";
import { CommandBody } from "../components/Async";
import { TaskList } from "../components/TaskList";
import { jsonOption } from "../lib/cli-options";

export const description = "Full-text search over task name + description";

export const args = z.array(
  z.string().describe(argument({ name: "query", description: "Search substring" }))
);

export const options = z.object({
  limit: z.number().default(50).describe(option({ description: "Cap result count" })),
  json: jsonOption,
});

type Props = {
  args: z.infer<typeof args>;
  options: z.infer<typeof options>;
};

type Payload = { query: string; count: number; tasks: Task[] };

export default function Search({ args, options }: Props) {
  const query = args.join(" ").trim();
  if (!query) throw new Error("Usage: leagues search <query>");
  return (
    <CommandBody<Payload>
      run={async () => {
        const matches = await findTasks(query);
        const tasks = matches.slice(0, options.limit);
        return { query, count: tasks.length, tasks };
      }}
      json={options.json}
    >
      {(data) => <TaskList label={`Search "${data.query}"`} tasks={data.tasks} />}
    </CommandBody>
  );
}
