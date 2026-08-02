---
name: promotion
description: |
  Track an open Lore proposal through review to promotion, and handle changing an
  existing active record — revision (same record, corrected text) vs supersession
  (new record replaces old). Use after propose_record has opened a PR and you need to
  check its status, remind someone to review it, or when existing canon needs changing.
  Also use when the user asks what their recent sessions contributed — "what got
  extracted from my sessions", "what did lore capture", "my recent/pending
  contributions" — which is answered from the local pending-proposals cache confirmed
  against get_proposal.
---

# Promotion

Proposing a record opens a PR; it isn't canonical until a human merges that
PR. This skill covers what happens after `propose_record` returns: tracking
the proposal, shepherding it to a decision, and superseding correctly when
new knowledge replaces old.

## Handing it to the human who decides

**Every propose call also returns `reviewUrl` — give it to your human.** It
opens the proposal on the portal's review page, where promotion actually
happens. Don't make them go find it: a proposal nobody is pointed at is a
proposal nobody decides.

Say who needs to act and paste the link, e.g. *"Proposed — someone with
approve rights on `org` can promote it here: `<reviewUrl>`"*. Prefer it over
`pr.url`: on a deployment with no external git host, `pr.url` is an internal
`local://` identifier, not a page anyone can open.

If the person you're talking to is themselves a reviewer, say so plainly —
approving your own proposal is permitted (one approval promotes; the gate is
who holds the role, and the promotion records that the approver also authored
it). Hand them the same link.

## Tracking an open proposal

`propose_record` returns a `pr` object with a `ref` (e.g.
`"owner/repo#123"`). Hold onto that ref — it's the only handle you have on
the proposal's review state.

1. Call `get_proposal(ref)` to check current status: open, merged, or
   closed, plus `createdAt` and, once decided, `decidedAt`.
2. There is no separate app-level review workflow to poll — `get_proposal`
   proxies the git host's own PR state directly. "Open" means still awaiting
   review or changes; there is nothing else to check beyond the PR itself.
3. An unknown `ref` comes back as a not-found error, not a crash — double
   check you're passing the exact `ref` string `propose_record` returned,
   not a reconstructed guess.

## Answering "what did my sessions contribute?"

Session capture is asynchronous: the session-end hook only *enqueues* a
reference, and the librarian extracts and proposes on a later drain. So the
**current session has contributed nothing yet** — say so; what exists now
came from previous sessions, recorded by librarian runs in
`${LORE_HOME:-~/.lore}/pending-proposals.json` (`proposals` opened and
duplicate `drops`, shapes owned by this plugin's
`hooks/pending-proposals.mjs`).

To answer:

