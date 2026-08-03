---
type: domain-entity
title: "Order"
description: "One customer purchase in acme billing — identified by ULID, settled orders are immutable."
tags: [product]
generated: { by: "human:renato@example.com", at: 2026-07-24T12:00:00.000Z }
x-lore:
  id: 01ACME0RDER8ENT1TYXAMPWQ3D
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-type:
  attributes:
    - name: id
      kind: ulid
      description: "Identity — two orders are the same iff their ids match."
    - name: status
      kind: "enum(pending|invoiced|settled)"
      description: "Lifecycle state; transitions are forward-only."
    - name: total
      kind: money
      description: "Sum of line totals in the order currency."
---

## Definition

One customer purchase, from checkout to settlement. Identified by `id` (a
ULID); the `status` lifecycle moves forward-only through
`pending → invoiced → settled`. Invariants the billing service enforces:
`total` is never negative, a `settled` order is immutable, and an order whose
`total` exceeds 10,000 requires manual approval before invoicing.
