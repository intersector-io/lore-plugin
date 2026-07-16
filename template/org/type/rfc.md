---
type: type
title: RFC
description: "A proposal in flight that may graduate into an ADR."
tags: [architecture]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 4865EMQ0YQ07GGZHE83RAZZDPF
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Proposal
  classification-test: "Qualifies as an RFC iff it is not yet decided — it is soliciting input. Once accepted it should graduate into an ADR (via `implements` or `supersedes`), not be re-labeled in place."
---

## Overview

A proposal in flight that may graduate into an ADR.

## Schema

Extra frontmatter fields for a `rfc` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: rfc
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

## Proposal

What is being proposed and open questions.
```

## Worked Example

"Adopt GitLab as a second git provider" — Proposal: abstract the provider interface further; open question: webhook parity gaps.

## Reviewer Checklist

- [ ] Genuinely undecided, not a decision in disguise
- [ ] Open questions are explicit

## Classification Test

Qualifies as an RFC iff it is not yet decided — it is soliciting input. Once accepted it should graduate into an ADR (via `implements` or `supersedes`), not be re-labeled in place.
