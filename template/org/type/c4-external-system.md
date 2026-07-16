---
type: type
title: "C4 External System"
description: "A software system outside your ownership boundary that a system depends on — a C4 model external actor."
tags: [product]
timestamp: 2026-07-15T12:00:00Z
x-lore:
  id: 01N7Y0NYM8T3M1091JDDGXXQNF
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Boundary
  classification-test: "Qualifies as a C4 External System iff it is a software system your team does not own or deploy — a third-party API, a partner platform, another team's product — that your systems interact with. A software system your team owns is a C4 System; a human actor is a C4 Person."
---

## Overview

A software system outside your ownership boundary — a third-party API, a partner
platform, another team's product — that your systems depend on or integrate
with. Drawn as a shaded box at the edge of a C4 System Context diagram. It has no
`x-type` fields; interactions are `c4-relationship` records.

## Schema

A `c4-external-system` record has no extra `x-type` fields. Interactions with it
are separate `c4-relationship` records naming it as `source` or `target`.

## Template

```markdown
---
type: c4-external-system
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

## Boundary

Who owns this system, why it is outside your boundary, and what your systems
rely on it for.
```

## Worked Example

"Stripe" — Boundary: third-party payments platform owned by Stripe; the Billing
system charges customer cards through its API and consumes its webhooks.

## Reviewer Checklist

- [ ] Is genuinely outside your team's ownership/deploy boundary
- [ ] Boundary section names the owner and the dependency

## Classification Test

Qualifies as a C4 External System iff it is a software system your team does not
own or deploy — a third-party API, a partner platform, another team's product —
that your systems interact with. A software system your team owns is a C4 System;
a human actor is a C4 Person.
