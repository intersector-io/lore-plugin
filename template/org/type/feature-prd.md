---
type: type
title: "Feature / PRD"
description: "What was built and why, for a single feature."
tags: [product]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 05T4M3WRK5TQTG109GK6VBXYZX
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections: []
  classification-test: "Qualifies as a Feature/PRD iff it documents a shipped or planned feature's what-and-why; an architectural choice within that feature belongs in an ADR instead."
---

## Overview

What was built and why, for a single feature.

## Schema

Extra frontmatter fields for a `feature-prd` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: feature-prd
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

What was built, why, and for whom.
```

## Worked Example

"Self-serve refunds" — lets customers request refunds without contacting support; built to cut support-ticket volume.

## Reviewer Checklist

- [ ] States what was built and why, not just a task list
- [ ] Links to the Product and Business Capability it serves

## Classification Test

Qualifies as a Feature/PRD iff it documents a shipped or planned feature's what-and-why; an architectural choice within that feature belongs in an ADR instead.
