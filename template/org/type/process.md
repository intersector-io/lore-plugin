---
type: type
title: Process
description: "How work flows: steps, actors, systems, and the capability it implements."
tags: [product]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 5JMXCHN75SJW68ECTZRE58NJQZ
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
    properties:
      actors:
        type: array
        items:
          type: string
  required-sections:
    - Steps
  classification-test: "Qualifies as a Process iff it describes an ordered sequence of steps across actors/systems; a single-step or purely conceptual description belongs in Business Capability instead."
---

## Overview

How work flows: steps, actors, systems, and the capability it implements.

## Schema

Extra frontmatter fields for a `process` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: process
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
  actors: []
---

## Steps

1. ...
2. ...
```

## Worked Example

"Refund Request Handling" — actors: [support-agent, billing-system]. Steps: agent opens refund in admin tool -> billing-system reverses charge -> customer notified.

## Reviewer Checklist

- [ ] Steps are ordered and actor-attributed
- [ ] Links to the Business Capability it implements

## Classification Test

Qualifies as a Process iff it describes an ordered sequence of steps across actors/systems; a single-step or purely conceptual description belongs in Business Capability instead.
