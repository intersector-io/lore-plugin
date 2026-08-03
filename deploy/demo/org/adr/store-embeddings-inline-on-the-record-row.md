---
type: adr
title: "Store embeddings inline on the record row"
description: "First cut: keep a single embedding column on each record row."
tags: [org, search]
generated: { by: "human:renato@example.com", at: 2026-05-05T09:00:00.000Z }
x-lore:
  id: 01KQVNV6M04YGEWS18BZKD1NPD
  status: superseded
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
---

## Context

The first indexer prototype embedded one vector per record and stored it in a
column on the record row.

## Decision

Keep a single `embedding` column on the record table.

## Consequences

Simple to query, but it cannot represent long records as multiple chunks, and it
couples the record schema to one embedding dimension. Superseded once chunking
landed.
