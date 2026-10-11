# After Effects Uber MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax for tracking. The user approved implementation with builder judgment; no additional execution-choice approval is needed.

**Goal:** Deliver a consolidated, locally tested After Effects MCP for editable motion graphics.

**Architecture:** Pinned attributed Kumo foundation, hardened file IPC, original validated motion-spec compiler and review tools. Keep one server and native AE execution, with persisted request outcomes and portable review artifacts.

**Tech Stack:** TypeScript, Node 24, MCP SDK, Zod, ES3 ExtendScript, Vitest, Windows AE 2026.

**Spec:** `docs/superpowers/specs/2026-10-10-after-effects-uber-mcp-design.md` (approved by user).

## Global Constraints

- Preserve upstream license notices and pinned provenance; do not copy GUNMIN prose without a license.
- Windows/AE 2026 is the live validation target; offline tests are not runtime qualification.
- Never automatically retry a mutation with an unknown timeout outcome.
- Native editable text/shapes/keyframes; rebuilding creates a new revision composition.
- Read-only/category policy applies to new tools; raw JSX is opt-in.
- No unrelated artist project replacement or output overwrite during validation.

## Review Focus

- Failure to remove/claim a readable command must not repeat a mutation (Task 2).
- A timeout after host claim must expose a queryable request identity (Task 2).
- Long/Unicode titles, invalid timing and duplicate layer keys must fail early or report constraints (Task 3).
- A denied high-level build must not bypass the operation policy (Task 4).
- Review captures must identify sampled times and content hashes without granting visual approval (Task 4).

### Task 1: Attributed runnable foundation

Files: existing upstream `src/`, `jsx/`, offline `tests/`, fixtures/build config; new `README.md`, `THIRD_PARTY_NOTICES.md`, `docs/research/*`.

- [x] Import the pinned Kumo source and tests, excluding Git metadata, upstream instruction files, generated binaries and unrelated artwork. Retain LICENSE.
- [x] Initialize the local repository, identity/package scripts and ignore research clones/build artifacts. Keep a recorded baseline commit.
- [x] Install locked dependencies without lifecycle scripts; typecheck/build and run only offline tests first.
- [x] Record all thirteen reviews and exact source revisions.

### Task 2: Request claim, retained outcomes and containment

Files: `jsx/serve.jsx`, `src/transport/FileIpcTransport.ts`, `src/transport/AeTransport.ts`, `src/config.ts`, request status tool/module, targeted transport/host tests.

Interfaces: retain existing `AeTransport.execute(EvalRequest): Promise<EvalResult>`; extend errors with optional request identity/outcome; expose a request-status lookup via an MCP tool. No caller may rerun the request during recovery.

- [x] Write failing tests for failed claim, consume/unlink race and late-response lookup; run to confirm failure.
- [x] Claim request files by rename before reading/executing, fail closed if ownership is unavailable, retain response/claim evidence and expose status by UUID.
- [x] Ensure consumed timeout reports unknown/running outcome and retains recovery identity. Pending cancellation must be distinguished from already claimed work.
- [x] Canonicalize output parent paths to reject symlink/junction aliases of mailbox roots; add fixture coverage.
- [x] Run targeted tests and typecheck; commit the completed change.

### Task 3: Motion specification and native compiler

Files: `src/motion/spec.ts`, `src/motion/templates.ts`, `src/motion/compile.ts`, `tests/motion-spec.test.ts`, `tests/motion-compile.test.ts`, `examples/*.json`.

Interfaces: export `motionSpecSchema`, `MotionSpec`, `createMotionPreset(...)`, `compileMotionSpec(spec): string` and canonical spec hashing. The compiler returns an ES3 function body yielding `{ok, compId, layers, specHash, warnings}` and creates only a new composition.

- [x] Write failing validation tests for non-finite/bounded numbers, color ranges, duplicate layer keys, invalid entrance/exit timing and hostile Unicode strings.
- [x] Implement version 1 spec for comp settings and editable text/rect/ellipse layers with explicit layout/timing/colors; preset generators for title/lower-third/statistic cards.
- [x] Implement native ES3 text/shape creation and native eased position/opacity animation; preserve new comp on partial failure with explicit created IDs and error evidence.
- [x] Include responsive sizing and text measurement warnings, stable IDs and native keyframe readback in build output.
- [x] Run tests/typecheck and commit.

### Task 4: MCP motion, QA and review workflow

Files: `src/tools/motion.ts`, `src/tools/index.ts`, `src/motion/qa.ts`, `src/motion/review.ts`, `src/mcp-workflow.ts`, tool/policy tests.

Interfaces: `ae_motion_plan` creates normalized spec/hash offline; `ae_motion_build` validates/builds; `ae_motion_audit` inspects native composition facts; `ae_motion_review` captures multiple frames through existing render-frame handler and writes hash-bound manifest. Export new tools for integration into ALL_TOOLS. Prompt/resource guidance is independently authored.

- [x] Write failing tests verifying denied builds never reach transport, build errors are MCP errors, and review files bind exact frame bytes/times/spec identity.
- [x] Implement tools, enforce read-only and category policy, bind instance targeting, and propagate native/partial failures.
- [x] Register workflow prompt/resource and examples. Review records explicitly keep artist acceptance pending and describe limited QA coverage.
- [x] Run targeted tests and protocol discovery through a real stdio client; commit.

### Task 5: Live acceptance, packaging and handoff

Files: `scripts/smoke-live.mjs`, `scripts/check-protocol.mjs`, `docs/VALIDATION.md`, `README.md`, `docs/SETUP.md`.

- [x] Run offline suite/typechecks/build; fix actual failures before native work.
- [x] Connect to installed AE, inspect active project and scripting prerequisite, and use disposable named demo content without replacing existing work.
- [x] Build motion graphic, inspect native layers/keyframes, revise via stable layer ID, capture entrance/hold/exit samples, save new AEP if safe. Visually inspect captures.
- [x] Test packed package outside checkout with stdio initialize/list/call and verify runtime assets are included.
- [x] Request independent code review, fix material findings, rerun affected checks.
- [x] Write validation report with exact passing/untested/blocked boundaries and deliver artifact/setup links.

Native smoke and sampled-frame inspection passed after explicit user approval to enable AE's scripting file/network preference. See docs/VALIDATION.md for evidence and limits; artist acceptance remains pending.
