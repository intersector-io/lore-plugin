---
type: type
title: Premise
description: "A situational assumption a decision was built on."
tags: [team]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 0HSJE2WARKNFHB32AW4MQ48G9D
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections: []
  classification-test: "Qualifies as a Premise iff it states an assumption (\"traffic will stay under 100 rps\") a Decision or ADR depended on; a durable value with no expiry is a Principle instead."
---

## Overview

A situational assumption a decision was built on.

## Schema

Extra frontmatter fields for a `premise` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: premise
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

State the assumption and what depends on it.
```

## Worked Example

"Single canonical repo is sufficient through v1" — assumption behind ADR-0003; revisit if record volume or team count outgrows one repo.

## Reviewer Checklist

- [ ] States an assumption, not a fact
- [ ] Names what depends on it (via `constrains`/`relates`)

## Classification Test

Qualifies as a Premise iff it states an assumption ("traffic will stay under 100 rps") a Decision or ADR depended on; a durable value with no expiry is a Principle instead.
