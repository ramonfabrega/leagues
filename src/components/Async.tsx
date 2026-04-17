import { Text, useApp } from "ink";
import { Component, type ReactNode, Suspense, use, useEffect, useState } from "react";

function Loading({ label = "Working" }: { label?: string }) {
  return <Text color="gray">{label}…</Text>;
}

function ErrorMessage({ error }: { error: Error }) {
  return <Text color="red">Error: {error.message}</Text>;
}

class CommandErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    if (this.state.error) return <ErrorMessage error={this.state.error} />;
    return this.props.children;
  }
}

type AsyncContentProps<T> = {
  promise: Promise<T>;
  json: boolean;
  render: (data: T) => ReactNode;
};

function AsyncContent<T>({ promise, json, render }: AsyncContentProps<T>) {
  const data = use(promise);
  return (
    <Json json={json} data={data}>
      {render(data)}
    </Json>
  );
}

type JsonProps<T> = {
  json: boolean;
  data: T;
  children: ReactNode;
};

export function Json<T>({ json, data, children }: JsonProps<T>) {
  const { exit } = useApp();
  useEffect(() => {
    if (json) process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
    exit();
    terminateRender(json);
  }, [exit, json, data]);
  if (json) return null;
  return <>{children}</>;
}

export function useExit() {
  const { exit } = useApp();
  useEffect(() => {
    exit();
    terminateRender(false);
  }, [exit]);
}

// Ink's TTY renderer leaves the cursor at the end of the last rendered line
// without a trailing newline, which makes zsh show a trailing `%`. Write one
// only on a TTY and only for non-JSON output (JSON already has its own `\n`).
function terminateRender(json: boolean) {
  if (!json && process.stdout.isTTY) process.stdout.write("\n");
}

type AsyncProps<T> = {
  loader: () => Promise<T>;
  render: (data: T) => ReactNode;
  json?: boolean;
  loadingLabel?: string;
};

export function Async<T>({ loader, render, json, loadingLabel }: AsyncProps<T>) {
  const { exit } = useApp();
  const [promise] = useState(() => loader());
  return (
    <CommandErrorBoundary
      onError={(err) => {
        process.exitCode = 1;
        exit(err);
      }}
    >
      <Suspense fallback={<Loading label={loadingLabel} />}>
        <AsyncContent promise={promise} json={json ?? false} render={render} />
      </Suspense>
    </CommandErrorBoundary>
  );
}
