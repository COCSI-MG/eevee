---
description: "Implement CEFET Microsoft student enrollment, class exercise ingestion, and testless ad hoc execution"
name: "CEFET Enrollment, Content, and Ad Hoc Execution"
agent: "agent"
argument-hint: "Optional: phase 1, 2, or 3; defaults to all"
tools: ["search", "edit", "runCommands", "runTasks", "problems", "testFailure", "runTests", "usages"]
---

# Goal

Extend EEVEE for the CEFET workflow in three ordered phases:

1. Seed/enroll students by resolving their institutional Microsoft identities in the CEFET tenant.
2. Convert the exercises in `eevee/cefet-rj-classes` into maintainable EEVEE classes, assignments, templates, and tests.
3. Design and implement a safe ad hoc project mode for code that can be run without tests, with an explicit end condition and resource limits.

Do not ask for clarification unless blocked after inspecting the existing auth, database, assignment-runner, and class content. Keep changes scoped to EEVEE and preserve existing grading behavior.

## Source context

- The pasted student roster is at `C:/Users/João Vitor Coimbra/.codex/attachments/f9889e37-9aa9-408a-abf8-d5f7e4b41d27/pasted-text.txt`. It contains course headings followed by institutional display names, with duplicates across courses and accents/typos that must not be silently “corrected”.
- CEFET exercise source is in `eevee/cefet-rj-classes/`, currently including PDFs for Arquitetura de Computadores and Banco de Dados II and a technical-course architecture list. Inspect all files before choosing extraction or manual transcription.
- Existing Python seed prior art is `eevee/platform-api/scripts/seed-python-examples.ts`; it is idempotent, transactional, validates schema, and links assignments/templates.
- Existing auth is in `eevee/platform-api/src/auth` and currently uses local/JWT flows. Inspect whether Microsoft/Entra login exists in another package or branch before adding dependencies.
- Assignment execution is in `eevee/assignment-runner`; do not change the Python grading strategy for ordinary assignments.

## Phase 1 — Institutional Microsoft enrollment

### Discovery

- Identify the Microsoft identity provider configuration, tenant ID, client ID, redirect flow, and claims currently available after a local CEFET login. Treat tenant IDs, client secrets, tokens, and student data as sensitive; never print tokens or commit secrets.
- Determine the canonical institutional identifier: preferred order is immutable Microsoft object ID, then institutional email/UPN, then normalized display name only as a controlled fallback. “Institutional name” search must be tenant-scoped and must handle accents, repeated names, and missing users deterministically.
- Use Microsoft Graph only with delegated/application permissions already authorized for the tenant. If the local browser account is the only available credential, build a dry-run/resolution flow that the operator can execute while signed in; do not automate credential entry or consent.

### Implementation

- Add an idempotent platform-api seed or CLI command that accepts the roster file/course mapping and resolves students through the approved Microsoft identity source.
- Store only the minimum identity fields needed by EEVEE, preserve the provider subject/object ID, and make repeated runs safe. Report matched, ambiguous, missing, and already-enrolled users without exposing access tokens.
- Require explicit course/class mapping and an administrator/teacher identity. Support `--dry-run`, transaction rollback, and a confirmation summary before writes.
- Add tests for normalization, duplicate names, ambiguous matches, missing users, pagination, rate-limit retry/backoff, and idempotent enrollment.

## Phase 2 — Import `cefet-rj-classes`

- Inventory PDFs and any source files. Extract text with a reproducible tool, preserve page/section references, and manually inspect extraction quality for code, SQL, punctuation, and Portuguese accents.
- Map each source course to an EEVEE class and each exercise to an assignment/template. Keep source attribution and exercise identifiers in descriptions or metadata. Do not invent tests where the source does not define an objectively gradable contract; mark such items for review.
- Prefer existing seed conventions and worker types. For programming exercises, create tests and boilerplate only when the specification supports deterministic assertions. For prose/non-code exercises, identify whether EEVEE supports the required response type before creating records.
- Make the importer idempotent and transactional. Add a report mode that lists proposed classes, assignments, templates, test coverage, and unresolved exercises without writing.
- Add focused tests for extraction/parsing, stable identifiers, upserts, duplicate prevention, and rollback.

## Phase 3 — Ad hoc projects without tests

Treat this as a product and execution-contract decision, not merely a nullable `testContent` field.

- Inspect the current assignment/template schema, runner contract, UI submission flow, timeout/resource limits, and result persistence.
- Propose explicit modes, for example `graded` (tests required) and `adhoc` (run-only). Define the end condition: user-triggered run returns stdout/stderr/exit code, with cancellation and a hard timeout; there is no “completed assignment” state unless a user explicitly saves a run or the product defines a session stop action.
- Keep run-only execution isolated, network-disabled where possible, filesystem sandboxed, bounded by CPU/memory/output limits, and protected against arbitrary persistence. Never let ad hoc mode bypass authentication or tenant authorization.
- Update API contracts, database migration, assignment editor, student workspace, runner, and result UI together. Preserve the existing graded path and make the mode visible before execution.
- Add tests for missing-test rejection in graded mode, successful/failed/timed-out/cancelled ad hoc runs, output truncation, authorization, and cleanup.
- If the repository lacks enough infrastructure for a safe implementation, deliver the design, schema/API proposal, and a minimal feature-flagged vertical slice; document the remaining blocker rather than shipping an unsafe execution path.

## Sequencing and validation

Complete and validate Phase 1 before Phase 2, then Phase 3. At each phase:

- Run the narrow unit/integration tests and type checks for touched packages.
- Run a dry-run against representative roster/content before any database write.
- Verify no credentials, access tokens, or personal roster data enter logs, source control, or client bundles.
- Summarize files changed, commands run, unresolved ambiguities, and the exact next phase.

## Definition of done

- Microsoft enrollment resolves institutional users safely and idempotently, with dry-run and ambiguity reporting.
- CEFET exercise material is imported through a reproducible, source-traceable, idempotent pipeline with tests where contracts permit.
- Ad hoc run-only behavior has an explicit product end condition and hard execution limits, or a reviewed design/feature-flagged slice if infrastructure is insufficient.
- Existing EEVEE graded assignments and authentication behavior remain intact.
