---
type: type
title: "ADR (Architecture Decision Record)"
description: "A significant, durable architectural decision: context, decision, and consequences."
tags: [architecture]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 2XZSW8YDASGQEJNR3DH1HB9C86
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Context
    - Decision
    - Consequences
  classification-test: "Qualifies as an ADR iff the decision is architecturally significant (hard to reverse, affects multiple teams/systems, or sets precedent) and durable. A lighter, easily-reversed choice is a Decision instead — the volume/reversibility test is the line (see CONTEXT.md \"Classification Test\")."
---

## Overview

A significant, durable architectural decision: context, decision, and consequences.

## Schema

Extra frontmatter fields for a `adr` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: adr
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

## Context

What forces are at play.

## Decision

What we decided.

## Consequences

What becomes easier or harder as a result.
```

## Worked Example

"Meta-schema in code" (see docs/adr/0002) — Context: bootstrap recursion risk; Decision: compile the meta-schema into the validation core; Consequences: one shared codebase for CLI and API.

## Reviewer Checklist

- [ ] Context, Decision, Consequences all present and non-trivial
- [ ] Architecturally significant per the classification test, not a routine call
- [ ] supersedes set if this replaces a prior ADR

## Classification Test

Qualifies as an ADR iff the decision is architecturally significant (hard to reverse, affects multiple teams/systems, or sets precedent) and durable. A lighter, easily-reversed choice is a Decision instead — the volume/reversibility test is the line (see CONTEXT.md "Classification Test").
