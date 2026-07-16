---
type: type
title: "C4 Component"
description: "A grouping of related functionality inside a container (a module or service class) — C4 level 4, structural."
tags: [product]
timestamp: 2026-07-15T12:00:00Z
x-lore:
  id: 01HTRJ8KG5ZJPFM9QARECQ8R9R
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
    required:
      - technology
      - container
    properties:
      technology:
        type: string
      container:
        type: string
  required-sections:
    - Responsibility
  classification-test: "Qualifies as a C4 Component iff it is a grouping of related functionality — a module, service class, or package — that lives inside exactly one C4 Container and is not separately deployable. If it is separately deployable, it is a C4 Container instead."
---

## Overview

A grouping of related functionality inside a container — a module, service
class, or package. Each component names exactly one parent `c4-container` via
`x-type.container` and its implementation via `x-type.technology`. The parent's
existence and level are enforced by the `c4/reference` validation rule.

## Schema

Extra frontmatter for a `c4-component` lives under `x-type` (see this record's
`x-lore-type.schema`): `technology` (required) and `container` (required — the
ULID of the parent `c4-container`).

## Template

```markdown
---
type: c4-component
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
  container:
---

## Responsibility

What this component is responsible for within its container.
```

## Worked Example

"Invoice Service" — technology: TypeScript module; container: the Billing API
`c4-container`. Responsibility: builds invoices from usage records and marks
them settled on a successful charge.

## Reviewer Checklist

- [ ] Names exactly one parent `c4-container` in `x-type.container`
- [ ] `x-type.technology` states the implementation
- [ ] Is not separately deployable (else it is a `c4-container`)

## Classification Test

Qualifies as a C4 Component iff it is a grouping of related functionality — a
module, service class, or package — that lives inside exactly one C4 Container
and is not separately deployable. If it is separately deployable, it is a C4
Container instead.
