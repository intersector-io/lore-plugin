---
type: glossary-term
title: "Draft branch"
description: "A branch matching draft/** — the only non-main refs the indexer ingests."
tags: [org]
generated: { by: "human:renato@example.com", at: 2026-05-09T09:00:00.000Z }
x-lore:
  id: 01KR5ZE2M0GNC7A9MP3RGK45SQ
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-type:
  related-terms: []
---

## Definition

A branch whose name matches `draft/**`. These are the only non-`main` refs the
indexer ingests, so work-in-progress is searchable before promotion. A record is
canonical only once its file exists on `main`.
