# Retained transport outcomes

The bridge claims `request-<uuid>.json` by renaming it to
`executing-<uuid>.json` before opening it. A failed rename executes no code.
Claimed inputs and `response-<uuid>.json` remain in the mailbox. A repeated
agent tick cannot execute the claimed input again, including when response
publication failed. Repeated launcher delivery can claim only the same pending
request; it does not create or replay a mutation.

Call `ae_request_status` with `{ "requestId": "<uuid>" }` after a timeout.
The tool reads retained files without contacting AE. The UUID routes through
`outcomes/<uuid>.json`, so both shared push and targeted instance results can
be recovered after restarting the MCP server. No caller-provided filesystem
path or live-instance selection is accepted by status lookup.

States are `queued`, `running` (claimed, completion not established),
`unknown`, `cancelled`, `completed`, `failed`, and `not_found`. A response is
terminal; `completed` describes host execution and the nested operation may
still report its own application failure. `cancelled` requires a successful
removal before host claim, or proof the request was never submitted.
`not_found` is not proof the operation never ran. Nonterminal states report
`mayStillRun: true`; timeout and transport error classes never authorize
automatic replay. MCP error details preserve the request ID, state, and flag.

A per-mailbox `pending-request.lock` blocks subsequent host calls until the
previous request has a terminal outcome. A subsequent call checks retained
completion and releases the previous gate. Neither this gate nor the legacy
push dispatcher lock is stolen because it is old. A separate short filesystem
transition lock serializes gate creation and cleanup across MCP processes.
Brief transition contention is retried for up to one second without stealing
the lock. Request-scoped recovery metadata survives bookkeeping failures; a
known host completion remains terminal even if gate cleanup fails.

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
  host sessions and long-running host interruption remain unqualified.
- Mailbox output checks resolve existing symlinks/junctions and missing suffix
  components. They do not defeat an attacker swapping links concurrently, and
  cannot constrain raw scripts. Mailbox write access remains host code access.
- Different push/pull routes to the same AE process and coexistence with
  separately installed upstream agents are not qualified. Agent global symbols
  still overlap upstream; use one bridge installation per host session.
