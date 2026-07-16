---
name: retrieval
description: |
  Search Lore's canonical knowledge before designing anything, deciding anything, or
  writing a plan that touches org/product/team process, policy, or prior decisions. Use
  this whenever you are about to propose an approach, choose between alternatives, or
  claim something is "the standard" — search first, cite what you find, and don't
  invent constraints that already have an answer on record. Also use when a user asks
  "what does Lore say about X" or "has this been decided before".
---

# Retrieval

Lore holds the org's canonical decisions, ADRs, and process constraints as
git-backed records. Nothing you design should contradict a record you never
looked for. This skill is the discipline of checking first and citing what
you found — not a schema reference; every field and template detail is
fetched live from the tools themselves.

## Before you design or decide

Search before you write a plan, not after. If you catch yourself drafting an
approach and only then wondering whether it's been decided before, stop and
search — retrofitting citations onto a plan you already committed to defeats
the point.

1. Call `search_knowledge` with a query describing the decision or design
   space you're about to touch. Narrow with `type` (e.g. `adr`, `decision`,
   `internal-policy`) and `scope` (`org`, `product:<slug>`, `team:<slug>`)
   filters when you know them — an unscoped search over a large catalog
   returns noise.
2. Read the `description` and snippet of each hit before deciding whether to
   fetch it in full. Don't fetch everything indiscriminately; fetch what's
   actually relevant to the decision in front of you.
3. For a hit that matters, call `get_record` with its `ulid` to read the full
   body before you rely on it. A description alone is not enough to cite
   something as a constraint — read the record.
4. If a record looks relevant but incomplete on its own, call `get_related`
   on its `ulid` to walk `constrains` / `implements` / `supersedes` /
   `relates` links. A constraint is often layered: a policy that constrains
   an ADR that constrains your design. Don't stop at the first hit if the
   chain matters.
5. If nothing turns up, broaden the query or drop a filter before concluding
   "Lore has nothing on this" — a single narrow search that returns zero
   results is weak evidence of absence. Try at least one rephrase.

## include_drafts caution

`search_knowledge` defaults to canonical, active records only — the right
default for "what's actually decided." Only set `include_drafts=true` when
you specifically need to see in-flight proposals in your own scope (e.g.
checking whether someone already proposed the thing you're about to
propose). A draft is not yet reviewed or merged: never cite a draft record
as settled fact, and say explicitly in your output when a citation is to a
draft rather than canonical knowledge.

## Citing what you found

When your output relies on something Lore told you — a design constraint, a
prior decision, a policy — cite the record's ULID inline (e.g. "per
`01J...` (ADR: prefer X over Y)"), not just its title. Titles get renamed;
ULIDs don't. A claim that "this follows the org's decision on X" without a
ULID is not a citation, it's an assertion — someone reviewing your output
should be able to paste the ULID into `get_record` and verify you.

If you searched and found nothing relevant, say so plainly ("searched Lore
for X, no canonical record found") rather than staying silent — an explicit
absence is useful signal to whoever reviews your plan, and distinguishes
"I checked and there's nothing" from "I didn't check."

## Enumerating instead of searching

If the task is "list every ADR in this scope" or "audit everything of type
policy," reach for `list_records` instead of `search_knowledge` — it has no
relevance ranking but is deterministic and complete, with an optional
`group_by` summary. Use `search_knowledge` to answer a specific question;
use `list_records` to browse or audit a whole set.
