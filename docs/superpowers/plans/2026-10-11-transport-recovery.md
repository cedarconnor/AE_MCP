# Transport recovery implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Track evidence below.

**Goal:** Fix the confirmed review findings without authorizing replay of uncertain host edits.

**Architecture:** Keep retained per-request evidence and the per-mailbox gate. Cancellation competes atomically with host claim, and staged publication failures retain affirmative cancellation evidence. Competing clients wait within their deadline. Instance shutdown retains history and separates quit acknowledgement from process-exit evidence.

**Tech stack:** TypeScript, Node filesystem IPC, ES3 ExtendScript, Vitest simulated hosts.

**Spec:** Accepted review in this chat; `docs/transport-outcomes.md` supplies the existing safety contract.

## Global constraints

- Never infer cancellation or permission to replay from missing files, stale locks, or heartbeat silence.
- Preserve existing retained outcomes and UUID routing, including across instance-name reuse.
- No live project edits, agent installation, force-unlock, publication, or push in this change.
- Keep JSX ES3-compatible. Tests use isolated mailboxes and injected host/OS boundaries.

## Review focus

- Publication failure after bookkeeping: retain proof, release only proven-terminal gates.
- Cancellation versus claim: exactly one rename wins; a lost race remains uncertain.
- Concurrent callers and deadlines: waiting must not submit expired work or attribute another mutation to this caller.
- Shutdown and name reuse: never remove retained results or treat silence as confirmed process exit.
- Duplicate queue heads and denied filesystem access: avoid starvation and misleading contention errors.

### Task 1: Durable publication and cancellation

**Files:** `src/transport/FileIpcTransport.ts`, `tests/transport-faults.test.ts`, `tests/transport-recovery.test.ts`.
**Interfaces:** `requestStatus(UUID)` recognizes retained `cancelled-UUID.json`; pending cancellation renames the source into that record. Staging failure renames the unpublished staging source into the same record. Missing records remain unknown.

- [x] Add fault tests for publication EPERM, cancellation bookkeeping failure, claim winning cancellation, and missing evidence.
- [x] Run tests and verify the regression failures.
- [x] Implement affirmative cancellation evidence and best-effort staging cleanup, preserving uncertainty on failed proof publication.
- [x] Run focused transport tests and commit.

### Task 2: Retain outcomes when an instance stops

**Files:** `src/operations/instance.ts`, `tests/instance-stop.test.ts`.
**Interfaces:** Stopping leaves the mailbox and outcome ledger intact; UUID status works after stop and a new heartbeat for the same instance name.

- [x] Add a simulated stop regression with a completed earlier request and a reused name; verify failure.
- [x] Remove destructive stop cleanup, retaining the heartbeat as historical evidence.
- [x] Run instance and recovery tests and commit.

### Task 3: Bounded cross-client waiting and lock diagnostics

**Files:** `src/transport/FileIpcTransport.ts`, `src/transport/AeTransport.ts`, `src/tools/define-tool.ts`, transport/tool tests.
**Interfaces:** Gate acquisition accepts a deadline. A waiting request that expires reports its own cancelled identity and a separate blocking request status. Existing legacy dispatcher locks remain respected; errors other than EEXIST surface promptly.

- [ ] Add two-client completion/deadline tests and EACCES lock regression; verify failures.
- [ ] Poll gate status outside transition locks, revalidate expiry before submission, preserve blocker metadata through MCP results.
- [ ] Correct stale-lock comments; retain the compatibility busy lock rather than silently removing interoperation protection.
- [ ] Run focused tests and commit.

### Task 4: Shutdown acknowledgement and queue progress

**Files:** `src/operations/instance.ts`, `jsx/agent.jsx`, `jsx/serve.jsx`, instance/JSX host tests.
**Interfaces:** Quit is deferred until the active request has returned, so retained acknowledgement and idle heartbeat are published first. Stop reports heartbeat quietness separately from confirmed process exit. Duplicate pending identities are excluded by queue selection and never replayed.

- [ ] Add simulated scheduled-quit and duplicate-head tests, including failed duplicate removal; verify failures.
- [ ] Implement deferred quit and truthful shutdown reporting, preserving request recovery metadata.
- [ ] Skip ledger-backed duplicate requests when choosing a queue head.
- [ ] Run focused tests and commit.

### Task 5: Batch explanation, docs, and final verification

**Files:** `src/operations/batch.ts`, `tests/batch.test.ts`, generated references, `docs/transport-outcomes.md`, `CHANGELOG.md`.
**Interfaces:** Batch project-boundary rejection remains intact; the explanation applies to all ungrouped operations. Default sibling continuation stays unchanged.

- [ ] Exercise generated batch JSX for project-boundary rejection, sibling continuation and stopOnError; verify the inaccurate diagnostic regression.
- [ ] Correct diagnostic and operation description, update recovery documentation and generated references.
- [ ] Run `npm run check`, inspect the diff and obtain an independent final review; address important findings with regression tests.
- [ ] Commit validated changes and report native qualification limits.

## Execution ledger

- Base: `8a51795`; isolated branch `codex/transport-recovery`.
- Pre-flight: tasks 1 and 3 share gate/status semantics; task 3 must preserve the cancellation evidence introduced in task 1. Tasks 2 and 4 share stop lifecycle; task 4 must retain history from task 2.
- Ruling: proceed inline from the accepted review without another approval checkpoint, per the user's instruction to continue and the session autonomy requirements.
- Ruling: retain the legacy busy lock for compatibility; consolidation is optional finding #8, not a correctness requirement. Removing it without an interoperation migration risks concurrent native dispatch.
- Ruling: defer quit through AE's existing scheduled-task mechanism; heartbeat silence remains availability evidence only, not proof of process exit. Native quit timing remains unqualified until live testing.

- Task 1: complete. Publication and cancellation regressions failed with unknown/mayStillRun before fixes; 40 focused transport tests pass and test typechecking passes.
- Task 2: complete. Stop retention regression failed with completed becoming unknown before fix; 41 instance/recovery tests pass.
