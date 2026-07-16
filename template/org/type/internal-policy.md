---
type: type
title: "Internal Policy"
description: "A company-set rule binding on internal teams, with an enforcement level and review cycle."
tags: [org]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 444G07RHZ5XHPH3A9DEA8WHR6G
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
      effective-date:
        type: string
        format: date
      review-cycle:
        type: string
  required-sections:
    - Policy
    - Rationale
  classification-test: "Qualifies as an Internal Policy iff: (1) the company itself is the source of authority (not an external regulator — see External Policy), and (2) it states a rule teams must follow, not just a preference (see Principle for durable premises with no compliance expectation)."
---

## Overview

A company-set rule binding on internal teams, with an enforcement level and review cycle.

## Schema

Extra frontmatter fields for a `internal-policy` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: internal-policy
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
  effective-date: 2026-01-01
  review-cycle: annual
---

## Policy

State the rule plainly.

## Rationale

Why this rule exists.
```

## Worked Example

`x-type: { enforcement: mandatory, effective-date: "2026-01-01", review-cycle: annual }` — "All production secrets must be stored in the company secret manager, never in git." Policy section states the rule; Rationale explains the incident history that motivated it.

## Reviewer Checklist

- [ ] enforcement is mandatory or recommended, not implied by tone
- [ ] effective-date and review-cycle are set so the policy does not go stale silently
- [ ] Policy section is a plain rule; Rationale section explains why, not what

## Classification Test

Qualifies as an Internal Policy iff: (1) the company itself is the source of authority (not an external regulator — see External Policy), and (2) it states a rule teams must follow, not just a preference (see Principle for durable premises with no compliance expectation).
