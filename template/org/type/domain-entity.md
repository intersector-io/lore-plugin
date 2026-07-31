---
type: type
title: "Domain Entity"
description: "The shape, identity, and invariants of a business object the system persists or exchanges."
tags: [product]
generated: { by: "human:renato@example.com", at: 2026-07-24T12:00:00Z }
x-lore:
  id: 7DMNENT1TYA0RQK3W5H8XZC4VP
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
    properties:
      attributes:
        type: array
        items:
          type: object
          properties:
            name:
              type: string
            kind:
              type: string
            description:
              type: string
          required: [name]
  required-sections:
    - Definition
  classification-test: "Qualifies as a Domain Entity iff its purpose is to fix the shape, identity, and invariants of a business object the system persists or exchanges — not the meaning of a word (Glossary Term), not a workflow (Process), not a system boundary (C4)."
---

## Overview

The shape, identity, and invariants of a business object the system persists or exchanges. Deliberately minimal (ADR-0017): `x-type` carries `attributes` only — entity-to-entity relationships are deferred until pilot review data justifies their schema.

## Schema

Extra frontmatter fields for a `domain-entity` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: domain-entity
title:
description:
tags: []
x-lore:
  id:
  status: active
  owners: []
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-type:
  attributes: []
---

## Definition

What this entity is, what identifies one instance, and the invariants the
system enforces on it (the rules that must always hold).
```

## Worked Example

"Order" — attributes: `[{ name: id, kind: ulid }, { name: status, kind: enum(pending|invoiced|settled), description: lifecycle state }, { name: total, kind: money }]`. Definition: one customer purchase; identified by `id`; invariants: total is never negative, a settled order is immutable, orders over 10k require manual approval.

## Reviewer Checklist

- [ ] Definition states identity (what makes two instances the same or different)
- [ ] Invariants are rules the system actually enforces, verifiable at the cited source
- [ ] Attributes carry domain meaning, not just a column dump

## Classification Test

Qualifies as a Domain Entity iff its purpose is to fix the shape, identity, and invariants of a business object the system persists or exchanges — not the meaning of a word (Glossary Term), not a workflow (Process), not a system boundary (C4).
