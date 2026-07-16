---
type: type
title: Learning
description: "Something the team learned, worth remembering for next time."
tags: [team]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 4E3DX930YSCMBC54SJ6NCGEQC5
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections: []
  classification-test: "Qualifies as a Learning iff it captures a lesson from experience (\"X broke because Y\"); a forward-looking rule belongs in a Policy or Standard instead."
---

## Overview

Something the team learned, worth remembering for next time.

## Schema

Extra frontmatter fields for a `learning` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: learning
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

What happened, and what we'd do differently.
```

## Worked Example

"Postgres connection pool exhaustion under bursty webhook traffic" — root cause and the pool-sizing fix that resolved it.

## Reviewer Checklist

- [ ] Grounded in a specific experience, not a general opinion
- [ ] Actionable takeaway is explicit

## Classification Test

Qualifies as a Learning iff it captures a lesson from experience ("X broke because Y"); a forward-looking rule belongs in a Policy or Standard instead.
