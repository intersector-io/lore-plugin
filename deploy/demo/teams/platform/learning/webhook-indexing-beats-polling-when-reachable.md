---
type: learning
title: "Webhook indexing beats polling when reachable"
description: "When the git host can reach the API, in-process webhook indexing is simpler and fresher than a polling container."
tags: [team:platform, ops]
generated: { by: "human:renato@example.com", at: 2026-05-14T09:00:00.000Z }
x-lore:
  id: 01KRJVDNM014059H57PR272DWW
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [01KRG90YM0GSTD8FA08QCH530E] }
  provenance: { source: authored }
---

On a reachable deployment we compared the webhook path against the poller. The
webhook indexes in-process on each push — no extra long-running container, and
the index is fresh within seconds of a merge.

Polling only earns its keep when the git host cannot reach the API. Default to
webhooks; reach for the poller only when the network forces it.
