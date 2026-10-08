---
description: "Implement real client-side Python intellisense (syntax/indentation diagnostics, lint, optional completions) for the PYTHON_DEFAULT worker's Monaco workspace editor"
name: "Python Worker Intellisense"
agent: "agent"
argument-hint: "Optional: which phase to run (1-6), defaults to all"
tools: ["search", "edit", "runCommands", "runTasks", "problems", "testFailure", "runTests", "openSimpleBrowser", "usages"]
---

# Goal

Give the Python assignment workspace editor real intellisense, on par with what
TypeScript/JavaScript workers already get. Today, opening a `PYTHON_DEFAULT`
assignment in the Monaco editor only gets Monarch syntax **highlighting** —
there are **no diagnostics at all**: broken indentation, a missing colon, an
invalid `def`, or a typo in a function name all look exactly like valid code
until the student submits and the pytest job fails server-side. This must work
reliably for whole classes hitting it concurrently (dozens of students per
lab session, sometimes on weak school networks), so it has to be **entirely
client-side** — no new per-session backend process, no per-keystroke network
call.

Treat this file as the full spec. Don't ask the user clarifying questions
unless you hit a genuine blocker after trying the approaches below — just
implement, phase by phase, committing as you go.

## Why this approach (read before changing the architecture)

- Monaco has a first-class TypeScript/JavaScript language service built in
  (that's what powers the existing `.ts/.tsx/.js` intellisense), but **no
  Python language service**. The `"python"` language registered in Monaco is
  Monarch-tokenizer-only (syntax colors), never diagnostics.
- A real Python LSP (Pyright/Jedi-language-server/python-lsp-server) normally
  runs as a **process**, which would mean spinning up a backend process per
  student session — that contradicts how this app is built everywhere else
  (see `filestash`, `type-packs`: everything student-facing that can be
  client-only, is client-only, so it scales for free with the number of
  browsers and doesn't add backend load).
- **Decision: use [Pyodide](https://pyodide.org/)** (full CPython + stdlib
  compiled to WebAssembly, runs in a Web Worker). It lets us run real Python
  tooling (`ast`/`compile`, `pyflakes`, optionally `jedi`) **inside the
  student's browser**, lazily, only when they open a Python assignment. This
  mirrors the existing `type-packs` pattern (see below): a static, self-hosted
  asset, fetched once, cached, and applied only for the relevant `workerType`.

If Pyodide turns out to be a dead end for a specific sub-goal (e.g. `jedi`
completions are too slow/flaky), fall back to the simpler tier below it rather
than abandoning the whole approach — see the tiers.

## Prior art / extension points already in the codebase (read these first)

The codebase already has a clean, data-driven extension point per
`WorkerType` for editor behavior — follow it instead of inventing a new
mechanism:

- [front/src/app/interface/scheduler-api/worker.ts](../../front/src/app/interface/scheduler-api/worker.ts) —
  `WorkerType` enum. Only `PYTHON_DEFAULT` matters here.
- [front/src/lib/monaco/worker-editor-config.ts](../../front/src/lib/monaco/worker-editor-config.ts) —
  `WORKER_EDITOR_CONFIG_REGISTRY`, one entry per `WorkerType` including
  `compilerPreset` (TS/JS only, currently `null` for Python) and
  `importCompletionPolicy`. Add a new field here (e.g. `pythonIntellisense:
  boolean` or `diagnosticsProvider?: "pyodide"`) instead of hardcoding
  `WorkerType.PYTHON_DEFAULT` checks elsewhere.
- [front/src/lib/monaco/language.ts](../../front/src/lib/monaco/language.ts) —
  resolves the Monaco language id per file/workerType (`"python"` already
  works here, nothing to change).
- [front/src/lib/monaco/intellisense/compiler.ts](../../front/src/lib/monaco/intellisense/compiler.ts) —
  pattern reference for "per-workerType-preset config applied to the Monaco
  language service." Your Python diagnostics wiring is the same shape, one
  language over.
- [front/src/lib/monaco/intellisense/type-packs.ts](../../front/src/lib/monaco/intellisense/type-packs.ts) —
  **this is the pattern to copy for asset loading**: fetches a static JSON
  blob from `/type-packs/{dir}/types.json` (self-hosted under `front/public/`,
  built by [front/scripts/build-type-packs.mjs](../../front/scripts/build-type-packs.mjs)),
  cached in a `Map`, applied only when the relevant `workerType` is active,
  cleared on dispose. Pyodide's runtime/wheel assets should be self-hosted
  under `front/public/pyodide/` the same way (see Phase 0) — do **not** point
  at the `cdn.jsdelivr.net` Pyodide CDN as the primary source; classroom
  networks may block or throttle it, and the whole point of self-hosting
  `type-packs` was to avoid exactly that kind of external dependency.
- [front/src/lib/monaco/worker-source-map.json](../../front/src/lib/monaco/worker-source-map.json) —
  maps `WorkerType` → type-pack directory name. `python_default` has no entry
  today (expected, TS/JS only); leave it alone, Python doesn't need a type
  pack, it needs a diagnostics worker instead.
- [front/src/lib/monaco/workspace/runtime.ts](../../front/src/lib/monaco/workspace/runtime.ts) —
  `refreshRuntime()` is the central place that reacts to `workerType` changes
  per active editor registration. It currently does:
  ```ts
  if (workerLanguage === "typescript" || workerLanguage === "javascript") {
    applyLanguageDefaults(latest.monaco, latest.workerType);
  }
  void applyTypePack(latest.monaco, latest.workerType);
  ```
  Add an `else if (workerLanguage === "python") { void applyPythonIntellisense(...) }`
  branch here. `registerWorkspaceRuntime(...).dispose()` is where the last
  editor unmounts — dispose your Pyodide worker there too (see Phase 5).
- [front/src/components/editor/monaco-code-editor.tsx](../../front/src/components/editor/monaco-code-editor.tsx)
  and [front/src/components/editor/use-monaco-editor-lifecycle.ts](../../front/src/components/editor/use-monaco-editor-lifecycle.ts) —
  the actual editor mount lifecycle (`onMount` → `registerWorkspaceRuntime`).
  You likely don't need to touch these directly; `runtime.ts` is the hook
  point.
- [front/package.json](../../front/package.json) — no Python/WASM tooling yet.
  `@monaco-editor/react` + `monaco-editor` are the only editor deps.

## Tiers (implement in order, each one is independently shippable)

1. **Tier 1 — Syntax/indentation diagnostics (this is the literal ask).**
   Run the student's code through Python's own parser (`compile(source,
   "<student>", "exec", ast.PyCF_ONLY_AST)` or `ast.parse`) inside the Pyodide
   worker. On `SyntaxError`/`IndentationError`, extract `lineno`/`offset`/`msg`
   and turn each into a Monaco marker (`monaco.MarkerSeverity.Error`) via
   `monaco.editor.setModelMarkers(model, "python-syntax", markers)`. This
   alone fixes "doesn't track indentation / invalid function" — ship it first
   and validate end-to-end before adding anything else.
2. **Tier 2 — Lint (undefined names, unused imports, invalid function
   signatures at call sites, etc).** Once Tier 1 works, `micropip.install`
   (or bundle a vendored wheel — check what's simplest/fastest to load)
   `pyflakes` inside the same worker and run its checker, merging its
   warnings into the same marker set with `MarkerSeverity.Warning`.
3. **Tier 3 — Completions/hover (stretch goal, do only if time remains).**
   `jedi` is pure Python and works under Pyodide. Register
   `monaco.languages.registerCompletionItemProvider("python", ...)` and
   `registerHoverProvider("python", ...)` backed by `jedi.Script(...)` calls
   proxied through the same worker. If this is too slow/flaky in the time
   available, ship Tiers 1–2 and leave this as a documented follow-up instead
   of blocking on it.

## Phased task breakdown

### Phase 0 — Feasibility spike (don't skip)

- Add `pyodide` as a dependency in `front/package.json` (check current
  published version's browser/Next.js compatibility notes first).
- Figure out how to self-host its assets: copy the relevant files from
  `node_modules/pyodide/` into `front/public/pyodide/` (this will be tens of
  MB — confirm it's excluded from git via `.gitignore` and instead
  regenerated by a build step, same spirit as `build-type-packs.mjs`; add a
  `front/scripts/copy-pyodide-assets.mjs` and a `prebuild`/`postinstall` npm
  script if that's the cleanest fit).
- Prove you can boot Pyodide inside a **dedicated Web Worker** (not the main
  thread — booting Pyodide blocks for ~1-3s and must never freeze the editor
  UI) in a throwaway test page, and successfully run `ast.parse` on a string
  with a deliberate indentation error, getting a structured error back on the
  main thread via `postMessage`.
- Confirm Next.js's dev/prod build doesn't mangle the worker bundling (Next
  needs `new Worker(new URL(...))` or an equivalent supported pattern —
  check how, if at all, workers are already used elsewhere in `front/` before
  picking an approach).
- **If Pyodide genuinely cannot be made to work self-hosted/offline within
  reasonable effort**, the documented fallback is a pure-JS/TS syntax check
  (e.g. a small hand-rolled indentation/bracket-balance checker, or a
  lightweight existing JS package for Python tokenizing) that only covers
  Tier 1. Note clearly in the PR description which path was taken and why.

### Phase 1 — Worker runtime

- `front/src/lib/monaco/python/pyodide-worker.ts`: the actual Web Worker
  entry. Loads Pyodide once (singleton), exposes a message-based API, e.g.
  `{ type: "check", requestId, code } -> { type: "result", requestId,
  diagnostics: PythonDiagnostic[] }`.
- `front/src/lib/monaco/python/pyodide-client.ts`: main-thread singleton
  (module-level state, same style as `type-packs.ts`'s `packCache`/
  `appliedPackDir` module state) that:
  - Lazily creates the worker on first use.
  - Sends the active model's content, debounced (~300–500ms after the last
    keystroke, and immediately on file open).
  - Ignores stale responses (track a request/version counter, same pattern
    as `applicationVersion` in `type-packs.ts`).
- Define a small shared `PythonDiagnostic` type (line, column, endLine,
  endColumn, message, severity) used by both worker and client.

### Phase 2 — Wire into the existing runtime lifecycle

- Extend `WorkerEditorConfig` in `worker-editor-config.ts` with whatever flag
  you need (keep it boolean/simple, don't over-engineer a plugin system for
  one language).
- In `runtime.ts`, on every relevant model change for the active Python file,
  call the Phase 1 client and apply `monaco.editor.setModelMarkers(...)`.
  Make sure markers are cleared/updated per-model (a student can have
  multiple `.py` files open in the same workspace tree) and disposed when a
  model is disposed (`disposeWorkspaceModels` already exists — hook into it
  or mirror its cleanup).

### Phase 3 — Pyflakes lint (Tier 2)

- Wire it in behind the same worker RPC, merged into one marker list.
- Make sure a pyflakes failure/timeout never blocks or hides Tier 1's syntax
  markers (independent try/catch per checker inside the worker).

### Phase 4 — Completions/hover via jedi (Tier 3, stretch)

- Only attempt after 1–3 are solid. Time-box it.

### Phase 5 — Classroom-scale correctness & perf guardrails

- Pyodide boot cost is paid **once per browser tab**, not per file — verify
  the worker is a true singleton across all open `.py` files/tabs in one
  workspace session.
- Zero impact on non-Python assignments: nothing in this feature should be
  fetched/loaded/executed unless the active `workerType` is
  `PYTHON_DEFAULT`. Verify via network tab that opening a Node/React
  assignment never triggers a Pyodide fetch.
- Non-blocking UX: show some lightweight "preparing Python tools…" indicator
  on first load (reuse existing toast/UI patterns, e.g.
  `front/src/hooks/use-toast.ts`) but never disable typing while it loads.
- Fail closed: if the worker fails to boot (network blip, unsupported
  browser, whatever) swallow the error, log it, and leave the editor exactly
  as it behaves today (no diagnostics, no crash, no dangling loading state).
- Dispose the worker (`worker.terminate()`) when the last workspace runtime
  registration for that editor instance is torn down, to avoid leaking a
  large WASM heap per opened/closed workspace across a long student session.

### Phase 6 — Validation

- Manual test matrix (do all of these, in the actual running app, for a
  `PYTHON_DEFAULT` assignment workspace):
  - Valid code → no markers.
  - Bad indentation (e.g. mismatched `def`/body indent) → error marker at
    the right line.
  - Missing colon after `def`/`if`/`for` → error marker.
  - Undefined name → warning marker (Tier 2).
  - Unused import → warning marker (Tier 2).
  - Large file (few hundred lines) → diagnostics still return in a
    reasonable time (say, under ~1s after debounce), typing stays smooth.
  - Rapid typing → worker isn't spammed (debounce actually debounces; check
    via a console log counter or the browser's worker message trace).
  - Open workspace → switch to a different (non-Python) assignment → back to
    Python → no duplicate workers, no stale diagnostics from the previous
    session.
  - Throttle network to "Slow 3G"/offline in devtools before first load →
    confirm graceful fallback, no crash, no infinite spinner.
- Add automated tests where the logic is pure/testable (e.g. the
  marker-building function that turns a Python worker's raw error payload
  into Monaco marker objects) under the existing Jest setup — see
  `front/src/components/shared/pagination.test.tsx` or
  `front/src/hooks/use-paginated-search.test.tsx` for the project's test
  conventions (colocated `*.test.tsx`/`*.test.ts`).
- Run `get_errors`/`runTests` on everything touched before considering a
  phase done.

## Explicit non-goals

- Do **not** change the actual grading path (`assignment-runner`'s
  `PythonDefaultStrategy`/pytest execution, salvaged separately on
  `feature/worker-de-python-v2`). This is purely an editor-side UX feature —
  the source of truth for "did the tests pass" remains the server-side
  pytest run.
- Do not add any new backend endpoint or persistent process for this. It has
  to work with zero backend involvement per keystroke.
- Do not regress existing TypeScript/JavaScript/Node worker intellisense —
  `refreshRuntime()` is shared code, be careful to only add a new branch, not
  touch the existing TS/JS path.
- Don't over-build a generic "pluggable diagnostics provider" abstraction for
  a single language — a couple of `if (workerLanguage === "python")` branches
  in the existing structure is enough; match the codebase's existing level of
  abstraction (see `compilerPreset`/`applyTypePack` — simple, per-workerType,
  data-driven, no framework).

## Definition of done

- [ ] Opening a `PYTHON_DEFAULT` assignment workspace shows red squiggles on
      syntax/indentation errors, matching line/column, with no server round
      trip.
- [ ] (Tier 2) Undefined-name and unused-import warnings show as yellow
      squiggles.
- [ ] No Pyodide asset is fetched for non-Python assignments.
- [ ] No editor freeze on first Python file open, even on a throttled
      network.
- [ ] Repeated open/close of Python workspaces does not leak workers (check
      DevTools > Performance/Memory or a simple worker-count assertion).
- [ ] `get_errors` clean on all touched files; relevant Jest tests pass.
- [ ] PR description states clearly which tiers shipped and which were
      deferred, and why, if any.
