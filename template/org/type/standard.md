---
type: type
title: Standard
description: "A coding or technology standard with an enforcement level."
tags: [architecture]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 7YECDF1YRX7SKTNB5HJD84D86P
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
    required:
      - enforcement
    properties:
      enforcement:
        type: string
        enum:
          - mandatory
          - recommended
  required-sections: []
  classification-test: "Qualifies as a Standard iff it prescribes a technical convention (naming, formatting, tech choice) with an enforcement level; a one-off architectural choice is an ADR instead."
---

## Overview

A coding or technology standard with an enforcement level.

## Schema

Extra frontmatter fields for a `standard` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: standard
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
  enforcement: mandatory
---

State the convention and give a compliant/non-compliant example.
```

## Worked Example

`x-type: { enforcement: mandatory }` — "All TypeScript packages use ESM (`type: module`), never CommonJS."

## Reviewer Checklist

- [ ] enforcement level is explicit
- [ ] A compliant and non-compliant example are both given

## Classification Test

Qualifies as a Standard iff it prescribes a technical convention (naming, formatting, tech choice) with an enforcement level; a one-off architectural choice is an ADR instead.
