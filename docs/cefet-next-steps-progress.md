# CEFET integration progress

The ordered handoff plan is in `.github/prompts/cefet-enrollment-content-and-adhoc.prompt.md`.

## Completed

- Added `platform-api/scripts/cefet-roster.ts`, an idempotent parser that preserves the roster display spelling and deduplicates names within each course.
- Added `platform-api/scripts/cefet-roster.spec.ts` covering accents, case-insensitive duplicates, and cross-course reuse.
- Added `User.externalSubject` and `User.identityProvider` with migration `1787279000000-UserExternalIdentity`. These fields are ready for a Microsoft Entra object ID; no token or credential is stored.
- Inventoried the supplied class source: three PDFs under `cefet-rj-classes` (Arquitetura de Computadores, Banco de Dados II, and the technical-course architecture list).
- Added `platform-api/scripts/seed-cefet-microsoft.ts`: an operator-driven MSAL device-code flow, tenant-scoped Graph pagination, exact normalized display-name matching, missing/ambiguous refusal, dry-run output, and transactional idempotent enrollment. Tokens are held in memory and never logged.
- Added `platform-api/src/assignment/enums/assignment-execution-mode.enum.ts`, `Assignment.executionMode`, DTO support, and migration `1787280000000-AssignmentExecutionMode`. Existing assignments default to `graded`; `adhoc` is explicit and currently only schema/API metadata until the runner vertical slice is implemented.
- Added `cefet-rj-classes/catalog.json` with the three discovered PDFs and an explicit `needs-extraction` status so source material is not silently converted into guessed assignments.
- Added `ExecutionWorkerPayload.executionMode`, runner `CreateWorkerDto.executionMode`, and Python worker branching so `adhoc` runs execute `/app/src/app.py` directly instead of invoking pytest. Scheduling skips test/template preparation for explicit adhoc assignments and preserves submitted files.
- Existing EEVEE auth is local/JWT. No Microsoft/Entra provider or Graph client is present.
- Existing Python content seed is `platform-api/scripts/seed-python-examples.ts` and should be reused as the importer pattern.

## Blocker for Microsoft lookup

A tenant-scoped Graph lookup needs an approved tenant/client configuration and delegated or application Graph permission. The local browser account can be used by an operator-run device-code or interactive login flow, but credentials/consent must not be automated or committed. Next agent should first confirm the approved auth path, then add a Graph adapter with pagination, retry/backoff, ambiguity reporting, dry-run, and transactional enrollment.

