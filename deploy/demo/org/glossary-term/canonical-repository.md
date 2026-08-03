---
type: glossary-term
title: "Canonical repository"
description: "The single git repository holding all records for a deployment; the repo boundary is the confidentiality boundary."
tags: [org]
generated: { by: "human:renato@example.com", at: 2026-05-08T09:00:00.000Z }
x-lore:
  id: 01KR3D1BM0T50Z0TDNAPCSSW2K
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-type:
  related-terms: []
---

## Definition

The one git repository that holds every record for a deployment. There is
exactly one per deployment in v1. The repository boundary is the confidentiality
boundary; scopes within it are a relevance boundary, not a security one.
