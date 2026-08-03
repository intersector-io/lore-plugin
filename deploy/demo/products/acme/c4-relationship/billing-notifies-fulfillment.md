---
type: c4-relationship
title: "Billing API → Fulfillment API"
description: "notifies of paid orders via"
tags: [product]
generated: { by: "human:renato@example.com", at: 2026-07-15T12:00:00.000Z }
x-lore:
  id: 01VMA2Y9QRTAYY2PRH9K2JBEXH
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-type:
  source: 011Q6S8NMYMAFSN2NEVZJ7DM95
  target: 01M4YB5WDFF5QFKPWJFS2JTCCC
  technology: "REST"
---

## Interaction

When an invoice is paid, the Billing API notifies the Fulfillment API so the
order can move into fulfillment. A cross-system relationship between two systems.
