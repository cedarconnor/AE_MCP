# Retained transport outcomes

The bridge claims `request-<uuid>.json` by renaming it to
`executing-<uuid>.json` before opening it. A failed rename executes no code.
Claimed inputs and `response-<uuid>.json` remain in the mailbox. A repeated
agent tick cannot execute the claimed input again, including when response
publication failed. Repeated launcher delivery can claim only the same pending
request; it does not create or replay a mutation.

Cancellation renames an unclaimed request to `cancelled-<uuid>.json`. This
competes with the host's claim rename: only one can take the pending source.
The retained cancellation file survives later bookkeeping errors. If request
publication fails, moving the unpublished staging file to that cancellation
record proves non-submission. If a source-file lock prevents that move too,
the transport creates an exclusive cancellation marker based on the failed
publication; its presence is the evidence and it may be empty. Staging cleanup
is best-effort while the file remains locked. If neither proof can be retained, the state
remains conservative. Neither request-file absence nor heartbeat silence is
cancellation evidence. Queue selection skips pending duplicates with existing
claim, response, or cancellation evidence, even if deleting the duplicate would
fail. Direct delivery also refuses these identities.

Call `ae_request_status` with `{ "requestId": "<uuid>" }` after a timeout.
The tool reads retained files without contacting AE. The UUID routes through
`outcomes/<uuid>.json`, so both shared push and targeted instance results can
be recovered after restarting the MCP server. No caller-provided filesystem
path or live-instance selection is accepted by status lookup.

States are `queued`, `running` (claimed, completion not established),
`unknown`, `cancelled`, `completed`, `failed`, and `not_found`. A response is
terminal; `completed` describes host execution and the nested operation may
still report its own application failure. `cancelled` requires a successful
atomic cancellation before host claim, or proof the request was never submitted.
`not_found` is not proof the operation never ran. Nonterminal states report
`mayStillRun: true`; timeout and transport error classes never authorize
automatic replay. MCP error details preserve the request ID, state, and flag.

A per-mailbox `pending-request.lock` blocks subsequent host calls until the
previous request has a terminal outcome. A competing caller waits within its
deadline, checks retained completion, and acquires the gate when safe. On
expiry it reports its own UUID as `cancelled`, `mayStillRun: false`, because
its work was never submitted. A separate `blockingRequest` identifies the
earlier unresolved operation; this metadata also survives the MCP tool layer.
The deadline is checked again after filesystem bookkeeping, immediately before
publication and dispatcher launch, so a delayed gate or lock cannot knowingly
submit already-expired work. This does not impose a hard execution deadline on
AE once publication has occurred.
Neither this gate nor the legacy
push dispatcher lock is stolen because it is old. A separate short filesystem
transition lock serializes gate creation and cleanup across MCP processes.
Brief transition contention is retried for up to one second (bounded by the
caller's remaining deadline) without stealing
the lock. Request-scoped recovery metadata survives bookkeeping failures; a
known host completion remains terminal even if gate cleanup fails.

The legacy push dispatcher lock is retained for compatibility. Only `EEXIST`
is contention; other acquisition errors surface as transport failures. Lock
timestamps remain diagnostic and do not authorize stealing ownership.

`instance.stop` marks the resident agent as stopping, closes the project and
schedules quit after the active JSX request returns, allowing the response and
idle heartbeat to publish first. A stopping agent claims no further requests;
discovery excludes it from routing. Retained stopping records also prevent
automatic push fallback when no available agent remains, since age is not proof
that the shutting-down host has exited. A newly registered available agent can
be addressed normally. Scheduling/close errors restore the poller; a deferred
quit exception restores it and records the error in the heartbeat.
It retains the entire instance mailbox, so old results remain recoverable even
when the instance name is reused. An unacknowledged stop remains a failure with
its recovery metadata, regardless of heartbeat silence. On success,
`quitAcknowledged: true` means AE accepted scheduling, and `stopped: true` means
the agent went quiet. `exitConfirmed: false` explicitly records that process
exit was not independently observed. A blocked scheduled task or modal dialog
can still require inspection.

The default mailbox is `%TEMP%/ae-uber-mcp/runtime` (the equivalent OS temp
directory on macOS). Node, dispatcher, and resident-agent fallbacks agree;
`AE_MCP_RUNTIME_DIR` remains supported. The startup stub filename is
`ae-uber-mcp-agent.jsx`. Existing upstream Kumo runtime files are separate.

## Limits

- These are file-backed process-restart recovery guarantees, not power-loss
  durability, exactly-once execution across arbitrary filesystem failures, or
  transactions/rollback for host mutations.
- No history garbage collector runs automatically. Retained files contain
  scripts, payloads, and results; disk use grows until deliberately archived.
- A lost/unpublishable response, host crash, corrupt gate, or MCP crash inside
  the short transition section can leave calls blocked. Confirm host execution
  has stopped and inspect the project before manually repairing that mailbox;
  age or heartbeat silence alone is insufficient. No force-unlock tool exists.
- Filesystem failure/claim scenarios were tested with a simulated host. The
  bounded native motion smoke subsequently exercised ordinary execution and
  retained responses on Windows/AE 26.2.1 (see [validation](VALIDATION.md)).
  Duplicate native delivery, interrupted NTFS/ExtendScript publication, multiple
  host sessions, deferred native shutdown and long-running host interruption
  remain unqualified. The recovery revisions use filesystem fault injection
  and simulated JSX execution; they have not been exercised against native AE.
- Existing permanently unresolved mailboxes are not automatically repaired.
  Restart the resident agent/AE to load updated JSX before using the revised
  cancellation protocol; mixed versions are not qualified.
  Safe shutdown requires the version 2 resident agent; older agents refuse the
  stop operation before saving or closing the project.
- Mailbox output checks resolve existing symlinks/junctions and missing suffix
  components. They do not defeat an attacker swapping links concurrently, and
  cannot constrain raw scripts. Mailbox write access remains host code access.
- Different push/pull routes to the same AE process and coexistence with
  separately installed upstream agents are not qualified. Agent global symbols
  still overlap upstream; use one bridge installation per host session.
