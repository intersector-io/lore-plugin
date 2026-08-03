---
type: proposal
title: "One-page checkout"
description: "Collapse the four-step checkout flow into a single page to cut first-time-buyer abandonment."
tags: [org, checkout, change]
generated: { by: "human:renato@example.com", at: 2026-07-15T09:30:00Z }
x-lore:
  id: 5EN1P3Q5R7S9T1V3W5X7Y9Z1A3
  status: retired
  owners: [renato@example.com]
  links: { supersedes: [], implements: [5DM0N2P4Q6R8S0T2V4W6X8Y0Z2], constrains: [], relates: [] }
  provenance: { source: authored }
---

## Why

Funnel analytics show the steepest drop-off happens at each page transition in
the four-step checkout. Every extra page is a chance to leave; first-time
buyers, who have no saved details, feel it hardest. Collapsing the flow attacks
the abandonment target in the checkout redesign prd directly.

## What Changes

Address, shipping method, and payment collapse into a single checkout page with
inline validation. The order-review step disappears; a summary panel on the
same page replaces it. The cart API and order pipeline are untouched.
