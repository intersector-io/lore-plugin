---
type: c4-relationship
title: "Billing API → Stripe"
description: "charges customer cards via"
tags: [product]
generated: { by: "human:renato@example.com", at: 2026-07-15T12:00:00.000Z }
x-lore:
  id: 010KV8HMX3WDQC3DY26VZK9RG6
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-type:
  source: 011Q6S8NMYMAFSN2NEVZJ7DM95
  target: 01KFHTB4581XZA860FSV36B9ZB
  technology: "Stripe API over HTTPS"
---

## Interaction

The Billing API creates a payment intent per invoice and reconciles the outcome
from Stripe's webhooks.
