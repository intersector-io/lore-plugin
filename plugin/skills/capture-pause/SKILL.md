---
name: capture-pause
description: |
  Pause or resume lore's session capture. Use when the user wants to
  experiment, spike, or play around without new knowledge flowing into lore
  — "pause capture", "don't capture this", "stop lore from recording my
  sessions", "disable docs flowing into lore for a while" — or wants to turn
  capture back on, or asks whether capture is currently paused. Toggles a
  local marker file; retrieval and search keep working while paused.
---

# Capture pause

Capture is paused by one marker file: `${LORE_HOME:-~/.lore}/capture-paused`.
While it exists, the session-end hook records nothing (paused sessions are
never queued, not queued-for-later) and the drain claims nothing, so already
queued captures wait untouched until resume. Every session start announces
the paused state, so it cannot be forgotten silently.

Resolve the path the same way the hooks do: `$LORE_HOME` if set, else
`~/.lore`.

- **Pause:** `mkdir -p` that directory, then `touch` the marker. Confirm to
  the user: capture is paused on this machine until resumed — sessions that
  end while paused are permanently not captured, not deferred.
- **Resume:** `rm` the marker (already absent is fine — say it wasn't
  paused). Anything queued *before* the pause drains normally again.
- **Status:** the marker's existence is the whole answer; report it plainly.

What a pause does NOT change:

- **Retrieval keeps working.** `search_knowledge`, `get_record`, and the rest
  of the MCP tools are unaffected — pausing is about not *writing*, never
  about not *reading*.
- **Explicit authoring keeps working.** If the user deliberately asks to
  create or propose a record while paused, do it — the pause mutes the
  automatic session capture, not the user's own intent.
- **It is per-machine, not per-server.** The marker lives in the local lore
  home; teammates' capture is untouched.

If the user is instead worried about something *already* captured or
proposed, this is the wrong lever: point them at `retract` for a proposal
they want withdrawn, and remind them nothing reaches canon without a human
approving the proposal.
