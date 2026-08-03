---
type: design
title: "One-page checkout design"
description: "The one-page checkout renders client-side over the existing cart API with inline validation and client-side payment tokenization."
tags: [org, checkout, change]
generated: { by: "human:renato@example.com", at: 2026-07-15T10:00:00Z }
x-lore:
  id: 5FP2Q4R6S8T0V2W4X6Y8Z0A2B4
  status: retired
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [5EN1P3Q5R7S9T1V3W5X7Y9Z1A3] }
  provenance: { source: authored }
---

## Decisions

- Render the combined page client-side over the existing cart API — no new
  backend endpoints, so the order pipeline stays untouched as the proposal
  requires.
- Validate address and shipping inline per field, debounced, so errors surface
  before the buyer reaches the pay button.
- Tokenize payment client-side before submit; the server never sees raw card
  data, which keeps the PCI scope where it already is.
- Ship behind a 50/50 experiment flag so the abandonment target can be measured
  against the old flow before full rollout.
