---
type: type
title: Spec
description: "A durable behavioural contract that outlives the change which introduced it, kept active until superseded."
tags: [behaviour]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 3VE4F6G8H0J2K4M6N8P0Q2R4S6
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Behaviour
  classification-test: "Qualifies as a spec iff it describes lasting system behaviour that outlives any single change. If it describes one change's intent it is a proposal instead."
---

## Overview

A durable behavioural contract that outlives the change which introduced it. A spec stays `active` until superseded; the proposal, design, and tasks that produced it are retired when the change is archived, but the spec remains.

## Schema

Extra frontmatter fields for a `spec` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: spec
title:
description:
tags: []
timestamp:
x-lore:
  id:
  status: active
  owners: []
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
---

## Behaviour

The lasting system behaviour this contract guarantees.

> Convention: a spec carries an `implements` link to the proposal that introduced or last amended it.
> Lifecycle: a spec stays `active` until superseded; it survives the archival that retires its proposal, design, and tasks.
```

## Worked Example

"One-page checkout spec" — Behaviour: checkout completes on a single page, inline validation blocks submit on invalid address, payment is tokenized client-side. Implements the one-page-checkout proposal and remained active after the change was archived.

## Reviewer Checklist

- [ ] Behaviour present and stated as a testable contract
- [ ] Carries an `implements` link to the proposal that introduced or last amended it
- [ ] Describes lasting behaviour, not one change's intent (that is a proposal)
- [ ] Stays `active` until superseded

## Classification Test

Qualifies as a spec iff it describes lasting system behaviour that outlives any single change. If it describes one change's intent it is a proposal instead.