1. Read the file. If both arrays are empty (or it's absent), nothing has
   been proposed from this machine yet — explain "nothing" with the capture
   queue state: run this plugin's `hooks/drain-queue.mjs status` for the
   queued/parked counts. Never count raw `capture-queue.jsonl` lines
   yourself — entry statuses and expiry live in that script.
2. The file is a per-machine, stale-is-fine cache — confirm before
   reporting. Group `proposals` entries by `ref` (batch candidates share
   one PR) and call `get_proposal` once per distinct ref, newest first;
   past ~20 refs, report the rest from the cache and point at the portal's
   review page. Report open ones for review (see "Handing it to the human
   who decides"); report merged ones as promoted canon.
3. Collect the ULIDs of decided (merged/closed) entries as you go, then
   remove them in one call:
   `echo '{"ulids": ["..."]}' | node "<hooks dir>/pending-proposals.mjs" prune`.
   Never rewrite the file by hand — the script is its only writer.
4. Mention `drops` when present — a user asking "what got extracted" also
   deserves to hear what was deliberately *not* proposed and why. A pending
   entry the user disowns is `retract(record_ulid)`.

Proposals opened from another machine won't appear here; the cross-machine
view is the portal's review page.

## Answering "please change X" (request changes)

A reviewer who wants something different comments on the proposal instead of
promoting it. Answer it with **`revise_proposal(ref, ulid, …)`** — the same
structured patch `propose_revision` takes (`title`, `description`, `tags`,
`body`, `links`, `stale_after`), landing as one more commit on that proposal's existing
draft, keeping the ref and the reviewer's discussion.

**Never answer feedback by calling `propose_record`/`propose_revision`
again.** That opens a *second* proposal against the same record and leaves
the first one open — two competing candidates, and whichever is promoted last
wins silently. If you already did it, say so and ask the reviewer to reject
the stale one. (Re-sending the original call with its `idempotency_key` and
the edit folded in is refused outright — `propose/idempotency-conflict` — so
nothing is lost, but `revise_proposal` was the right call all along.)

You need not be the proposal's author: the gate is the record's scope in your
contribute set, the same grant `propose_record` needs. Say whose feedback you
are acting on.

An edit can't link to a record promoted to canon *after* the proposal was
opened — the draft is validated as it stands, so the target fails
`links/typed-integrity` ("does not exist as a record id in this repo"). Get
this proposal promoted, then add the link with a follow-up `propose_revision`.

The comment itself isn't readable through the MCP tools — `get_proposal`
returns state, not discussion. Ask the human what the reviewer asked for
rather than guessing, and re-state the change you're about to make before you
make it.

## Shepherd checklist

A proposal that sits open past its usefulness is worse than one that was
never made — treat "propose and forget" as a failure mode, not a stopping
point.

- [ ] Hand the human `reviewUrl` at the moment you propose — not later, and
      not only the ref. This is the single most common reason a proposal
      stalls: nobody was told where to go.
- [ ] Confirm the proposal is actually open (`get_proposal`) before nudging
      anyone — don't remind a reviewer about something already merged.
- [ ] If it's been open longer than feels normal for this team's review
      cadence, say so explicitly and name the ref — a vague "please review
      Lore stuff" is easy to ignore; a specific ref with an age is not.
- [ ] If the proposal was superseded by events (the underlying decision
      changed before merge, or someone else proposed something better),
      say so rather than letting it merge stale — don't just abandon it
      silently.
- [ ] Once merged, treat the record as canonical from that point forward:
      stop citing draft state, and if downstream work was blocked on it,
      unblock it.

## Revision vs supersession

Two different operations change existing canon — pick by what changed:

- **The decision changed** → supersede. History keeps both records; the old
  one flips to `superseded` and points forward.
- **Only the text is wrong** (a typo, a stale sentence, sharper wording or
  tags) → **`propose_revision`**. Same record, same ULID, same path; pass the
  `ulid` plus only the fields you're changing (`title`, `description`,
  `tags`, `body`, `stale_after` — the record's declared OKF expiry date,
  `YYYY-MM-DD`; an empty string removes it — and `links` — a wholesale
  replacement of the typed-link arrays, for repairing a relationship that
  was missed). Identity can't be
  touched, a no-op patch is refused, and the result is a normal PR to track
  like any other proposal. Never supersede to fix wording — it forks history
  for no reason.

## Supersession

Use supersession, not a second unrelated proposal or a revision, when new
knowledge replaces an existing *active* record rather than merely adding
alongside it.

1. Find the predecessor's ULID (via retrieval — `search_knowledge` or
   `get_record`) and confirm it's currently `active`. Superseding a record
   that isn't active is refused.
2. Author the successor record normally through the authoring skill's loop
   (`create_record` → fill → `validate_record` until clean).
3. Call `propose_record` with `supersedes: [<predecessor ULID>]`. The
   successor and the predecessor's status flip to `superseded` land in the
   same commit — this is the only correct way to do it; don't try to edit
   the predecessor's status yourself in a separate proposal, and don't
   propose the successor without the `supersedes` link even if you plan to
   "clean up the old one later." An unlinked successor leaves two active
   records making conflicting claims until someone notices.
4. Track the resulting PR exactly as any other proposal (see above) — a
   supersession is one PR, one ref, one review.

## When to ask instead of act

If it's unclear whether new knowledge should supersede an existing record or
merely relate to it (`relates` / `constrains` / `implements` instead), don't
guess silently — surface the ambiguity. Superseding is a stronger claim than
linking, and an incorrect supersession flips an active record's status that
a reviewer now has to notice and undo.
