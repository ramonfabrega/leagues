---
name: deep-modules
description: Apply John Ousterhout's "Deep Modules" philosophy when designing, reviewing, or refactoring code in this repo. Invoke when writing new modules, naming exports, deciding whether to extract a helper, or auditing a file for simplification.
---

# Deep Modules

From *A Philosophy of Software Design* (Ousterhout).

**Deep module** = small interface + lots of implementation.

```
┌─────────────────────┐
│   Small Interface   │  ← Few exports, simple params
├─────────────────────┤
│                     │
│  Deep               │  ← Complex logic hidden behind the interface
│  Implementation     │
│                     │
└─────────────────────┘
```

**Shallow module** = large interface + little implementation. The module forces callers to understand internal details; it adds API surface without hiding much.

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many exports, leaky params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Mostly just passes through
└─────────────────────────────────┘
```

## When designing or reviewing, ask

1. **Can I reduce the number of exports?** Every exported symbol is a commitment — callers depend on it, and you can't freely refactor it. Un-export anything only used within the module.
2. **Can I simplify the parameters?** A function that takes 8 flags is probably two functions in disguise, or should accept a higher-level object. Callers should not have to assemble complex shapes the module could build internally.
3. **Can I hide more complexity inside?** If three callers each do `if/else → parse → validate → transform` before calling your function, that pipeline belongs *inside* the module, not outside.
4. **Does the abstraction earn its keep?** A one-line wrapper that renames a call site is a shallow module pretending to be a deep one. Delete it.

## Applying this in this repo

- **`lib/catalog.ts`** is deep: callers say `await taskByName("Catch a Herring")` and get a typed `Task | undefined`. They don't know about JSON loading, zod validation, or the internal `Map` caches. The interface is ~5 functions; the implementation is ~80 lines.
- **`lib/queries.ts`** exposes `missingTasks(player, filter)` — one function, one filter object. Callers don't touch the catalog, the filter logic, or the completion-% null handling. Under the hood, `filterMissing` + `matchesFilter` are pure, testable helpers — not exported for external convenience, but for tests that want to skip the I/O.
- **`components/Async.tsx`** `<CommandBody>` hides Suspense, error boundaries, JSON mode, and exit plumbing behind one prop shape: `{ run, json?, children }`. Each command's render stays trivial.
- **`commands/*`** should be shallow *at the file level* (thin glue between CLI args and the deep modules). They're allowed to be small because their dependencies carry the weight.

## Anti-patterns to reject

- Re-exporting a type through a helper file purely for organizational symmetry.
- A `utils.ts` grab-bag of one-line functions. Either fold them into the module that uses them, or promote them into a real module with a focused purpose.
- A function that takes a `mode: "a" | "b" | "c"` flag and branches internally. Usually two or three separate functions with clear names.
- "Configuration by inversion" — accepting a giant options bag when callers only ever set two fields. Make those two fields dedicated parameters.

## When NOT to deepen

- A module is already small (< ~100 LOC) and its interface matches its implementation size. Don't invent hidden complexity just to look deep.
- Two callers share 3 lines of pre-processing but diverge after. Inline the duplication — premature abstraction creates worse shallowness than no abstraction.
- Tests need to see the seams. Pure helpers that are only exported for tests are fine — that's what `filterMissing` / `matchesFilter` / `mergeSettings` are here. They're implementation, not interface.

## Checklist before merging a new module

- [ ] Does every `export` have at least one caller outside this file? If not, make it module-private.
- [ ] Can I describe the module's purpose in one sentence? If it's "and also…" the module is probably two things.
- [ ] Would a reader of the interface need to read the implementation to use it correctly? If yes, the abstraction is leaky.
- [ ] Is there a parameter that's only non-default in one call site? That call site should probably move inside.
