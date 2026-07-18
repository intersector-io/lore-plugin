---
name: harvesting
description: |
  Extract multiple records from an existing (brownfield) repository, wiki
  export, or docs tree — seeding lore from prior art instead of a blank page.
  Use when the user asks to harvest, seed, or extract knowledge in bulk from
  something that predates lore. Routes whole-repo extraction to the
  lore-harvest CLI and walks the curated few-documents case through the
  dedup-then-batch loop, so candidates land on the rolling batch PR instead
  of flooding review with one-off proposals.
---

# Harvesting

Brownfield extraction comes in two sizes, and the first thing to do is decide
which one you're in — they have different right answers.

- **Bulk** — "seed the KB from this repo", "extract everything worth keeping
  from our docs tree". Dozens of candidates, nobody has named them
  individually.
- **Curated** — the user points at a handful of specific documents or
  decisions ("turn these four design docs into records"). You can hold every
  candidate in view at once.

## Bulk: hand it to the harvester, don't do it inline

Whole-repo extraction is the harvester's job, not yours:

```sh
lore-harvest harvest <repo> --scope <scope> --canonical <knowledge-repo>
```

It runs a deterministic tier (ADR folders, OpenAPI specs, README structure,
CODEOWNERS, docs trees, git log) before any LLM pass, screens every candidate
against the index, keeps re-runs idempotent so the same candidate is never
proposed twice, and lands everything as drafts on the scope's rolling batch
PR for human review.

Reading an entire repository into your own context and extracting inline
reproduces none of that — no deterministic tier, no idempotency across runs —
and produces a worse result at higher cost. Don't do it. If `lore-harvest`
isn't installed where you're running, say so plainly and tell the user to ask
their lore operator to run the seed (it ships with the server deployment, not
with this plugin); offer the curated path below for anything they need
captured right now.

## Curated: the dedup-then-batch loop

For a handful of user-named documents, extract them yourself — running the
**same loop the librarian subagent runs for session capture** (read
`agents/librarian.md` in this plugin; only the source differs — candidates
come from the documents the user named, not a queued transcript). In brief:
`whoami()` once for the whole run; type each candidate via
`create_record(type)` and its classification test; dedup each via
`search_knowledge` with `include_drafts: true` to the four-verdict screen
(duplicate / conflicts-with / enriches / distinct); `validate_record` until
clean; and `propose_record` **always with `batch:` set** — N one-off
proposal PRs from one extraction session is precisely the reviewer flood
the rolling batch exists to prevent. The librarian file is the authority on
each verdict's action and the guardrails (never invent a ULID, secret lint
is a hard gate); don't improvise a variant here.

Brownfield deltas on top of that loop:

- **Provenance per candidate:** note where it came from (file path, wiki
  page, commit) in the record body — brownfield records without provenance
  are unreviewable.
- **Old docs usually enrich, not coexist:** an `enriches` verdict against a
  record the old doc predates means supersession — confirm the match is
  `active`, then propose with `supersedes`.
- **Account for every candidate at the end:** proposed (with the PR ref),
  dropped as duplicate (with the matched ULID), or discarded pre-dedup
  (failed every classification test). Silence about a candidate you noticed
  is not an outcome.
