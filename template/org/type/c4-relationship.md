---
type: type
title: "C4 Relationship"
description: "A directed, labelled interaction from one C4 element to another (source uses/calls/notifies target)."
tags: [product]
timestamp: 2026-07-15T12:00:00Z
x-lore:
  id: 0136HVX77D1FK5WVJSTX6VRTM8
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-lore-type:
  schema:
    type: object
    required:
      - source
      - target
    properties:
      source:
        type: string
      target:
        type: string
      technology:
        type: string
  required-sections:
    - Interaction
  classification-test: "Qualifies as a C4 Relationship iff it records a single directed interaction between two C4 elements — the source uses, calls, or notifies the target — described by a verb phrase in `description` and optionally a transport in `x-type.technology`. Contract semantics (payloads, SLAs, versioning) belong in an Integration Contract instead."
---

## Overview

A directed, labelled interaction between two C4 elements: the `source` uses,
calls, or notifies the `target`. The `description` is the verb phrase drawn on
the arrow; `x-type.technology` is the optional transport. Endpoints may be at
any C4 level (a person uses a system; a container calls an external system).
Existence of both endpoints is enforced by the `c4/reference` validation rule.

## Schema

Extra frontmatter for a `c4-relationship` lives under `x-type` (see this
record's `x-lore-type.schema`): `source` (required — the ULID of the origin C4
element), `target` (required — the ULID of the destination C4 element), and
`technology` (optional — the transport/protocol). The base `description` field
is the arrow's verb phrase.

## Template

```markdown
---
type: c4-relationship
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
  source:
  target:
  technology:
---

## Interaction

What flows across this relationship, in which direction, and any notable timing
or reliability characteristics.
```

## Worked Example

"Billing API → Stripe" — description: "charges customer cards via"; technology:
"Stripe API over HTTPS". Interaction: the Billing API creates a payment intent
per invoice and reconciles the outcome from Stripe's webhook.

## Reviewer Checklist

- [ ] `source` and `target` name existing C4 elements
- [ ] `description` is a directed verb phrase (source → target)
- [ ] Is an interaction, not a contract (else use an Integration Contract)

## Classification Test

Qualifies as a C4 Relationship iff it records a single directed interaction
between two C4 elements — the source uses, calls, or notifies the target —
described by a verb phrase in `description` and optionally a transport in
`x-type.technology`. Contract semantics (payloads, SLAs, versioning) belong in
an Integration Contract instead.
