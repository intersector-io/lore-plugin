---
type: type
title: Product
description: "Anchor record for a product: ownership and links to its capabilities, processes, and features."
tags: [product]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 4P3X06CG79K87CQ421KF5F9XNW
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections: []
  classification-test: "Exactly one Product record exists per product directory (`/products/<slug>/`); it is the anchor other records in that product tier link to via `implements`/`relates`, not a description of a single feature."
---

## Overview

Anchor record for a product: ownership and links to its capabilities, processes, and features.

## Schema

Extra frontmatter fields for a `product` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: product
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

Ownership, purpose, and links to the product's capabilities, processes, and features.
```

## Worked Example

"Acme Billing" — owned by the billing pod; relates to the Invoicing capability and the Stripe Integration Contract.

## Reviewer Checklist

- [ ] One Product record per product directory
- [ ] owners reflect the actual owning team

## Classification Test

Exactly one Product record exists per product directory (`/products/<slug>/`); it is the anchor other records in that product tier link to via `implements`/`relates`, not a description of a single feature.
