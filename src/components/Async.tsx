import React, { Suspense, use, useEffect, useMemo } from "react";
import { Text, useApp } from "ink";

export function Loading({ label = "Working" }: { label?: string }) {
  return <Text color="gray">{label}…</Text>;
}

export function ErrorMessage({ error }: { error: Error }) {
  return <Text color="red">Error: {error.message}</Text>;
}

class CommandErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
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
  render: (data: T) => React.ReactNode;
};

function AsyncContent<T>({ promise, json, render }: AsyncContentProps<T>) {
  const data = use(promise);
  const { exit } = useApp();
  useEffect(() => {
    exit();
  }, [exit]);
  if (json) return <Text>{JSON.stringify(data, null, 2)}</Text>;
  return <>{render(data)}</>;
}

type CommandBodyProps<T> = {
  run: () => Promise<T>;
  json?: boolean;
  loadingLabel?: string;
  children: (data: T) => React.ReactNode;
};

export function CommandBody<T>({ run, json, loadingLabel, children }: CommandBodyProps<T>) {
  const { exit } = useApp();
  const promise = useMemo(() => run(), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <CommandErrorBoundary
      onError={(err) => {
        process.exitCode = 1;
        exit(err);
      }}
    >
      <Suspense fallback={<Loading label={loadingLabel} />}>
        <AsyncContent promise={promise} json={json ?? false} render={children} />
      </Suspense>
    </CommandErrorBoundary>
  );
}
