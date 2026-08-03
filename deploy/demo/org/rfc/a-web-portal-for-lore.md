---
type: rfc
title: "A web portal for lore"
description: "Proposes a whole-team read/observe/govern web surface over a running deployment, without becoming an authoring tool."
tags: [org, portal]
generated: { by: "human:renato@example.com", at: 2026-05-04T09:00:00.000Z }
x-lore:
  id: 01KQS3EFM0RCFDM2GJ8K08JMTR
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [01KQPH1RM0HN1JDD8SNF88NK54] }
  provenance: { source: authored }
---

## Proposal

Today the only human surfaces are git, editors, and the marketing site. This
RFC proposes a whole-team **portal**: keyboard-first search, read-only record
browsing, small usage and knowledge-health dashboards, grants editing via pull
request, and a self-serve setup wizard.

Open question resolved during review: should the portal ever author canon? No —
the agent stays the authoring interface; the portal is read/observe/govern only.
This graduated into ADR-0006 once accepted.
