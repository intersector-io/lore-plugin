---
type: type
title: "C4 System"
description: "A software system you own — the highest-level box in a C4 model, containing one or more containers."
tags: [product]
timestamp: 2026-07-15T12:00:00Z
x-lore:
  id: 019PMAACMXDT6Q0XZCRPFC0P31
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Purpose
  classification-test: "Qualifies as a C4 System iff it is a software system your organization owns and deploys as a whole, delivering value to its users, and it contains one or more C4 Containers. A third-party dependency is a C4 External System; a separately deployable piece inside a system is a C4 Container."
---

## Overview

A software system your organization owns and deploys as a whole — the largest
box in a C4 model and the root of an architecture view. A system contains one or
more `c4-container` records (each naming this system in `x-type.system`). A
system has no `x-type` fields of its own.

## Schema

A `c4-system` record has no extra `x-type` fields. Its containers point *up* at
it via their `x-type.system`; the viewer roots a diagram at a system.

## Template

```markdown
---
type: c4-system
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

## Purpose

What this system does for its users and why it exists as a unit of ownership.
```

## Worked Example

"Billing" — Purpose: issues invoices, orchestrates charges against the payment
provider, and reports on revenue; owned and deployed by the Acme platform team.

## Reviewer Checklist

- [ ] Is owned and deployed by your organization as a whole
- [ ] Contains (or will contain) one or more `c4-container` records
- [ ] Purpose section states the value it delivers

## Classification Test

Qualifies as a C4 System iff it is a software system your organization owns and
deploys as a whole, delivering value to its users, and it contains one or more
C4 Containers. A third-party dependency is a C4 External System; a separately
deployable piece inside a system is a C4 Container.
