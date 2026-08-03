---
type: adr
title: "Store embeddings in a dedicated chunks table"
description: "Embeddings move to a per-chunk table keyed by record id, tagged with the embedding model."
tags: [org, search]
generated: { by: "human:renato@example.com", at: 2026-05-06T09:00:00.000Z }
x-lore:
  id: 01KQY87XM0E4DVAFN243A9032J
  status: active
  owners: [renato@example.com]
  links: { supersedes: [01KQVNV6M04YGEWS18BZKD1NPD], implements: [], constrains: [], relates: [01KR0TMMM0F2HA9DECNG63VZPH] }
  provenance: { source: authored }
---

## Context

A single embedding per record cannot capture long, multi-section documents, and
pinning one embedding dimension to the record schema blocks provider changes.

## Decision

Store embeddings in a dedicated `chunks` table, one row per chunk, keyed by
record id and tagged with `embedding_model`. KNN runs over chunks; results are
de-duplicated back to records.

## Consequences

Long records rank on their most relevant section. Mixed-provider rows coexist
during a migration, and a clean provider cutover is a rebuild.
