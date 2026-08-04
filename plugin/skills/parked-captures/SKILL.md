---
name: parked-captures
description: |
  Retry or dismiss lore captures that are parked in the local capture queue.
  Use when the session-start notice reports parked captures, or when the user
  asks to "retry the parked captures", "dismiss/clear the parked captures",
  "drop those stuck captures", or asks why captures are parked and what to do
  about them. Runs the queue script for the user — they never type a command.
---

# Parked captures

A capture is **parked** when the librarian could not process it and a plain
retry would not help: the transcript is gone, the session reference is
missing, or the captured repo's scope isn't proposable for this user. Parked
entries never drain again on their own — someone has to either fix the cause
and retry them, or dismiss them. Both are your job, never the user's: run the
queue script yourself; never tell the user to run a `node` command, and never
edit `capture-queue.jsonl` directly — the script is its only writer.

The script is this plugin's `hooks/drain-queue.mjs` — resolve the hooks
directory as `${CLAUDE_PLUGIN_ROOT}/hooks` in Claude Code (or the directory
containing the drain-queue path printed by the session-start notice).

The causes are in the session-start notice, one line per distinct error;
each park's error names its own fix. (`status` prints the queued/parked
counts when you need a fresh read.)

- **Retry:** `node "<hooks dir>/drain-queue.mjs" retry` — re-queues every
  parked entry (attempts reset). Only worth it after the cause is fixed:
  retrying an unfixed park just burns a librarian run and parks it again.
- **Dismiss:** `node "<hooks dir>/drain-queue.mjs" clear` — drops every
  parked entry now. Irreversible (the captures are not proposed, and nothing
  re-creates them), so confirm with the user before running it — but it is
  the right call for unrecoverable parks: a transcript that no longer exists,
  or a scope nobody intends to open.

Both retry and clear act on **all** parked entries — there is no per-entry
form. If the user wants to keep some and drop others, say so plainly: fix
what's fixable first, retry everything, and the still-broken ones will park
again, ready to be dismissed.

## Fixing the causes

- **"transcript missing" / "no session ref"** — the session's transcript was
  cleaned up before the librarian ran. Nothing can recover it; dismiss.
- **A scope mismatch** ("scope … not proposable") — fixable, with the user
  in the loop: follow the scope-park instruction injected into the
  session-start context (create the repo's `.lore/scope.yml` marker, and an
  admin opens the scope via `set_authorization` — the onboarding skill walks
  through it). Then retry.
- **Transient-looking errors** (network, server down) that exhausted their
  attempts — check the server is reachable (`whoami`), then retry.

This skill is about queue entries that were never proposed. For a proposal
that *was* opened and should be withdrawn, use `retract`; for pausing capture
entirely, the capture-pause skill.
