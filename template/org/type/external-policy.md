---
type: type
title: "External Policy / Regulation"
description: "A regulation or external authority requirement, separating citation from interpretation."
tags: [org]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 6FZACHRE4SWV89EFPNHZRRJK9M
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
    required:
      - source-authority
      - jurisdiction
      - official-reference
    properties:
      source-authority:
        type: string
      jurisdiction:
        type: string
      official-reference:
        type: string
      effective-date:
        type: string
        format: date
      sunset-date:
        type: string
        format: date
  required-sections:
    - Citation
    - Interpretation
  classification-test: "Qualifies as an External Policy iff the source of authority is outside the company (a regulator, law, or standards body) and the record separates the regulator's own words (Citation) from the company's reading of them (Interpretation). A rule the company invented itself is an Internal Policy instead."
---

## Overview

A regulation or external authority requirement, separating citation from interpretation.

## Schema

Extra frontmatter fields for a `external-policy` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: external-policy
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
  source-authority:
  jurisdiction:
  official-reference:
  effective-date:
---

## Citation

Verbatim or closely paraphrased text of what the regulation says, with a pinpoint reference.

## Interpretation

The company's reading of what this requires of us in practice.
```

## Worked Example

`x-type: { source-authority: "ANPD", jurisdiction: "BR", official-reference: "LGPD Art. 46", effective-date: "2020-09-18" }` — Citation quotes Art. 46's data-security requirement; Interpretation states which internal controls satisfy it.

## Reviewer Checklist

- [ ] source-authority, jurisdiction, and official-reference are all filled in and verifiable
- [ ] Citation and Interpretation are genuinely separate — no interpretation bleeding into the citation
- [ ] sunset-date is set if the regulation has a known expiry

## Classification Test

Qualifies as an External Policy iff the source of authority is outside the company (a regulator, law, or standards body) and the record separates the regulator's own words (Citation) from the company's reading of them (Interpretation). A rule the company invented itself is an Internal Policy instead.
