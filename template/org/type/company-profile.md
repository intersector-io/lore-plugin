---
type: type
title: "Company Profile"
description: "The one org-scope record describing the company itself: who it serves, how it makes money, what makes it different."
tags: [org]
timestamp: 2026-07-21T12:00:00Z
x-lore:
  id: 01KY22AWK77BKG1AZZ4S6Z0WBE
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
  required-sections:
    - Customers
    - Business Model
    - Differentiation
  classification-test: "Qualifies as a Company Profile iff it describes the company itself — who it serves, how it makes money, what makes it different — for the whole deployment; expect exactly one active org-scope record. What the company sells belongs in Product records, a durable value in a Principle, an implementation-independent ability in a Business Capability."
---

## Overview

The one org-scope record describing the company itself: who it serves, how it makes money, what makes it different. Together with the org's Principle and Product records it forms the starter set the session-start org brief surfaces to agents (docs/issues/0059) — the durable context every session should begin with.

## Schema

Extra frontmatter fields for a `company-profile` record live under `x-type`. See the schema in this record's `x-lore-type.schema` (frontmatter above) for the machine-checked shape.

## Template

```markdown
---
type: company-profile
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

## Customers

Who the company serves, and the problem it solves for them.

## Business Model

How the company makes money.

## Differentiation

What makes it different from the alternatives customers would otherwise pick.
```

## Worked Example

"Acme Commerce, Inc." (see the demo seed) — Customers: mid-size merchants outgrowing hosted storefronts; Business Model: platform subscription plus a share of payment volume; Differentiation: one-page checkout conversion and operational simplicity.

## Reviewer Checklist

- [ ] Customers, Business Model, Differentiation all present and specific — no mission-statement filler
- [ ] Exactly one active `company-profile` record in the org scope after this change (supersede, don't duplicate)
- [ ] Nothing here that belongs in a Product record or a Principle

## Classification Test

Qualifies as a Company Profile iff it describes the company itself — who it serves, how it makes money, what makes it different — for the whole deployment; expect exactly one active org-scope record. What the company sells belongs in Product records, a durable value in a Principle, an implementation-independent ability in a Business Capability.
