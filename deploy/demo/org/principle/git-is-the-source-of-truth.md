---
type: principle
title: "Git is the source of truth"
description: "Every record is a file on main of the canonical git repository; the search index is a disposable projection of it."
tags: [org]
generated: { by: "human:renato@example.com", at: 2026-05-01T09:00:00.000Z }
x-lore:
  id: 01KQHC8AM0CW96WS3WV6K3ZMD4
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
---

The canonical git repository is the single source of truth for all
knowledge. Postgres, embeddings, and every derived edge are a projection that
can be rebuilt from `main` at any time. Losing the index is an outage, never
data loss — recovery is a `rebuild`, not a restore.

This principle is why lore never stores derivable facts (scope, draft/canonical
status, creation time) in frontmatter: they are read back out of git placement
and history by the indexer.
