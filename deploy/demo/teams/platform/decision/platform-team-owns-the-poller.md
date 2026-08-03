---
type: decision
title: "Platform team owns the indexer poller"
description: "The platform team operates the standalone indexer poller for deployments whose git host cannot reach the API."
tags: [team:platform, ops]
generated: { by: "human:renato@example.com", at: 2026-05-13T09:00:00.000Z }
x-lore:
  id: 01KRG90YM0GSTD8FA08QCH530E
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
---

The platform team owns and operates the standalone indexer poller. Air-gapped
and firewalled deployments cannot receive webhooks, so they run the poller to
keep the index current. Putting one team in charge keeps the poll interval and
alerting consistent across those deployments.
