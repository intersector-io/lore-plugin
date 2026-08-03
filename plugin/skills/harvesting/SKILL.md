---
name: harvesting
description: |
  Extract multiple records from an existing (brownfield) repository, wiki
  export, docs tree, or source code — seeding lore from prior art instead of
  a blank page. Use when the user asks to harvest, seed, or extract knowledge
  in bulk from something that predates lore — including "extract the domain
  entities from this codebase", "build a knowledge base from this monolith",
  or asking for a workflow / agent fan-out / splitter-aggregator over the
  repo to extract knowledge. Routes whole-repo extraction (docs AND code) to
  the lore-harvest CLI and walks the curated few-documents / few-files case
  through the dedup-then-batch loop, so candidates land on the rolling batch
  PR instead of flooding review with one-off proposals.
---

# Harvesting

Brownfield extraction comes in two sizes, and the first thing to do is decide
which one you're in — they have different right answers.

- **Bulk** — "seed the KB from this repo", "extract everything worth keeping
  from our docs tree", "extract the entities from this monolith". Dozens of
  candidates, nobody has named them individually.
- **Curated** — the user points at a handful of specific documents,
  decisions, or **source files** ("turn these four design docs into
  records", "document the entities in these two model files"). You can hold
  every candidate in view at once.

## Bulk: hand it to the harvester, don't do it inline

Whole-repo extraction is the harvester's job, not yours:

```sh
lore-harvest harvest <repo> --scope <scope> --canonical <knowledge-repo>
```

`--scope` stays explicit, but its value is not a guess when the repo
declares one: check the harvested repo for a `.lore/scope.yml` scope marker
(ADR-0023 — nearest to the harvested path wins) and pass that scope. If the
operator names a different scope than the marker, flag the mismatch and let
them decide — never silently pick either side. No marker means the operator
chooses, as before.

It runs a deterministic tier (ADR folders, OpenAPI specs, README structure)
and a heuristic tier (docs trees, commit-message decision mining) before
any LLM pass, and a **code tier**
(docs/issues/0060): a deterministic code-map clusters entity-bearing and
integration-bearing source files, gates every file for secrets/PII *before*
anything reaches an LLM, and extracts `domain-entity`, consumed
`integration-contract`, and enum `glossary-term` candidates per cluster with
real file provenance. It screens every candidate against the index, keeps
re-runs idempotent so the same candidate is never proposed twice (content-hash
keys — a moved HEAD re-mints nothing), and lands everything as drafts on the
scope's rolling batch PR for human review. Useful seed-mode knobs:
`--llm-budget` (counts dedup verdicts too), `--max-candidates-per-type`,
`--batch-size`, `--paths`.

Reading an entire repository into your own context and extracting inline —
or improvising your own splitter/fan-out of subagents over the codebase —
reproduces none of that: no pre-LLM secret gate, no idempotency across runs,
no dedup against existing canon, no reviewable provenance. Don't do it, even
when the user phrases it as "create a workflow to extract the knowledge
base". If `lore-harvest` isn't installed where you're running, say so plainly
and tell the user to ask their lore operator to run the seed (it ships with
the server deployment, not with this plugin); offer the curated path below
for anything they need captured right now.

## Curated: the dedup-then-batch loop

For a handful of user-named documents **or source files**, extract them
yourself — running the **same loop the librarian subagent runs for session
capture** (read `agents/librarian.md` in this plugin; only the source differs
— candidates come from the documents or code the user named, not a queued
transcript). In brief:
the target scope comes from the scope marker nearest the named files
(ADR-0023; you are in the tree, so read it yourself — no queue entry exists
on this path), else from `whoami` + the user;
`whoami()` once for the whole run; type each candidate via
`create_record(type)` and its classification test; dedup each via
`search_knowledge` with `include_drafts: true` to the four-verdict screen
(duplicate / conflicts-with / enriches / distinct); `validate_record` until
clean; and `propose_record` **with `batch:` set wherever the scope allows
one** — N one-off proposals from one extraction session is precisely the
reviewer flood the rolling batch exists to prevent. `org` is the exception:
the server refuses `batch: "org"`, so org-scope candidates go without it.
The librarian file is the authority on
each verdict's action and the guardrails (never invent a ULID, secret lint
is a hard gate); don't improvise a variant here.

Brownfield deltas on top of that loop:

- **Canon-shaped screen — flag, never silently skip:** these are documents
  the user named, so a canon-shape doubt alone never drops one. Execution
  state (task lists, sprint plans, milestones, open questions) usually
  isn't canon: say so to the user, and if you propose it anyway (it passes
  a classification test, or the user insists), declare the doubt in the
  candidate's body so the reviewer decides — the same
  surface-don't-suppress pattern as a `conflicts-with` verdict. Only a
  candidate that passes no classification test is discarded, and either
  way it appears in your final accounting. Never re-type execution state
  as a durable type to get it through.
- **Provenance per candidate:** note where it came from (file path, wiki
  page, commit) in the record body — brownfield records without provenance
  are unreviewable.
- **Code sources:** for user-named model/schema/client files, extract what
  the code *enforces* — a `domain-entity`'s identity, attributes, and
  invariants (validators, guards, constraints); an `integration-contract`
  for what the code consumes (state "Direction: consumed" and the
  counterpart); enum/status vocabulary as `glossary-term`. Read the files
  the user named plus their directly-adjacent validators — never crawl
  outward. If a named file contains anything secret-shaped, stop and say so
  instead of extracting around it; a draft is indexed and team-visible.
  When the same file yields an entity and a term with the same name, keep
  the entity.
- **Old docs usually enrich, not coexist:** an `enriches` verdict against a
  record the old doc predates means supersession — confirm the match is
  `active`, then propose with `supersedes`.
- **Account for every candidate at the end:** proposed (with the PR ref),
  dropped as duplicate (with the matched ULID), or discarded pre-dedup
  (failed every classification test). Silence about a candidate you noticed
  is not an outcome.