The script requires `@azure/msal-node` (declared in `platform-api/package.json`; install it and refresh the lockfile when package execution is available), `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, and the existing PostgreSQL environment. Run with `--dry-run` first. The app still needs a Microsoft login callback before the placeholder external-auth password can be used for interactive EEVEE login.

## Remaining sequence

1. Install `@azure/msal-node`, run the Microsoft script with `--dry-run`, then add the Microsoft login callback and approved Graph permissions.
2. Extract and review the three PDFs, then implement a source-traceable importer for exercises with deterministic tests only where contracts permit.
3. Complete API/UI behavior for `adhoc`: expose run-only status/output, prevent attempt scoring/persistence from treating it as graded, add cancellation/output limits, and verify authorization/cleanup. The runner command path is now present for Python.

## Verification

The frontend Pyodide IntelliSense implementation and real runtime regression tests passed before the current usage limit. Final platform type/test commands still need to be run when command execution credits are available.

## Session 2 update (2026-09-16)

Picked back up from the above. What changed:

- Installed `@azure/msal-node` in `platform-api` (lockfile refreshed). `npm run build` is clean on both `platform-api` and `assignment-runner`.
- `platform-api/scripts/cefet-roster.spec.ts` was never actually exercised by `npm test` (Jest's `rootDir` is `src`, so `scripts/*.spec.ts` was silently skipped). Added `scripts` to Jest `roots` in `platform-api/package.json` so it's part of the standard test run now. Full suite: 45 suites / 343 tests passing.
- Ran the real (non-mocked) frontend Pyodide smoke test (`front/scripts/test-python-runtime.mjs`) end-to-end: syntax check, lint, Unicode, large files, "no execution" guarantee, and lint-failure isolation all still pass. Front Jest suite (5 suites / 17 tests, including the Pyodide marker/client/runtime tests) is green. The Python intellisense work from the parallel `python-worker-intellisense` prompt is done and verified — nothing further needed there for now.
- Fixed a real bug in `seed-cefet-microsoft.ts`: the enrolled placeholder `passwordHash` was the literal string `'external-auth-no-password'`, not a bcrypt hash. `HashUtils.comparePassword` (`bcrypt.compareSync`) is not guaranteed to safely reject a non-bcrypt string on every version/platform — it can throw instead of returning `false`. Replaced it with a real bcrypt hash of a random, immediately-discarded UUID, so a local-login attempt against one of these accounts always safely fails instead of risking a 500 or relying on library-specific error handling.
- Reviewed `execution-request.service.ts`: it shows as "modified" in git status but has zero functional diff (CRLF/LF only) — not part of this feature, nothing to do there.

### Confirmed gap: `adhoc` execution mode is schema/runner-wired but not scoring-safe yet

Traced the full path: `CreateAssignmentDto.executionMode` → `Assignment.executionMode` → `SchedulingService.prepareAndRunWorker` (skips template/test prep, forwards `executionMode: 'adhoc'` to the runner) → `PythonDefaultStrategy.buildExecutionJobCommand` (runs `/app/src/app.py` directly instead of `trigger.py`+pytest). That part works and compiles.

What's still missing, confirmed by reading `execution-result.consumer.ts` and `Attempt` entity: attempt scoring has no concept of "run-only". `Attempt.score`/`passes`/`fails` are non-nullable columns, and the result consumer always runs the strategy's `processLogResult` (pytest-style parser) and writes a pass/fail score — for an `adhoc` run there's no pytest summary line to parse, so today it would silently record a misleading `0 passed / 0 total` "failed" attempt instead of "here's your program's raw output, no grade."

This is unreachable by students today: assignment creation is `AdminGuard`-protected and there is still **no frontend UI** anywhere that sets `executionMode: adhoc` (front has zero diff for this feature). So the gap is real but currently dormant, not an active bug in production.

Recommended design for whoever picks this up (not implemented yet, matches the original prompt's instruction to document rather than rush an unsafe execution path):

- Add an explicit `Attempt.executionMode` (or a new `AttemptStatus.RAN`/similar) so a run-only attempt is structurally distinct from a graded one, with `score`/`passes`/`fails` either nullable or a documented sentinel — needs a migration.
- Branch `execution-result.consumer.ts` on the assignment's `executionMode`: for `adhoc`, persist raw stdout/stderr/exit code and skip `processLogResult` entirely instead of feeding worker output through the pytest/Jest-style parser.
- Add the actual product surface: assignment editor toggle for `graded`/`adhoc`, a distinct "Run" (not "Submit for grading") action and result panel in the student workspace, output truncation, and a cancellation path — none of this exists in `front/` yet.
- Re-verify authorization and cleanup end to end once the above lands.

### Still blocked / needs your input

- The Microsoft Graph `--dry-run` was **not** executed — it needs real `MICROSOFT_TENANT_ID` and `MICROSOFT_CLIENT_ID` for the CEFET tenant app registration, which aren't available in this environment and shouldn't be guessed or fabricated. Provide them (e.g. via `platform-api/.env`, never committed) and confirm the approved Graph permission (`User.ReadBasic.All`, delegated) before the next agent runs `ts-node scripts/seed-cefet-microsoft.ts <roster> --dry-run`.
- Phase 2 (PDF import) is still just an inventory (`cefet-rj-classes/catalog.json`, all three sources marked `needs-extraction`). No text has been extracted or reviewed yet.
- Phase 3 needs an explicit go-ahead on the schema change above (new migration + entity change) before implementation, since it touches graded-attempt persistence.
