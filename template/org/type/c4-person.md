---
type: type
title: "C4 Person"
description: "A human actor (role or persona) that uses a system — a C4 model actor."
tags: [product]
timestamp: 2026-07-15T12:00:00Z
x-lore:
  id: 019F4BHYXKR9PM0A0XA2PPBJ8T
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Role
  classification-test: "Qualifies as a C4 Person iff it is a human role or persona that interacts with a software system from outside it. A software actor your team does not own is a C4 External System; a system your team owns is a C4 System."
---

## Overview

A human actor — a role or persona — that uses one or more systems from the
outside. The top-left boxes of a C4 System Context diagram. A person has no
`x-type` fields; interactions with systems are authored as `c4-relationship`
records.

## Schema

A `c4-person` record has no extra `x-type` fields. Its interactions with systems
and containers are separate `c4-relationship` records naming the person as
`source`.

## Template

```markdown
---
type: c4-person
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

## Role

Who this person is and what they are trying to accomplish with the system.
```

## Worked Example

"Finance Analyst" — Role: reconciles invoices and monitors charge failures;
uses the Billing system's reporting surface daily.

## Reviewer Checklist

- [ ] Is a human role/persona, not a software actor
- [ ] Role section states what they use the system to do

## Classification Test

Qualifies as a C4 Person iff it is a human role or persona that interacts with a
software system from outside it. A software actor your team does not own is a C4
External System; a system your team owns is a C4 System.
