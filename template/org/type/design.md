---
type: type
title: Design
description: "Technical decisions for one in-flight change, retired in the PR that archives the change."
tags: [change]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 3SC2D4E6F8G0H1J3K5M7N9P1Q3
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Decisions
  classification-test: "Qualifies as a design iff it records how a single in-flight change will be built. Durable architecture choices graduate to an adr instead."
---

## Overview

Technical decisions for one in-flight change. A design flips to `status: retired` in the same PR that lands the final spec state when the change is archived.

## Schema

Extra frontmatter fields for a `design` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: design
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

## Decisions

The technical decisions for this change and the reasons behind them.

> Convention: a design carries a `relates` link to its proposal.
> Lifecycle: flip `status` to `retired` in the same PR that lands the final spec state when the change is archived.
```

## Worked Example

"One-page checkout design" — Decisions: render the page client-side over the existing cart API, validate address inline, tokenize payment before submit. Relates to the one-page-checkout proposal; retired when the change was archived.

## Reviewer Checklist

- [ ] Decisions present, each with a reason
- [ ] Carries a `relates` link to its proposal
- [ ] Scoped to one in-flight change; durable architecture choices graduate to an adr
- [ ] Retired in the same PR that lands the final spec state when the change is archived

## Classification Test

Qualifies as a design iff it records how a single in-flight change will be built. Durable architecture choices graduate to an adr instead.
