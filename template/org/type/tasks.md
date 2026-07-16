---
type: type
title: Tasks
description: "An ordered work breakdown for one change, retired in the PR that archives the change."
tags: [change]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 3TD3E5F7G9H1J2K4M6N8P0Q2R4
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections: []
  classification-test: "Qualifies as tasks iff it is a checklist of work items for one change. It is retired when the change is archived, never kept as durable knowledge."
---

## Overview

An ordered work breakdown for one change. A tasks record flips to `status: retired` in the same PR that lands the final spec state when the change is archived.

## Schema

Extra frontmatter fields for a `tasks` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: tasks
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

- [ ] First work item
- [ ] Second work item

> Convention: a tasks record carries an `implements` link to its design or proposal.
> Lifecycle: flip `status` to `retired` in the same PR that lands the final spec state when the change is archived.
```

## Worked Example

"One-page checkout tasks" — build the combined form, wire inline validation, migrate the payment step, run the A/B rollout. Implements the one-page-checkout design; retired when the change was archived.

## Reviewer Checklist

- [ ] A short ordered checklist of work items, nothing more
- [ ] Carries an `implements` link to its design or proposal
- [ ] Retired in the same PR that lands the final spec state when the change is archived

## Classification Test

Qualifies as tasks iff it is a checklist of work items for one change. It is retired when the change is archived, never kept as durable knowledge.
