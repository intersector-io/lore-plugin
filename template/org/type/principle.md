---
type: type
title: Principle
description: "A durable premise that biases decisions, without itself being a compliance rule."
tags: [org]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 373528M55VTS4HTDYMNKGY6WV7
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections: []
  classification-test: "Qualifies as a Principle iff it is a durable value or bias (\"prefer boring technology\") rather than a specific rule with an enforcement level (Internal Policy) or a one-off situational conclusion (Decision/Premise)."
---

## Overview

A durable premise that biases decisions, without itself being a compliance rule.

## Schema

Extra frontmatter fields for a `principle` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: principle
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

State the principle and the reasoning behind it in prose.
```

## Worked Example

"Prefer boring technology" — durable bias toward operationally proven tools over novel ones, applied whenever a stack choice is otherwise a toss-up.

## Reviewer Checklist

- [ ] Durable, not situational
- [ ] No specific enforceable rule buried inside (that belongs in a Policy or Standard)

## Classification Test

Qualifies as a Principle iff it is a durable value or bias ("prefer boring technology") rather than a specific rule with an enforcement level (Internal Policy) or a one-off situational conclusion (Decision/Premise).
