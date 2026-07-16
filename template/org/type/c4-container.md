---
type: type
title: "C4 Container"
description: "A separately deployable or runnable unit inside a system (an app, service, or datastore) — C4 level 3."
tags: [product]
timestamp: 2026-07-15T12:00:00Z
x-lore:
  id: 01PBGVDCBJP62DCYJWDP0CJFSW
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
    required:
      - technology
      - system
    properties:
      technology:
        type: string
      system:
        type: string
  required-sections:
    - Responsibility
  classification-test: "Qualifies as a C4 Container iff it is a separately deployable or runnable unit — a web app, API service, database, queue, or SPA — that lives inside exactly one C4 System. If it is a code-level grouping within a single deployable, it is a C4 Component instead; if it is independently owned and deployed as a whole product, it is a C4 System."
---

## Overview

A separately deployable or runnable unit inside a system — an application,
service, or datastore. Each container names exactly one parent `c4-system` via
`x-type.system` and its runtime via `x-type.technology`. The parent's existence
and level are enforced by the `c4/reference` validation rule.

## Schema

Extra frontmatter for a `c4-container` lives under `x-type` (see this record's
`x-lore-type.schema`): `technology` (required) and `system` (required — the ULID
of the parent `c4-system`).

## Template

```markdown
---
type: c4-container
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
x-type:
  technology:
  system:
---

## Responsibility

What this container is responsible for, and why it is a separate deployable.
```

## Worked Example

"Billing API" — technology: Node.js / Hono; system: the Billing `c4-system`.
Responsibility: exposes invoicing endpoints and orchestrates charges against the
payment provider.

## Reviewer Checklist

- [ ] Names exactly one parent `c4-system` in `x-type.system`
- [ ] `x-type.technology` states the runtime/stack
- [ ] Is genuinely separately deployable (else it is a `c4-component`)

## Classification Test

Qualifies as a C4 Container iff it is a separately deployable or runnable unit —
a web app, API service, database, queue, or SPA — that lives inside exactly one
C4 System. If it is a code-level grouping within a single deployable, it is a C4
Component instead; if it is independently owned and deployed as a whole product,
it is a C4 System.
