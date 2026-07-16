---
type: type
title: "Business Capability"
description: "What the business can do, independent of how it is currently implemented."
tags: [product]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 2XGFVTMQ9Y4WA4DR59S1KARY0N
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections: []
  classification-test: "Qualifies as a Business Capability iff it names something the business can do (\"issue refunds\") in implementation-independent terms; a description of a specific workflow or system belongs in a Process or Integration Contract instead."
---

## Overview

What the business can do, independent of how it is currently implemented.

## Schema

Extra frontmatter fields for a `business-capability` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: business-capability
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

Describe the capability in implementation-independent terms.
```

## Worked Example

"Issue Refunds" — the business can reverse a completed payment to a customer, regardless of which system currently implements it.

## Reviewer Checklist

- [ ] Implementation-independent framing
- [ ] Distinct from any single Process that currently implements it

## Classification Test

Qualifies as a Business Capability iff it names something the business can do ("issue refunds") in implementation-independent terms; a description of a specific workflow or system belongs in a Process or Integration Contract instead.
