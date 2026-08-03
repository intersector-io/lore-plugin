---
type: adr
title: "Adopt hybrid search for retrieval"
description: "Retrieval combines lexical tsvector search with vector KNN, fused by reciprocal rank fusion."
tags: [org, search]
generated: { by: "human:renato@example.com", at: 2026-05-03T09:00:00.000Z }
x-lore:
  id: 01KQPH1RM0HN1JDD8SNF88NK54
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [01KQHC8AM0CW96WS3WV6K3ZMD4], constrains: [], relates: [01KQS3EFM0RCFDM2GJ8K08JMTR] }
  provenance: { source: authored }
---

## Context

Pure keyword search misses paraphrases; pure vector search misses exact terms,
identifiers, and rare tokens. Agents need both recall and precision over a
knowledge base that mixes prose with code-like identifiers.

## Decision

Retrieve with a hybrid of Postgres `tsvector` full-text search and pgvector
KNN over chunk embeddings, fused with reciprocal rank fusion (RRF). One SQL
round-trip returns a single ranked list.

## Consequences

Recall improves for both natural-language and identifier queries. The index now
carries embeddings, so a provider or dimension change means a rebuild — accepted
because the index is disposable (see the git-is-the-source-of-truth principle).
