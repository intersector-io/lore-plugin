---
type: c4-external-system
title: "Stripe"
description: "Third-party payments platform the Billing system charges cards through."
tags: [org]
generated: { by: "human:renato@example.com", at: 2026-07-15T12:00:00.000Z }
x-lore:
  id: 01KFHTB4581XZA860FSV36B9ZB
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
---

## Boundary

Owned by Stripe, outside Acme's deploy boundary. The Billing system creates
payment intents through its API and consumes charge outcomes from its webhooks.
