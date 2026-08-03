---
type: standard
title: "Record architectural decisions as ADRs"
description: "Architecturally significant, hard-to-reverse choices are captured as ADRs with Context / Decision / Consequences."
tags: [org]
generated: { by: "human:renato@example.com", at: 2026-05-02T09:00:00.000Z }
stale_after: 2026-07-01
x-lore:
  id: 01KQKYN1M021JQJJVP883GC0GR
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-type:
  enforcement: mandatory
---

Any decision that is hard to reverse, affects more than one team, or sets a
precedent must be recorded as an ADR before it ships. Lighter, easily-reversed
choices are Decisions instead.

An ADR states the forces in play, the choice made, and what becomes easier or
harder as a result — so a future reader inherits the reasoning, not just the
outcome.
