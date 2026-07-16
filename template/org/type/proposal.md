---
type: type
title: Proposal
description: "An OpenSpec-style change proposal — why one bounded change should happen and what changes, retired in the PR that archives the change."
tags: [change]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 3RB1C2D3E4F5G6H7J8K9M0N1P2
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Why
    - What Changes
  classification-test: "Qualifies as a proposal iff it argues one bounded change with a why and a what. A durable behavioural contract is a spec instead."
---

## Overview

An OpenSpec-style change proposal — why one bounded change should happen and what changes. A proposal flips to `status: retired` in the same PR that lands the final spec state when the change is archived.

## Schema

Extra frontmatter fields for a `proposal` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: proposal
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

## Why

Why this change should happen now.

## What Changes

The bounded set of things that change.

> Convention: a proposal MUST carry an `implements` link to its prd (or a parent proposal).
> Lifecycle: flip `status` to `retired` in the same PR that lands the final spec state when the change is archived.
```

## Worked Example

"One-page checkout" — Why: the four-step flow drives abandonment; What Changes: collapse address, shipping, and payment into a single page. Implements the checkout-redesign prd; retired once the spec landed.

## Reviewer Checklist

- [ ] Why and What Changes both present and non-trivial
- [ ] Carries an `implements` link to its prd (or a parent proposal)
- [ ] One bounded change, not a durable behavioural contract (that is a spec)
- [ ] Retired in the same PR that lands the final spec state when the change is archived

## Classification Test

Qualifies as a proposal iff it argues one bounded change with a why and a what. A durable behavioural contract is a spec instead.
