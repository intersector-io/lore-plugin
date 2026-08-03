---
type: company-profile
title: "Acme Commerce, Inc."
description: "Who Acme Commerce serves, how it makes money, and why merchants pick it over hosted storefronts."
tags: [org]
generated: { by: "human:renato@example.com", at: 2026-07-21T12:00:00Z }
x-lore:
  id: 01KY22AWKB3EVXDQZG08H657SW
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
---

## Customers

Mid-size online merchants (roughly 1–50M in annual sales) who have outgrown
hosted storefront builders but don't want to run a bespoke commerce stack.
The buyer is usually the merchant's head of e-commerce; the daily users are
their storefront and operations teams.

## Business Model

A platform subscription per storefront, plus a small share of processed
payment volume (settled through Stripe — see the Stripe external-system
record). Expansion revenue comes from merchants adding storefronts and
turning on checkout add-ons, not from seat counts.

## Differentiation

Checkout conversion is the product: the one-page checkout program (see the
checkout redesign PRD and its decision chain) exists because Acme wins
deals on measured conversion lift over the hosted builders, while staying
operationally simpler than a self-built stack.
