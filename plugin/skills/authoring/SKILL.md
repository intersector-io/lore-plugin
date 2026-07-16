---
name: authoring
description: |
  Author a new Lore record — a decision, ADR, policy, or any other canonical knowledge
  type — from scratch. Use when the user asks to write up a decision, document a policy,
  capture a process, or otherwise add new canonical knowledge to Lore, or when you
  yourself have made a decision worth recording. Walks whoami through create_record
  and validate_record to propose_record so the proposal passes review the first time.
---

# Authoring

Every new record goes through the same loop: find out what you may author and
where, fetch the type's template, fill it in, validate until clean, then
propose. Skip a step and you'll either submit something malformed or guess at
fields the tools would have told you correctly. This skill is that loop, not a
list of what fields exist — the schema, template, and checklist for any given
type only exist as of the current catalog, fetched live.

## The loop

1. **`whoami()`** — start here. You cannot author without a `type` and a
   `scope`, and this is the only tool that tells you what yours are:
   - `types` is the catalog of authorable types (slug + title + description).
     Pick the slug from here — a type that exists but has no records yet is
     invisible to `search_knowledge` and `list_records`, so it cannot be
     inferred from what you've read.
   - `scopes` is what you **hold** — the *only* scopes `propose_record`
     accepts.
   - `readableScopes` is what you can **read** (your scopes plus any granted
     to you). **Never propose into one of these that isn't also in `scopes`**
     — a grant confers read, never write, so that's a guaranteed 403 after
     you've done all the writing.
   - `canPropose: false` means stop: you can draft the record for the user,
     but you cannot open the PR yourself. Say so rather than failing at the
     last step.
2. **`create_record(type)`** — never skip it, even if you've authored this
   type before. It returns the type's authoring template (frontmatter + body
   placeholders), its JSON Schema if it has extra fields, the required body
   section headings, the reviewer checklist, and the classification test that
   distinguishes this type from its neighbors. Read the classification test
   before you write a word — if what you're about to document doesn't clearly
   pass it, you may have the wrong type (e.g. a one-off Decision dressed up as
   an ADR, or vice versa).
3. **Fill the template.** Write real content into every placeholder. Leave
   nothing generic — a reviewer checklist item you didn't actually satisfy
   is worse than an honest gap, because it looks satisfied at a glance.
4. **`validate_record(type, content, scope)`** — validate before you propose,
   every time, passing the `scope` you chose from `whoami`'s `scopes`: without
   it, placement and ULID-uniqueness checks are skipped and you'll get a
   warning explaining why, not a clean bill of health.
5. **Read the diagnostics and fix, don't guess.** Each diagnostic carries
   `{rule, severity, file, pointer, message}` — the `pointer` tells you
   exactly where in the content the problem is. Fix what it names, not what
   you assume it means; re-run `validate_record` after every fix. Loop until
   the errors list is empty. Warnings don't block proposing but read them —
   they're often about to become a reviewer's first comment.
6. **`propose_record(type, content, scope)`** — only once validation is
   clean. This is the same validation engine as CI, so a clean
   `validate_record` result means the proposal will validate clean once
   promoted too — but propose_record still re-validates and refuses to write
   anything on failure, so a last-second content edit after your final
   `validate_record` call isn't automatically safe. If you changed anything
   after the last clean validation, validate once more before proposing.

## Self-correction on diagnostics

Treat a validation error as the tool teaching you the schema, not as a
result to work around. Common categories:

- **Frontmatter shape / required fields** — the template already has the
  right keys; a diagnostic here usually means one got deleted or malformed
  while you were filling it in. Compare against the original
  `create_record` output.
- **Missing required body section** — add the heading, don't rename an
  existing section to fake it; the reviewer checklist expects real content
  under the real heading.
- **Secret lint** — a hard gate, not a suggestion. If it fires, the flagged
  text must come out of the content entirely (not just be reworded) before
  you can propose — drafts are indexed and team-visible before any human
  reviews them.
- **Placement / ULID-uniqueness** (only checked when `scope` is passed) —
  usually means the record collides with something that already exists;
  consider whether you're duplicating a record and should search first
  (retrieval skill) instead of authoring a new one.

If a diagnostic doesn't make sense after reading its `message` and
`pointer`, re-fetch `create_record` for the type — the template may have
details you missed, or the catalog may have changed since you last checked.

## Before authoring, consider whether you should be

A quick `search_knowledge` for the topic (retrieval skill) before you start
authoring is worth the thirty seconds — proposing a near-duplicate of an
existing active record wastes a reviewer's time when what you actually
wanted was to update or supersede it (promotion skill covers supersession).
