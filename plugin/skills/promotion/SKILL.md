---
name: promotion
description: |
  Track an open Lore proposal through review to promotion, and handle changing an
  existing active record — revision (same record, corrected text) vs supersession
  (new record replaces old). Use after propose_record has opened a PR and you need to
  check its status, remind someone to review it, or when existing canon needs changing.
---

# Promotion

Proposing a record opens a PR; it isn't canonical until a human merges that
PR. This skill covers what happens after `propose_record` returns: tracking
the proposal, shepherding it to a decision, and superseding correctly when
new knowledge replaces old.

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

## Shepherd checklist

A proposal that sits open past its usefulness is worse than one that was
never made — treat "propose and forget" as a failure mode, not a stopping
point.

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
  `tags`, `body`). Identity can't be touched, a no-op patch is refused, and
  the result is a normal PR to track like any other proposal. Never supersede
  to fix wording — it forks history for no reason.

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
