---
type: type
title: Decision
description: "A lighter-weight decision record than an ADR, for team/session-scale choices."
tags: [team]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 4T3G1MDYKJVWRWAAZJYPS7QX57
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections: []
  classification-test: "Qualifies as a Decision (not an ADR) iff it is easily reversed, affects one team, and sets no cross-team precedent. If reviewers find themselves writing \"Context/Decision/Consequences\" at ADR length, it should be an ADR instead."
---

## Overview

A lighter-weight decision record than an ADR, for team/session-scale choices.

## Schema

Extra frontmatter fields for a `decision` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: decision
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

What was decided and the one-line reason why.
```

## Worked Example

"Use vitest, not jest, for this package" — faster startup, already used elsewhere in the monorepo.

## Reviewer Checklist

- [ ] Short: one decision, one reason
- [ ] Not a disguised ADR (see classification test)

## Classification Test

Qualifies as a Decision (not an ADR) iff it is easily reversed, affects one team, and sets no cross-team precedent. If reviewers find themselves writing "Context/Decision/Consequences" at ADR length, it should be an ADR instead.
