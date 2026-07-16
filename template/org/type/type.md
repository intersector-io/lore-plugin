---
type: type
title: Type
description: "Defines a record type: schema, template, worked example, checklist, and classification test."
tags: [org]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 18047AR9KHHQM6BXA523A8DXF8
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections: []
  classification-test: "This record documents the meta-schema descriptively. It is never authoritative — the engine validates every Type Record against the meta-schema compiled into `@lore/core`, not against this content (ADR-0002)."
---

## Overview

Defines a record type: schema, template, worked example, checklist, and classification test.

## Schema

Extra frontmatter fields for a `type` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: type
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
x-lore-type:
  schema: { type: object }
  required-sections: []
  classification-test: >
    Criteria for "does this content qualify as this type?"
---

## Overview
## Schema
## Template
## Worked Example
## Reviewer Checklist
## Classification Test
```

## Worked Example

See `org/type/decision.md` in this same directory for a fully worked Type Record.

## Reviewer Checklist

- [ ] x-lore-type.schema is valid JSON Schema (subset: type/required/properties/enum/items/format:date)
- [ ] x-lore-type.required-sections lists every H2 heading records of the new type must carry
- [ ] x-lore-type.classification-test gives a citable yes/no criterion
- [ ] Template, Worked Example, and Reviewer Checklist sections are all present

## Classification Test

This record documents the meta-schema descriptively. It is never authoritative — the engine validates every Type Record against the meta-schema compiled into `@lore/core`, not against this content (ADR-0002).
