---
type: spec
title: "One-page checkout spec"
description: "Checkout completes on a single page with inline validation and client-side payment tokenization."
tags: [org, checkout, behaviour]
generated: { by: "human:renato@example.com", at: 2026-07-15T11:00:00Z }
x-lore:
  id: 5HR4S6T8V0W2X4Y6Z8A0B2C4D6
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [5EN1P3Q5R7S9T1V3W5X7Y9Z1A3], constrains: [], relates: [] }
  provenance: { source: authored }
---

## Behaviour

- Checkout completes on a single page: address, shipping method, payment, and
  the order summary are all visible without a page transition.
- Field-level validation runs inline; the pay button stays disabled while any
  required field is invalid, and errors name the field they belong to.
- Payment details are tokenized in the browser before submit; the server only
  ever receives the token.
- A confirmed order returns the buyer a confirmation view with the order id;
  refreshing that view never resubmits the order.
