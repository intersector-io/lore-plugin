---
type: tasks
title: "One-page checkout tasks"
description: "Work breakdown for building and rolling out the one-page checkout."
tags: [org, checkout, change]
generated: { by: "human:renato@example.com", at: 2026-07-15T10:30:00Z }
x-lore:
  id: 5GQ3R5S7T9V1W3X5Y7Z9A1B3C5
  status: retired
  owners: [renato@example.com]
  links: { supersedes: [], implements: [5FP2Q4R6S8T0V2W4X6Y8Z0A2B4], constrains: [], relates: [] }
  provenance: { source: authored }
---

- [x] Build the combined address, shipping, and payment form over the cart API
- [x] Wire debounced inline validation for address and shipping fields
- [x] Integrate client-side payment tokenization before submit
- [x] Replace the review step with the same-page summary panel
- [x] Run the 50/50 experiment and confirm the abandonment target
- [x] Remove the old four-step flow and the experiment flag
