---
type: type
title: "Integration Contract"
description: "A cross-product touchpoint: the unit of cross-product retrieval."
tags: [product]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 6KYJH7555VM1RBYN9PEGHBQ8H2
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Interface
  classification-test: "Qualifies as an Integration Contract iff two or more products/teams depend on the interface it describes; a single-product internal interface is not one."
---

## Overview

A cross-product touchpoint: the unit of cross-product retrieval.

## Schema

Extra frontmatter fields for a `integration-contract` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: integration-contract
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

## Interface

The shape of the touchpoint (API, event, file format) and both sides' obligations.
```

## Worked Example

"Stripe Webhook Contract" — Interface: Stripe POSTs `payment_intent.succeeded` events to `/webhooks/stripe`; billing service must ack within 5s and is idempotent on `event.id`.

## Reviewer Checklist

- [ ] Names both sides of the touchpoint explicitly
- [ ] Interface section is precise enough to implement against

## Classification Test

Qualifies as an Integration Contract iff two or more products/teams depend on the interface it describes; a single-product internal interface is not one.
