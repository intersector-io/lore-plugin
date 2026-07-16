---
type: type
title: "Glossary Term"
description: "A definition in the team's ubiquitous language, with context and related terms."
tags: [org]
timestamp: 2026-07-11T12:00:00Z
x-lore:
  id: 68ZDFQWPSK0WCGCFYHBGD686EE
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
    properties:
      related-terms:
        type: array
        items:
          type: string
  required-sections:
    - Definition
  classification-test: "Qualifies as a Glossary Term iff its purpose is to fix the meaning of a word or phrase the team uses, not to record a decision, process, or capability that happens to use that word."
---

## Overview

A definition in the team's ubiquitous language, with context and related terms.

## Schema

Extra frontmatter fields for a `glossary-term` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: glossary-term
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
  related-terms: []
---

## Definition

One or two sentences fixing the term's meaning, plus the context it's used in.
```

## Worked Example

"Scope" — a flat visibility label (`org`, `product:<slug>`, `team:<slug>`) derived from repo path, never stored in frontmatter. `related-terms: [grant, canonical repository]`.

## Reviewer Checklist

- [ ] Definition is unambiguous on its own, without requiring the reader to already know the term
- [ ] related-terms point to genuinely related, not merely co-occurring, terms

## Classification Test

Qualifies as a Glossary Term iff its purpose is to fix the meaning of a word or phrase the team uses, not to record a decision, process, or capability that happens to use that word.
