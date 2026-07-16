---
type: type
title: "PRD (Product Requirements Document)"
description: "Product requirements — the intent and success criteria for a product change, stated before any solution shape, kept active until superseded."
tags: [product]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 3QAZ7K2M4N6P8R1S3T5V7W9X0A
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Intent
    - Success Criteria
  classification-test: "Qualifies as a prd iff it states the outcome and success criteria for a product change without prescribing implementation. If it prescribes technical shape it is a design instead."
---

## Overview

Product requirements — the intent and success criteria for a product change, stated before any solution shape. A prd stays `active` until superseded by a newer prd; it is not retired when the change it motivated is archived.

## Schema

Extra frontmatter fields for a `prd` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: prd
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

## Intent

The outcome we want and why — no solution shape.

## Success Criteria

How we will know the change worked.

> Lifecycle: a prd stays `active` until superseded; downstream proposals carry `implements` back to it.
```

## Worked Example

"Checkout redesign v2" — Intent: cut checkout abandonment for first-time buyers; Success Criteria: abandonment below 40% and median time-to-purchase under 90 seconds. Solution shape deliberately left open.

## Reviewer Checklist

- [ ] Intent and Success Criteria both present and non-trivial
- [ ] No implementation prescription — outcomes only, per the classification test
- [ ] Downstream proposals carry `implements` back to this prd

## Classification Test

Qualifies as a prd iff it states the outcome and success criteria for a product change without prescribing implementation. If it prescribes technical shape it is a design instead.
